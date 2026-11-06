// extension/popup.js
// HireMe AI Extension Popup Controller – Supports Per-User Duplicate Alerts & Live Sync

const API = 'https://hireme-aryan.vercel.app';
let currentScrapedJob = null;

// Helper: Read active user session directly from Chrome cookie jar
async function getActiveUserSession() {
  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.cookies && chrome.cookies.get) {
      chrome.cookies.get({ url: API, name: 'hireme_session' }, (cookie) => {
        if (cookie && cookie.value) {
          try {
            const user = JSON.parse(decodeURIComponent(cookie.value));
            resolve(user);
            return;
          } catch {}
        }
        resolve(null);
      });
    } else {
      resolve(null);
    }
  });
}

function getScoreColor(score) {
  if (score >= 80) return '#34d399';
  if (score >= 60) return '#f59e0b';
  return '#f87171';
}

function getMatchQualityLabel(score) {
  if (score >= 80) return 'Strong Match';
  if (score >= 60) return 'Moderate Match';
  return 'Low Match / Skill Gap';
}

function cleanText(str) {
  if (!str) return '';
  return str.replace(/[\r\n\t]+/g, ' ').replace(/\s{2,}/g, ' ').trim();
}

function getCanonicalUrlFromTab(url) {
  try {
    const urlObj = new URL(url);
    const jobId = urlObj.searchParams.get('currentJobId') || (url.match(/\/jobs\/view\/(\d+)/) || [])[1];
    if (jobId && /^\d+$/.test(jobId)) {
      return `https://www.linkedin.com/jobs/view/${jobId}/`;
    }
  } catch {}
  return url || 'https://www.linkedin.com/jobs/';
}

// ─── 1. Check Server Auth & Load Lifetime Stats ──────────────────────────────
async function loadServerStats() {
  const authBadge = document.getElementById('auth-badge');
  const statJobs = document.getElementById('stat-today');
  const statScore = document.getElementById('stat-score');

  try {
    const session = await getActiveUserSession();
    const reqHeaders = {};
    if (session?.userId) reqHeaders['x-user-id'] = session.userId;

    const res = await fetch(`${API}/api/extension-stats`, {
      headers: reqHeaders,
      credentials: 'include',
    });
    const data = await res.json();

    if (!data.success) {
      if (authBadge) {
        authBadge.textContent = '🔒 Sign in at hireme-aryan.vercel.app';
        authBadge.className = 'badge badge-purple';
        authBadge.style.color = '#f59e0b';
      }
      if (statJobs) statJobs.textContent = '—';
      if (statScore) statScore.textContent = '—';
      return;
    }

    if (authBadge) {
      authBadge.innerHTML = '<span class="dot"></span>Connected';
      authBadge.className = 'badge badge-green';
    }

    const { analyses, avgHireScore } = data.stats || {};
    if (statJobs) statJobs.textContent = analyses?.total ?? '0';
    if (statScore) {
      statScore.textContent = avgHireScore !== null && avgHireScore !== undefined ? `${avgHireScore}%` : '—';
      if (avgHireScore !== null && avgHireScore !== undefined) {
        statScore.style.color = getScoreColor(avgHireScore);
      }
    }
  } catch (err) {
    if (authBadge) {
      authBadge.textContent = '⚠️ Server Offline';
      authBadge.className = 'badge';
      authBadge.style.color = '#f87171';
    }
    if (statJobs) statJobs.textContent = '—';
    if (statScore) statScore.textContent = '—';
  }
}

