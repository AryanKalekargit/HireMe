// extension/scraper/metadata.js
(function (global) {
    let observer = null;
    let lastScrapedJobUrl = '';
    let onJobDetectedCallback = null;

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

    function extractLinkedInInsights() {
        try {
            const insights = [];
            const insightElements = document.querySelectorAll(
                '.jobs-unified-top-card__job-insight, ' +
                '.job-details-jobs-unified-top-card__job-insight, ' +
                'li[class*="job-insight"], ' +
                'span[class*="compensation"], ' +
                'span[class*="workplace-type"]'
            );
            insightElements.forEach((el) => {
                const txt = (el.innerText || el.textContent || '').trim();
                if (txt && txt.length < 100 && !insights.includes(txt)) {
                    insights.push(txt);
                }
            });
            return insights.join(' · ');
        } catch {
            return '';
        }
    }

    function extractJobDetails() {
        const title = global.HireMeJobTitleExtractor
            ? global.HireMeJobTitleExtractor.getJobTitle()
            : null;
        const company = global.HireMeCompanyExtractor
            ? global.HireMeCompanyExtractor.getCompanyName()
            : 'Company on LinkedIn';
        const description = global.HireMeDescriptionExtractor
            ? global.HireMeDescriptionExtractor.getJobDescription()
            : '';
        const location = global.HireMeLocationExtractor
            ? global.HireMeLocationExtractor.getJobLocation()
            : 'Remote / Hybrid';

        const canonicalUrl = getCanonicalLinkedInUrl();
        const insights = extractLinkedInInsights();
        const combinedDescription = insights
            ? `--- LINKEDIN ROLE & COMPENSATION INSIGHTS ---\n${insights}\n\n${description}`
            : description;

        return {
            title,
            company,
            description: combinedDescription,
            location,
            url: canonicalUrl,
            source: 'linkedin',
        };
    }

    function initMutationObserver(callback) {
        onJobDetectedCallback = callback;
        if (observer) observer.disconnect();

        const targetNode = document.body || document.documentElement;

        observer = new MutationObserver(() => {
            const currentUrl = window.location.href;
            if (!currentUrl.includes('/jobs/')) return;

            const title = global.HireMeJobTitleExtractor
                ? global.HireMeJobTitleExtractor.getJobTitle()
                : null;

            if (title && (currentUrl !== lastScrapedJobUrl || !lastScrapedJobUrl)) {
                lastScrapedJobUrl = currentUrl;
                if (onJobDetectedCallback) {
                    onJobDetectedCallback(extractJobDetails());
                }
            }
        });

        observer.observe(targetNode, {
            childList: true,
            subtree: true,
        });
    }

    global.HireMeMetadataExtractor = {
        extractJobDetails,
        getCanonicalLinkedInUrl,
        initMutationObserver,
    };
})(typeof window !== 'undefined' ? window : this);
