// extension/popup.js
// HireMe AI Extension Popup Controller – Multi-Backend Sync & Bulletproof LinkedIn Extraction

const CANDIDATE_APIS = [
  'http://localhost:3001',
  'http://localhost:3000',
  'https://hireme-aryan.vercel.app'
];
let activeApiUrl = 'https://hireme-aryan.vercel.app';
let currentScrapedJob = null;

function cleanText(str) {
  if (!str) return '';
  return str.replace(/[\r\n\t]+/g, ' ').replace(/\s{2,}/g, ' ').trim();
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

// ─── 0. Dynamic Backend Resolution ──────────────────────────────────────────
async function resolveActiveBackend() {
  // 1. Check open browser tabs for localhost or vercel
  try {
    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query) {
      const allTabs = await chrome.tabs.query({});
      for (const t of allTabs) {
        if (!t.url) continue;
        if (t.url.includes('localhost:3001')) return 'http://localhost:3001';
        if (t.url.includes('localhost:3000')) return 'http://localhost:3000';
      }
    }
  } catch {}

  // 2. Check cookies across all candidate domains for active session
  try {
    if (typeof chrome !== 'undefined' && chrome.cookies && chrome.cookies.get) {
      for (const domainUrl of CANDIDATE_APIS) {
        const cookie = await new Promise((resolve) => {
          chrome.cookies.get({ url: domainUrl, name: 'hireme_session' }, (c) => resolve(c));
          setTimeout(() => resolve(null), 350);
        });
        if (cookie && cookie.value) {
          return domainUrl;
        }
      }
    }
  } catch {}

  return 'https://hireme-aryan.vercel.app';
}

async function getActiveUserSession(serverUrl) {
  return new Promise((resolve) => {
    try {
      if (typeof chrome !== 'undefined' && chrome.cookies && chrome.cookies.get) {
        chrome.cookies.get({ url: serverUrl, name: 'hireme_session' }, (cookie) => {
          if (cookie && cookie.value) {
            try {
              const user = JSON.parse(decodeURIComponent(cookie.value));
              resolve(user);
              return;
            } catch {}
          }
          resolve(null);
        });
        setTimeout(() => resolve(null), 600);
      } else {
        resolve(null);
      }
    } catch {
      resolve(null);
    }
  });
}