// ─── 2. Inspect Active Tab & Detect LinkedIn Job ─────────────────────────────
async function checkActiveTab() {
  const tabPill = document.getElementById('tab-pill');
  const jobTitleEl = document.getElementById('scraped-job-title');
  const jobCompanyEl = document.getElementById('scraped-job-company');
  const evalBtn = document.getElementById('btn-evaluate-job');

  if (!chrome.tabs || !chrome.tabs.query) {
    if (tabPill) tabPill.textContent = 'Extension Preview';
    return;
  }

  try {
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!activeTab || !activeTab.url) {
      if (tabPill) tabPill.textContent = 'No Active Tab';
      return;
    }

    const isLinkedIn = activeTab.url.includes('linkedin.com');

    if (!isLinkedIn) {
      if (tabPill) {
        tabPill.textContent = 'Not on LinkedIn';
        tabPill.className = 'badge';
        tabPill.style.color = '#94a3b8';
      }
      if (jobTitleEl) jobTitleEl.textContent = 'No LinkedIn Job Detected';
      if (jobCompanyEl) jobCompanyEl.textContent = 'Open any job posting on LinkedIn to evaluate match score.';
      if (evalBtn) {
        evalBtn.disabled = true;
        evalBtn.textContent = '⚠️ Open LinkedIn Job First';
        evalBtn.style.opacity = '0.6';
      }
      return;
    }

    // Tab is on LinkedIn
    if (tabPill) {
      tabPill.innerHTML = '<span class="dot"></span>LinkedIn Open';
      tabPill.className = 'badge badge-green';
    }

    // Try messaging the content script
    chrome.tabs.sendMessage(activeTab.id, { action: 'SCRAPE_JOB' }, async (response) => {
      if (chrome.runtime.lastError || !response || !response.title) {
        // Content script might not be injected yet, try injecting scraper scripts
        try {
          if (chrome.scripting && chrome.scripting.executeScript) {
            await chrome.scripting.executeScript({
              target: { tabId: activeTab.id },
              files: [
                'scraper/job-title.js',
                'scraper/company.js',
                'scraper/description.js',
                'scraper/location.js',
                'scraper/metadata.js',
                'content.js'
              ],
            });

            // Re-try message after injection
            setTimeout(() => {
              chrome.tabs.sendMessage(activeTab.id, { action: 'SCRAPE_JOB' }, (secondResp) => {
                if (secondResp && secondResp.title) {
                  currentScrapedJob = secondResp;
                  renderDetectedJob(secondResp);
                } else {
                  fallbackUrlDetection(activeTab.url, activeTab.title);
                }
              });
            }, 300);
            return;
          }
        } catch (e) {
          console.warn('Script injection error:', e);
        }

        fallbackUrlDetection(activeTab.url, activeTab.title);
        return;
      }

      currentScrapedJob = response;
      renderDetectedJob(response);
    });
  } catch (err) {
    console.error('Error querying tabs:', err);
  }
}

function fallbackUrlDetection(url, docTitle) {
  const jobTitleEl = document.getElementById('scraped-job-title');
  const jobCompanyEl = document.getElementById('scraped-job-company');
  const evalBtn = document.getElementById('btn-evaluate-job');

  let title = 'LinkedIn Job Position';
  let company = 'Company on LinkedIn';
  const canonicalUrl = getCanonicalUrlFromTab(url);

  if (docTitle && docTitle.includes('| LinkedIn')) {
    const preLinkedIn = docTitle.replace(/^\(\d+\+?\)\s*/, '').split('| LinkedIn')[0].trim();
    if (preLinkedIn.includes('|')) {
      const parts = preLinkedIn.split('|').map(cleanText);
      title = parts[0] || title;
      company = parts[1] || company;
    } else {
      title = cleanText(preLinkedIn);
    }
  }

  try {
    const urlObj = new URL(url);
    const jobId = urlObj.searchParams.get('currentJobId') || (url.match(/\/jobs\/view\/(\d+)/) || [])[1];
    const keywords = urlObj.searchParams.get('keywords');
    if (jobId) {
      if (keywords && title === 'LinkedIn Job Position') {
        const firstKw = cleanText(decodeURIComponent(keywords).split(/ or |,|\|/i)[0]);
        title = `${firstKw} (Job #${jobId})`;
      } else if (title === 'LinkedIn Job Position') {
        title = `LinkedIn Position #${jobId}`;
      }
    }
  } catch {}

  currentScrapedJob = {
    title,
    company,
    description: '',
    url: canonicalUrl,
    location: 'Remote / Hybrid',
    source: 'linkedin',
  };

  renderDetectedJob(currentScrapedJob);
}

