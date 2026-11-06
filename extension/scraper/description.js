// extension/scraper/description.js
// Robust LinkedIn Job Description Extractor – Supports 2026 SDUI & Classical Layouts
(function (global) {
    const descSelectors = [
        // 2026 SDUI primary container
        '[data-testid="expandable-text-box"]',
        '[data-testid*="expandable-text"]',
        'div[data-testid="expandable-text-box"]',
        'span[data-testid="expandable-text-box"]',

        // Traditional & Semantic Containers
        '#job-details',
        '.jobs-description__content',
        '.jobs-description-content__text',
        '.jobs-box__html-content',
        '.jobs-description__container',
        'article.jobs-description__container',
        'article[class*="jobs-description"]',
        '.jobs-search__job-details--container',
        'div[data-view-name="job-details"]',
        'section[aria-label="Job description"]',
        'section[aria-label="Primary content"]',
        '.jobs-description',
        '.description__text'
    ];

    function cleanDescription(text) {
        if (!text) return '';
        return text
            .replace(/\r\n/g, '\n')
            .replace(/\n{3,}/g, '\n\n')
            .trim();
    }

    function getJobDescription() {
        // 1. Direct query through priority selectors
        for (const sel of descSelectors) {
            try {
                const el = document.querySelector(sel);
                if (el) {
                    const text = cleanDescription(el.innerText || el.textContent);
                    if (text && text.length > 25) {
                        return text.slice(0, 8000);
                    }
                }
            } catch {}
        }

        // 2. Fallback: Search for any container with text containing typical JD keywords
        try {
            const candidateSections = Array.from(document.querySelectorAll('article, section, main, div[class*="description"]'));
            for (const section of candidateSections) {
                const text = cleanDescription(section.innerText || section.textContent);
                if (
                    text.length > 100 &&
                    (text.toLowerCase().includes('responsibilities') ||
                     text.toLowerCase().includes('qualifications') ||
                     text.toLowerCase().includes('requirements') ||
                     text.toLowerCase().includes('about the job') ||
                     text.toLowerCase().includes('skills'))
                ) {
                    return text.slice(0, 8000);
                }
            }
        } catch {}

        // 3. Isolated container fallback (clone main and strip extraneous widgets)
        try {
            const mainContainer = document.querySelector(
                'div[data-view-name="job-details"], .jobs-search__job-details, .jobs-details__main-content, main, #main-content'
            );
            if (mainContainer) {
                const clone = mainContainer.cloneNode(true);
                clone
                    .querySelectorAll(
                        'aside, header, footer, .jobs-similar-jobs, [class*="similar-jobs"], [class*="recommendation"], [class*="right-rail"], nav'
                    )
                    .forEach((el) => el.remove());
                const text = cleanDescription(clone.innerText || clone.textContent);
                if (text && text.length > 30) {
                    return text.slice(0, 8000);
                }
            }
        } catch {}

        return '';
    }

    global.HireMeDescriptionExtractor = { getJobDescription };
})(typeof window !== 'undefined' ? window : this);