// ─── 1. Check Server Auth & Load Lifetime Stats ──────────────────────────────
async function loadServerStats() {
  const authBadge = document.getElementById('auth-badge');
  const statJobs = document.getElementById('stat-today');
  const statScore = document.getElementById('stat-score');

  try {
    activeApiUrl = await resolveActiveBackend();
    const session = await getActiveUserSession(activeApiUrl);
    const reqHeaders = {};
    if (session?.userId) reqHeaders['x-user-id'] = session.userId;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(`${activeApiUrl}/api/extension-stats`, {
      headers: reqHeaders,
      credentials: 'include',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const data = await res.json();

    if (!data.success) {
      if (authBadge) {
        authBadge.textContent = '🔒 Sign in';
        authBadge.className = 'badge badge-purple';
        authBadge.style.color = '#f59e0b';
        authBadge.style.cursor = 'pointer';
        authBadge.onclick = () => window.open(`${activeApiUrl}/login`, '_blank');
      }
      if (statJobs) statJobs.textContent = '—';
      if (statScore) statScore.textContent = '—';
      return;
    }

    if (authBadge) {
      const serverLabel = activeApiUrl.includes('localhost:3001')
        ? 'Local :3001'
        : activeApiUrl.includes('localhost:3000')
        ? 'Local :3000'
        : 'Connected';
      authBadge.innerHTML = `<span class="dot"></span>${serverLabel}`;
      authBadge.className = 'badge badge-green';
      authBadge.title = `Connected to ${activeApiUrl}`;
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
      authBadge.textContent = '● Offline Mode';
      authBadge.className = 'badge';
      authBadge.style.color = '#94a3b8';
      authBadge.style.cursor = 'pointer';
      authBadge.onclick = () => loadServerStats();
    }
    if (statJobs) statJobs.textContent = '—';
    if (statScore) statScore.textContent = '—';
  }
}

// ─── 2. Bulletproof LinkedIn Tab Detection & Extraction ─────────────────────
async function getTargetTab() {
  try {
    let tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tabs || !tabs[0] || !tabs[0].url || tabs[0].url.startsWith('chrome-extension://')) {
      tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    }
    if (!tabs || !tabs[0] || !tabs[0].url || !tabs[0].url.includes('linkedin.com')) {
      const linkedInTabs = await chrome.tabs.query({ url: '*://*.linkedin.com/*' });
      if (linkedInTabs && linkedInTabs.length > 0) {
        tabs = [linkedInTabs.find((t) => t.active) || linkedInTabs[0]];
      }
    }
    return tabs && tabs[0] ? tabs[0] : null;
  } catch {
    return null;
  }
}

async function checkActiveTab() {
  const tabPill = document.getElementById('tab-pill');
  const jobTitleEl = document.getElementById('scraped-job-title');
  const jobCompanyEl = document.getElementById('scraped-job-company');
  const evalBtn = document.getElementById('btn-evaluate-job');

  if (typeof chrome === 'undefined' || !chrome.tabs || !chrome.tabs.query) {
    if (tabPill) tabPill.textContent = 'Extension Preview';
    return;
  }

  try {
    const activeTab = await getTargetTab();

    if (!activeTab || !activeTab.url) {
      if (tabPill) tabPill.textContent = 'No Tab';
      if (jobTitleEl) jobTitleEl.textContent = 'No Active Tab Detected';
      if (jobCompanyEl) jobCompanyEl.textContent = 'Please switch to your browser window with LinkedIn.';
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

    // Active tab is LinkedIn!
    if (tabPill) {
      tabPill.innerHTML = '<span class="dot"></span>LinkedIn Open';
      tabPill.className = 'badge badge-green';
    }

    // Tier 1: Instant Preview from URL & Document Title (0ms)
    fallbackUrlDetection(activeTab.url, activeTab.title);

    // Tier 2: Direct In-Tab DOM Extraction via chrome.scripting (Rock-solid, no message port drops)
    try {
      if (chrome.scripting && chrome.scripting.executeScript && activeTab.id) {
        const results = await chrome.scripting.executeScript({
          target: { tabId: activeTab.id },
          func: inTabScrapeJobPosting,
        });

        if (results && results[0] && results[0].result && results[0].result.title) {
          currentScrapedJob = results[0].result;
          renderDetectedJob(currentScrapedJob);
          return;
        }
      }
    } catch (scriptErr) {
      console.warn('[HireMe] Scripting DOM extraction fallback:', scriptErr);
    }

    // Tier 3: Content Script Messaging Fallback
    if (activeTab.id) {
      chrome.tabs.sendMessage(activeTab.id, { action: 'SCRAPE_JOB' }, (response) => {
        if (!chrome.runtime.lastError && response && response.title) {
          currentScrapedJob = response;
          renderDetectedJob(response);
        }
      });
    }
  } catch (err) {
    console.error('[HireMe] Error checking active tab:', err);
  }
}

// Function injected directly into LinkedIn page context
function inTabScrapeJobPosting() {
  function clean(s) {
    return (s || '').replace(/[\r\n\t]+/g, ' ').replace(/\s{2,}/g, ' ').trim();
  }

  function getJobId() {
    try {
      const p = new URLSearchParams(window.location.search);
      const qId = p.get('currentJobId');
      if (qId && /^\d+$/.test(qId)) return qId;
      const match = window.location.pathname.match(/\/jobs\/view\/(\d+)/);
      return match ? match[1] : null;
    } catch {
      return null;
    }
  }

  const jobId = getJobId();

  // 1. Extract Job Title
  let title = '';
  const titleSelectors = [
    'div[data-view-name="job-details"] h1',
    'section[aria-label="Primary content"] h1',
    '.job-details-jobs-unified-top-card__job-title h1',
    '.job-details-jobs-unified-top-card__job-title',
    '.jobs-unified-top-card__job-title h1',
    '.jobs-unified-top-card__job-title',
    'main h1',
    'h1[class*="job-title"]',
    'h1'
  ];

  for (const s of titleSelectors) {
    const el = document.querySelector(s);
    if (el) {
      const raw = clean(el.innerText || el.textContent);
      const firstLine = raw.split(/\n/)[0].trim().replace(/\s*(?:verified|promoted|actively recruiting|easy apply)\s*$/i, '');
      if (firstLine.length > 2 && firstLine.length < 120 && !/^(search|jobs|feed|messaging|notifications)$/i.test(firstLine)) {
        title = firstLine;
        break;
      }
    }
  }

  if (!title && jobId) {
    const cardTitle = document.querySelector(`[data-job-id="${jobId}"] .job-card-list__title, a[href*="/jobs/view/${jobId}"]`);
    if (cardTitle) title = clean(cardTitle.innerText || cardTitle.textContent);
  }

  if (!title && document.title && document.title.includes('| LinkedIn')) {
    const pre = document.title.replace(/^\(\d+\+?\)\s*/, '').split('| LinkedIn')[0].trim();
    title = clean(pre.split('|')[0] || pre);
  }

  // 2. Extract Company Name
  let company = '';
  const compSelectors = [
    'div[data-view-name="job-details"] a[href*="/company/"]',
    '.job-details-jobs-unified-top-card__company-name a',
    '.job-details-jobs-unified-top-card__company-name',
    '.jobs-unified-top-card__company-name a',
    '.jobs-unified-top-card__company-name',
    'a[href*="/company/"]',
    'div[aria-label^="Company, "]'
  ];

  for (const s of compSelectors) {
    const el = document.querySelector(s);
    if (el) {
      const aria = el.getAttribute('aria-label');
      if (aria && aria.startsWith('Company, ')) {
        company = clean(aria.replace('Company, ', ''));
        break;
      }
      const raw = clean(el.innerText || el.textContent);
      if (raw.length > 1 && raw.length < 80 && !/^(linkedin|search|jobs|company|about)$/i.test(raw)) {
        company = raw;
        break;
      }
    }
  }

  if (!company && document.title && document.title.includes('| LinkedIn')) {
    const pre = document.title.replace(/^\(\d+\+?\)\s*/, '').split('| LinkedIn')[0].trim();
    if (pre.includes('|')) {
      const parts = pre.split('|').map(clean);
      if (parts[1]) company = parts[1];
    }
  }

  // 3. Extract Location & Workplace Type
  let location = 'Remote / Hybrid';
  const locSelectors = [
    'div[aria-label^="Location, "]',
    '.jobs-unified-top-card__bullet',
    '.job-details-jobs-unified-top-card__primary-description span',
    '.jobs-unified-top-card__primary-description span',
    'span[class*="workplace-type"]'
  ];

  for (const s of locSelectors) {
    const el = document.querySelector(s);
    if (el) {
      const aria = el.getAttribute('aria-label');
      if (aria && aria.startsWith('Location, ')) {
        location = clean(aria.replace('Location, ', ''));
        break;
      }
      const raw = clean(el.innerText || el.textContent);
      if (raw.length > 2 && raw.length < 80 && !/^(promoted|easy apply|apply)$/i.test(raw)) {
        location = raw;
        break;
      }
    }
  }

  // 4. Extract Job Description (Profile)
  let description = '';
  const descSelectors = [
    '#job-details',
    'div[data-view-name="job-details"]',
    '.jobs-description__content',
    '.jobs-description-content__text',
    '.jobs-box__html-content',
    'article.jobs-description__container',
    '[data-testid="expandable-text-box"]'
  ];

  for (const s of descSelectors) {
    const el = document.querySelector(s);
    if (el) {
      const text = (el.innerText || el.textContent || '').replace(/\r\n/g, '\n').trim();
      if (text.length > 40) {
        description = text.slice(0, 8000);
        break;
      }
    }
  }

  const canonicalUrl = jobId ? `https://www.linkedin.com/jobs/view/${jobId}/` : window.location.href;

  return {
    title: title || 'LinkedIn Job Position',
    company: company || 'Company on LinkedIn',
    description,
    location,
    url: canonicalUrl,
    source: 'linkedin',
  };
}

function fallbackUrlDetection(url, docTitle) {
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

    // Check if ALREADY Evaluated by this user
    try {
      const session = await getActiveUserSession(activeApiUrl);
      const reqHeaders = {};
      if (session?.userId) reqHeaders['x-user-id'] = session.userId;

      const canonicalUrl = job.url || getCanonicalUrlFromTab(window.location.href);
      const res = await fetch(
        `${activeApiUrl}/api/analyze-job?url=${encodeURIComponent(canonicalUrl)}&title=${encodeURIComponent(job.title)}&company=${encodeURIComponent(job.company || '')}`,
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
    const tab = await getTargetTab();

    // Re-verify in-tab scraping if description was empty
    if ((!currentScrapedJob?.description || currentScrapedJob.description.length < 20) && tab?.id) {
      try {
        const freshResults = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: inTabScrapeJobPosting,
        });
        if (freshResults && freshResults[0]?.result?.title) {
          currentScrapedJob = freshResults[0].result;
        }
      } catch {}
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

    const session = await getActiveUserSession(activeApiUrl);
    const reqHeaders = { 'Content-Type': 'application/json' };
    if (session?.userId) reqHeaders['x-user-id'] = session.userId;

    const res = await fetch(`${activeApiUrl}/api/analyze-job`, {
      method: 'POST',
      headers: reqHeaders,
      credentials: 'include',
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      alert(data.error || `Failed to analyze job. Please make sure you are signed in at ${activeApiUrl}`);
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
    alert(`Could not connect to HireMe server (${activeApiUrl}). Please check network connection.`);
    if (evalBtn) {
      evalBtn.disabled = false;
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

// ─── 4. Non-Blocking Initialization ─────────────────────────────────────────
function init() {
  // Concurrently run tab detection and server stats so UI never blocks!
  checkActiveTab();
  loadServerStats();

  const evalBtn = document.getElementById('btn-evaluate-job');
  if (evalBtn) {
    evalBtn.addEventListener('click', handleEvaluateClick);
  }

  const rescanBtn = document.getElementById('btn-rescan-tab');
  if (rescanBtn) {
    rescanBtn.addEventListener('click', () => {
      rescanBtn.textContent = '⟳ Scanning…';
      checkActiveTab().finally(() => {
        setTimeout(() => { rescanBtn.textContent = '⟳ Rescan'; }, 400);
      });
    });
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

  // Update footer links to point to active backend
  const trackerLink = document.getElementById('link-tracker');
  const dashboardLink = document.getElementById('link-dashboard');
  if (trackerLink) {
    trackerLink.href = `${activeApiUrl}/tracker`;
    trackerLink.onclick = () => { window.open(`${activeApiUrl}/tracker`, '_blank'); return false; };
  }
  if (dashboardLink) {
    dashboardLink.href = `${activeApiUrl}/dashboard`;
    dashboardLink.onclick = () => { window.open(`${activeApiUrl}/dashboard`, '_blank'); return false; };
  }
}

// Ensure execution whether DOM is loading or already interactive/complete!
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