async function renderDetectedJob(job) {
  const jobTitleEl = document.getElementById('scraped-job-title');
  const jobCompanyEl = document.getElementById('scraped-job-company');
  const evalBtn = document.getElementById('btn-evaluate-job');
  const tabPill = document.getElementById('tab-pill');

  if (job && job.title) {
    if (jobTitleEl) jobTitleEl.textContent = job.title;
    if (jobCompanyEl) {
      jobCompanyEl.textContent = `${job.company || 'LinkedIn'} · ${job.location || 'Remote/Hybrid'}`;
    }
    if (evalBtn) {
      evalBtn.disabled = false;
      evalBtn.textContent = '✨ Evaluate Current Job Posting';
      evalBtn.style.opacity = '1';
    }

    // Check if ALREADY Evaluated by this specific logged-in user
    try {
      const session = await getActiveUserSession();
      const reqHeaders = {};
      if (session?.userId) reqHeaders['x-user-id'] = session.userId;

      const canonicalUrl = job.url || getCanonicalUrlFromTab(window.location.href);
      const res = await fetch(
        `${API}/api/analyze-job?url=${encodeURIComponent(canonicalUrl)}&title=${encodeURIComponent(job.title)}&company=${encodeURIComponent(job.company || '')}`,
        {
          headers: reqHeaders,
          credentials: 'include',
        }
      );
      const checkData = await res.json();

      if (checkData.success && checkData.alreadyEvaluated && checkData.existingEvaluation) {
        if (tabPill) {
          tabPill.innerHTML = '<span class="dot"></span>Already Evaluated';
          tabPill.className = 'badge badge-purple';
          tabPill.style.color = '#a5b4fc';
        }
        if (evalBtn) {
          evalBtn.innerHTML = '🔄 Re-Evaluate Job Posting';
        }
        displayEvaluationResult(checkData.existingEvaluation, true);
      }
    } catch {}
  }
}

// ─── 3. Run In-Popup Evaluation ──────────────────────────────────────────────
async function handleEvaluateClick() {
  const evalBtn = document.getElementById('btn-evaluate-job');

  if (evalBtn) {
    evalBtn.disabled = true;
    evalBtn.innerHTML = '⏳ Scoring with HireMe AI…';
  }

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (tab?.id) {
      await new Promise((resolve) => {
        chrome.tabs.sendMessage(tab.id, { action: 'SCRAPE_JOB' }, (res) => {
          if (res && res.title) {
            currentScrapedJob = res;
          }
          resolve();
        });
      });
    }

    const title = currentScrapedJob?.title || 'Web Developer / Software Engineer';
    const company = currentScrapedJob?.company || 'Company on LinkedIn';
    const description = currentScrapedJob?.description || `${title} at ${company}. Required skills: Web Development, React, TypeScript, Node.js, Frontend, Backend.`;
    const canonicalUrl = currentScrapedJob?.url || getCanonicalUrlFromTab(tab?.url || '');
    const location = currentScrapedJob?.location || 'Remote / Hybrid';

    const payload = {
      title,
      jobTitle: title,
      company,
      description,
      jobDescription: description,
      url: canonicalUrl,
      source: 'linkedin',
      location,
    };

    const session = await getActiveUserSession();
    const reqHeaders = { 'Content-Type': 'application/json' };
    if (session?.userId) reqHeaders['x-user-id'] = session.userId;

    const res = await fetch(`${API}/api/analyze-job`, {
      method: 'POST',
      headers: reqHeaders,
      credentials: 'include',
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      alert(data.error || 'Failed to analyze job. Please make sure you are signed in at https://hireme-aryan.vercel.app');
      if (evalBtn) {
        evalBtn.disabled = false;
        evalBtn.textContent = '✨ Retry Job Evaluation';
      }
      return;
    }

    const analysis = data.analysis || {};
    const match = data.match || {};
    const employment = data.employment || analysis.employment || match.employment || {};

    displayEvaluationResult({
      jobTitle: analysis.jobTitle || title,
      company: analysis.company || company,
      hireScore: analysis.hireScore ?? match.hireScore ?? 75,
      matchedSkills: analysis.matchedSkills || match.matchedSkills || [],
      missingSkills: analysis.missingSkills || match.missingSkills || [],
      employmentType: employment.employmentType || analysis.employmentType,
      compensationType: employment.compensationType || analysis.compensationType,
      compensation: employment.compensation || analysis.compensation,
      displayCompensation: employment.displayString,
    }, false);

    if (evalBtn) {
      evalBtn.disabled = false;
      evalBtn.innerHTML = '🔄 Re-Evaluate Job';
    }

    loadServerStats();

  } catch (err) {
    console.error('Analysis error:', err);
    alert('Could not connect to HireMe server. Ensure https://hireme-aryan.vercel.app is accessible.');
    if (evalBtn) {
      evalBtn.disabled = false;
      evalBtn.textContent = '✨ Evaluate Current Job Posting';
    }
      evalBtn.textContent = '✨ Evaluate Current Job Posting';
    }
  }
}

