// extension/scraper/company.js
// Robust LinkedIn Company Extractor – Supports 2026 SDUI & Traditional Layouts
(function (global) {
    function cleanText(str) {
        if (!str) return '';
        return str
            .replace(/[\r\n\t]+/g, ' ')
            .replace(/\s{2,}/g, ' ')
            .trim();
    }

    function isInvalidCompany(str) {
        if (!str || typeof str !== 'string') return true;
        const s = str.trim().toLowerCase();
        if (s.length < 2 || s.length > 80) return true;
        const blacklisted = [
            'linkedin',
            'search',
            'jobs',
            'promoted',
            'actively reviewing',
            'easy apply',
            'about the job',
            'company',
            'employer',
            'view company'
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

    function getCompanyFromDocTitle() {
        try {
            let doc = document.title || '';
            doc = doc.replace(/^\(\d+\+?\)\s*/, '');
            doc = cleanText(doc);

            if (doc.includes('| LinkedIn')) {
                const preLinkedIn = doc.split('| LinkedIn')[0].trim();
                // "Website Developer | Anulom Technologies Pvt Ltd"
                if (preLinkedIn.includes('|')) {
                    const parts = preLinkedIn.split('|').map(cleanText);
                    if (parts[1] && !isInvalidCompany(parts[1])) {
                        return parts[1];
                    }
                }
                // "Web Developer at Google"
                const atSplit = preLinkedIn.split(/\s+at\s+/i);
                if (atSplit.length > 1) {
                    const cand = cleanText(atSplit[atSplit.length - 1]);
                    if (!isInvalidCompany(cand)) return cand;
                }
            }
        } catch {}
        return null;
    }

    function getCompanyName() {
        const currentJobId = getJobIdFromUrl();

        // 1. Check targeted job card in search results
        if (currentJobId) {
            const targetedEl = document.querySelector(
                `[data-job-id="${currentJobId}"] a[href*="/company/"], ` +
                `[data-job-id="${currentJobId}"] .artdeco-entity-lockup__subtitle, ` +
                `[data-job-id="${currentJobId}"] .job-card-container__primary-description, ` +
                `[data-job-id="${currentJobId}"] [class*="company"]`
            );
            if (targetedEl) {
                const text = cleanText(targetedEl.innerText || targetedEl.textContent);
                if (!isInvalidCompany(text)) return text;
            }
        }

        // 2. High-priority DOM selectors in main details pane (SDUI & Classical)
        const companySelectors = [
            'div[data-view-name="job-details"] a[href*="/company/"]',
            'section[aria-label="Primary content"] a[href*="/company/"]',
            'main a[href*="/company/"]',
            'div[aria-label^="Company, "]',
            '.job-details-jobs-unified-top-card__company-name a',
            '.job-details-jobs-unified-top-card__company-name',
            '.jobs-unified-top-card__company-name a',
            '.jobs-unified-top-card__company-name',
            '.jobs-unified-top-card__subtitle-primary-grouping a',
            '.job-details-jobs-unified-top-card__primary-description a',
            'a[data-control-name="company_link"]',
            'a[class*="company-name"]',
            'span[class*="company-name"]'
        ];

        for (const sel of companySelectors) {
            try {
                const el = document.querySelector(sel);
                if (el) {
                    // Check aria-label first e.g. aria-label="Company, Anulom Technologies Pvt Ltd"
                    const aria = el.getAttribute('aria-label');
                    if (aria && aria.startsWith('Company, ')) {
                        const cand = cleanText(aria.replace('Company, ', ''));
                        if (!isInvalidCompany(cand)) return cand;
                    }

                    const text = cleanText(el.innerText || el.textContent);
                    if (!isInvalidCompany(text)) return text;
                }
            } catch {}
        }

        // 3. Fallback to any company link on the page
        try {
            const companyLinks = Array.from(document.querySelectorAll('a[href*="/company/"]'));
            for (const link of companyLinks) {
                const text = cleanText(link.innerText || link.textContent);
                if (!isInvalidCompany(text)) return text;
            }
        } catch {}

        // 4. Fallback to document.title parsing
        const docCompany = getCompanyFromDocTitle();
        if (docCompany) return docCompany;

        return 'Company on LinkedIn';
    }

    global.HireMeCompanyExtractor = { getCompanyName };
})(typeof window !== 'undefined' ? window : this);
