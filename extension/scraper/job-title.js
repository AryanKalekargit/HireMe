// extension/scraper/job-title.js
// Robust LinkedIn Job Title Extractor – Supports 2026 SDUI & Traditional Layouts
(function (global) {
    function cleanText(str) {
        if (!str) return '';
        return str
            .replace(/[\r\n\t]+/g, ' ')
            .replace(/\s{2,}/g, ' ')
            .trim();
    }

    function isInvalidTitle(str) {
        if (!str || typeof str !== 'string') return true;
        const s = str.trim().toLowerCase();
        if (s.length < 2 || s.length > 120) return true;
        const blacklisted = [
            'search',
            'jobs',
            'feed',
            'messaging',
            'notifications',
            'my network',
            'linkedin',
            'promoted',
            'actively reviewing',
            'easy apply',
            'reposted',
            'applied',
            'job details',
            'skip to main content',
            'filter by',
            'sort by'
        ];
        return blacklisted.some((b) => s === b || s.startsWith(b + ' ') || s.startsWith('search ('));
    }

    function getJobIdFromUrl() {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const fromQuery = urlParams.get('currentJobId');
            if (fromQuery && /^\d+$/.test(fromQuery)) return fromQuery;

            const fromPath = window.location.pathname.match(/\/jobs\/view\/(\d+)/);
            if (fromPath) return fromPath[1];
        } catch {
            // fall through
        }
        return null;
    }

    function getTitleFromDocTitle() {
        try {
            let doc = document.title || '';
            // Strip notification counts e.g. "(1) " or "(99+) "
            doc = doc.replace(/^\(\d+\+?\)\s*/, '');
            doc = cleanText(doc);

            if (doc.includes('| LinkedIn')) {
                const preLinkedIn = doc.split('| LinkedIn')[0].trim();
                // Might be "Website Developer | Anulom Technologies Pvt Ltd"
                if (preLinkedIn.includes('|')) {
                    const candidate = cleanText(preLinkedIn.split('|')[0]);
                    if (!isInvalidTitle(candidate)) return candidate;
                }
                // Might be "Web Developer at Company" or "Web Developer hiring in Location"
                const atSplit = preLinkedIn.split(/\s+(?:at|hiring in|hiring)\s+/i);
                if (atSplit[0] && !isInvalidTitle(atSplit[0])) {
                    return cleanText(atSplit[0]);
                }
                if (!isInvalidTitle(preLinkedIn)) {
                    return preLinkedIn;
                }
            }
        } catch {}
        return null;
    }

    function getJobTitle() {
        const currentJobId = getJobIdFromUrl();

        // 1. Direct Job Posting Page: Check document.title first if on /jobs/view/
        const isSingleJobView = window.location.pathname.includes('/jobs/view/');
        if (isSingleJobView) {
            const fromDoc = getTitleFromDocTitle();
            if (fromDoc) return fromDoc;
        }

        // 2. High-priority DOM query: Primary H1 in details container (SDUI & Classical)
        const primaryH1Selectors = [
            'div[data-view-name="job-details"] h1',
            'section[aria-label="Primary content"] h1',
            'main h1',
            '.jobs-details__main-content h1',
            '.job-details-jobs-unified-top-card__job-title h1',
            '.job-details-jobs-unified-top-card__job-title',
            '.jobs-unified-top-card__job-title h1',
            '.jobs-unified-top-card__job-title',
            'h1[class*="job-title"]',
            'h1[class*="top-card"]',
            'h1[data-testid*="title"]',
            '[data-testid="job-details-title"]'
        ];

        for (const sel of primaryH1Selectors) {
            try {
                const el = document.querySelector(sel);
                if (el) {
                    const text = cleanText(el.innerText || el.textContent);
                    if (!isInvalidTitle(text)) return text;
                }
            } catch {}
        }

        // 3. Fallback to all page H1s that fit a title pattern
        try {
            const allH1s = Array.from(document.querySelectorAll('h1'));
            for (const h of allH1s) {
                const text = cleanText(h.innerText || h.textContent);
                if (!isInvalidTitle(text) && text.length > 2 && text.length < 90) {
                    return text;
                }
            }
        } catch {}

        // 4. Targeted query using currentJobId from search results left pane
        if (currentJobId) {
            const targetedSelectors = [
                `[data-job-id="${currentJobId}"] a.job-card-list__title`,
                `[data-job-id="${currentJobId}"] .job-card-list__title`,
                `[data-job-id="${currentJobId}"] a[class*="title"]`,
                `[data-job-id="${currentJobId}"] strong`,
                `[data-occludable-job-id="${currentJobId}"] a.job-card-list__title`,
                `[data-occludable-job-id="${currentJobId}"] strong`,
                `a[href*="/jobs/view/${currentJobId}"]`,
                `a[href*="${currentJobId}"]`
            ];

            for (const sel of targetedSelectors) {
                try {
                    const el = document.querySelector(sel);
                    if (el) {
                        const lines = (el.innerText || el.textContent || '')
                            .split('\n')
                            .map(cleanText)
                            .filter((l) => !isInvalidTitle(l) && l.length > 2);
                        if (lines.length > 0) return lines[0];
                    }
                } catch {}
            }
        }

        // 5. Active job item in search list
        const activeItemSelectors = [
            '.jobs-search-results__list-item--active [class*="title"]',
            '.jobs-search-results-list__list-item--active [class*="title"]',
            '.jobs-search-results__list-item--active strong',
            'li.selected [class*="title"]',
            'li.selected strong',
            'div[aria-selected="true"] [class*="title"]',
            'div[aria-selected="true"] strong'
        ];

        for (const sel of activeItemSelectors) {
            try {
                const el = document.querySelector(sel);
                if (el) {
                    const text = cleanText(el.innerText || el.textContent);
                    if (!isInvalidTitle(text)) return text;
                }
            } catch {}
        }

        // 6. Check Document Title even on search pages if it contains "|"
        const docFallback = getTitleFromDocTitle();
        if (docFallback) return docFallback;

        // 7. Extract from URL query keywords or return position with jobId
        if (currentJobId) {
            try {
                const urlParams = new URLSearchParams(window.location.search);
                const keywords = urlParams.get('keywords');
                if (keywords) {
                    const decoded = decodeURIComponent(keywords);
                    const firstKeyword = cleanText(decoded.split(/ or |,|\|/i)[0]);
                    if (!isInvalidTitle(firstKeyword)) {
                        return `${firstKeyword} (Job #${currentJobId})`;
                    }
                }
            } catch {}
            return `LinkedIn Position #${currentJobId}`;
        }

        return null;
    }

    global.HireMeJobTitleExtractor = { getJobTitle };
})(typeof window !== 'undefined' ? window : this);