function displayEvaluationResult(evalData, isExisting = false) {
  const resultCard = document.getElementById('eval-result-card');
  const scoreCircle = document.getElementById('result-score-circle');
  const scoreLabel = document.getElementById('result-score-label');
  const jobMeta = document.getElementById('result-job-meta');
  const matchedSkillsEl = document.getElementById('result-matched-skills');
  const missingSkillsEl = document.getElementById('result-missing-skills');

  const score = evalData.hireScore ?? 75;
  const color = getScoreColor(score);

  // Role Type & Compensation (Internship vs Job, Stipend vs CTC)
  const isIntern = evalData.employmentType
    ? evalData.employmentType.toLowerCase().includes('intern')
    : /\b(?:intern|internship|trainee)\b/i.test(`${evalData.jobTitle || ''} ${evalData.company || ''}`);
  const empType = evalData.employmentType || (isIntern ? 'Internship' : 'Job');
  const compType = evalData.compensationType || (empType === 'Internship' ? 'Stipend' : 'CTC');
  const comp = evalData.compensation || (evalData.salaryRange && evalData.salaryRange !== 'Competitive' ? evalData.salaryRange : 'Not Disclosed');

  const empTypeEl = document.getElementById('result-emp-type');
  const compEl = document.getElementById('result-compensation');
  if (empTypeEl) {
    empTypeEl.textContent = empType;
    if (empType === 'Internship') {
      empTypeEl.style.color = '#c084fc';
      empTypeEl.style.background = 'rgba(192,132,252,0.15)';
      empTypeEl.style.borderColor = 'rgba(192,132,252,0.3)';
    } else {
      empTypeEl.style.color = '#34d399';
      empTypeEl.style.background = 'rgba(52,211,153,0.15)';
      empTypeEl.style.borderColor = 'rgba(52,211,153,0.3)';
    }
  }
  if (compEl) {
    compEl.textContent = `${compType} : ${comp}`;
  }

  if (scoreCircle) {
    scoreCircle.textContent = `${score}%`;
    scoreCircle.style.color = color;
    scoreCircle.style.borderColor = color;
    scoreCircle.style.background = `${color}20`;
  }

  if (scoreLabel) {
    scoreLabel.textContent = `${score}% — ${getMatchQualityLabel(score)} ${isExisting ? '(Saved)' : ''}`;
    scoreLabel.style.color = color;
  }

  if (jobMeta) {
    jobMeta.textContent = `${evalData.jobTitle} at ${evalData.company}`;
  }

  if (matchedSkillsEl) {
    const matched = evalData.matchedSkills || [];
    matchedSkillsEl.innerHTML = matched.length > 0
      ? matched.slice(0, 8).map(s => `<span class="chip chip-green">✓ ${s}</span>`).join('')
      : '<span style="font-size:10px; color:#94a3b8;">None detected</span>';
  }

  if (missingSkillsEl) {
    const missing = evalData.missingSkills || [];
    missingSkillsEl.innerHTML = missing.length > 0
      ? missing.slice(0, 8).map(s => `<span class="chip chip-red">✗ ${s}</span>`).join('')
      : '<span style="font-size:10px; color:#34d399;">All required skills matched!</span>';
  }

  if (resultCard) {
    resultCard.style.display = 'block';
  }
}

// ─── Initialization ─────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  loadServerStats();
  checkActiveTab();

  const evalBtn = document.getElementById('btn-evaluate-job');
  if (evalBtn) {
    evalBtn.addEventListener('click', handleEvaluateClick);
  }

  const copyBtn = document.getElementById('btn-copy-job-link');
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      const targetUrl = currentScrapedJob?.url || 'https://www.linkedin.com/jobs/';
      navigator.clipboard.writeText(targetUrl).then(() => {
        copyBtn.textContent = '✓ Copied Link to Clipboard!';
        setTimeout(() => { copyBtn.textContent = '📋 Copy LinkedIn Job Link'; }, 2500);
      });
    });
  }
});
