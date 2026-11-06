// extension/scraper/location.js
// Robust LinkedIn Location Extractor – Supports 2026 SDUI & Classical Layouts
(function (global) {
    function cleanText(str) {
        if (!str) return '';
        return str
            .replace(/[\r\n\t]+/g, ' ')
            .replace(/\s{2,}/g, ' ')
            .trim();
    }

    function isInvalidLocation(str) {
        if (!str || typeof str !== 'string') return true;
        const s = str.trim().toLowerCase();
        if (s.length < 2 || s.length > 80) return true;
        const blacklisted = [
            'promoted',
            'actively reviewing',
            'easy apply',
            'reposted',
            'applied',
            'about the job',
            'see more',
            'apply'
        ];
        return blacklisted.includes(s);
    }

    function getJobIdFromUrl() {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const fromQuery = urlParams.get('currentJobId');
            if (fromQuery && /^\d+$/.test(fromQuery)) return fromQuery;

            const fromPath = window.location.pathname.match(/\/jobs\/view\/(\d+)/);
            if (fromPath) return fromPath[1];
        } catch {}
        return null;
    }

    const locationSelectors = [
        'div[aria-label^="Location, "]',
        '.jobs-unified-top-card__bullet',
        '.job-details-jobs-unified-top-card__primary-description-container span',
        '.jobs-unified-top-card__workplace-type',
        'span[class*="workplace-type"]',
        'span[class*="bullet"]',
        '.job-details-jobs-unified-top-card__primary-description span',
        '.jobs-unified-top-card__primary-description span'
    ];

    function getJobLocation() {
        const currentJobId = getJobIdFromUrl();

        // 1. Check targeted job card in search results
        if (currentJobId) {
            const targetedEl = document.querySelector(
                `[data-job-id="${currentJobId}"] [class*="metadata-wrapper"], ` +
                `[data-job-id="${currentJobId}"] [class*="job-card-container__metadata-item"], ` +
                `[data-job-id="${currentJobId}"] .job-card-container__metadata-wrapper`
            );
            if (targetedEl) {
                const text = cleanText(targetedEl.innerText || targetedEl.textContent);
                if (!isInvalidLocation(text)) return text;
            }
        }

        // 2. Priority DOM selectors
        for (const sel of locationSelectors) {
            try {
                const el = document.querySelector(sel);
                if (el) {
                    const aria = el.getAttribute('aria-label');
                    if (aria && aria.startsWith('Location, ')) {
                        const cand = cleanText(aria.replace('Location, ', ''));
                        if (!isInvalidLocation(cand)) return cand;
                    }

                    const text = cleanText(el.innerText || el.textContent);
                    if (!isInvalidLocation(text)) return text;
                }
            } catch {}
        }

        // 3. Look for elements with class fa4gpp (2026 SDUI location span)
        try {
            const sduiSpans = Array.from(document.querySelectorAll('span[class*="fa4gpp"]'));
            for (const sp of sduiSpans) {
                const text = cleanText(sp.innerText || sp.textContent);
                if (text && text.includes(',') && !isInvalidLocation(text)) {
                    return text;
                }
            }
        } catch {}

        return 'Remote / Hybrid';
    }

    global.HireMeLocationExtractor = { getJobLocation };
})(typeof window !== 'undefined' ? window : this);
