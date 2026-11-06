// extension/content.js
// HireMe LinkedIn Content Script – Clean Background Scraper for Chrome Toolbar Extension
(function () {
  console.log('[HireMe] Clean content script initialized on LinkedIn.');

  // Clean up any lingering floating badges or drawers from previous versions
  function removeLegacyElements() {
    try {
      const selectors = [
        '#hireme-floating-badge',
        '#hireme-drawer-overlay',
        '[id*="hireme-floating"]',
        '[class*="hireme-floating"]'
      ];
      selectors.forEach((sel) => {
        document.querySelectorAll(sel).forEach((el) => el.remove());
      });
      // Safety sweep: any custom element containing the text "HireMe Match Score"
      document.querySelectorAll('div, button, a').forEach((el) => {
        if (el.id !== 'extension-popup' && el.innerText && el.innerText.includes('HireMe Match Score')) {
          el.remove();
        }
      });
    } catch {
      // Ignore
    }
  }

  // Run cleanup immediately, on DOM load, periodically, and on DOM mutations
  removeLegacyElements();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', removeLegacyElements);
  }
  const cleanupTimer = setInterval(removeLegacyElements, 600);
  setTimeout(() => clearInterval(cleanupTimer), 15000);

  try {
    const observer = new MutationObserver(() => removeLegacyElements());
    if (document.body) {
      observer.observe(document.body, { childList: true, subtree: true });
    } else {
      document.addEventListener('DOMContentLoaded', () => {
        if (document.body) observer.observe(document.body, { childList: true, subtree: true });
      });
    }
  } catch {
    // MutationObserver fallback
  }

  function getCanonicalLinkedInUrl() {
    const url = window.location.href;
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const currentJobId = urlParams.get('currentJobId');
      if (currentJobId && /^\d+$/.test(currentJobId)) {
        return `https://www.linkedin.com/jobs/view/${currentJobId}/`;
      }
      const viewMatch = window.location.pathname.match(/\/jobs\/view\/(\d+)/);
      if (viewMatch) {
        return `https://www.linkedin.com/jobs/view/${viewMatch[1]}/`;
      }
    } catch {
      // fall through
    }
    return url;
  }

  // ─── Scrape LinkedIn Job Details ──────────────────────────────────────
  function scrapeJobDetails() {
    if (window.HireMeMetadataExtractor) {
      return window.HireMeMetadataExtractor.extractJobDetails();
    }

    const title = window.HireMeJobTitleExtractor ? window.HireMeJobTitleExtractor.getJobTitle() : null;
    const company = window.HireMeCompanyExtractor ? window.HireMeCompanyExtractor.getCompanyName() : 'Company on LinkedIn';
    const description = window.HireMeDescriptionExtractor ? window.HireMeDescriptionExtractor.getJobDescription() : '';
    const location = window.HireMeLocationExtractor ? window.HireMeLocationExtractor.getJobLocation() : 'Remote / Hybrid';
    const canonicalUrl = getCanonicalLinkedInUrl();

    return {
      title,
      company,
      description,
      location,
      url: canonicalUrl,
      source: 'linkedin',
    };
  }

  // Listen for scrape requests from popup.js when extension icon in toolbar is clicked
  chrome.runtime?.onMessage?.addListener((request, sender, sendResponse) => {
    if (request.action === 'SCRAPE_JOB') {
      const details = scrapeJobDetails();
      sendResponse(details);
    }
    return true;
  });
})();
