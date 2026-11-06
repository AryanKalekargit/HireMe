// Contact Information, Experience Requirement, Employment Type & Compensation Extractor
// Extracts recruiter contact numbers, emails, experience validity, employment type (Job vs Internship), and CTC/Stipend

export interface ExtractedContact {
    email?: string;
    phone?: string;
    displayString: string;
}

export interface ExperienceAnalysis {
    requiredExperience?: string;
    minYears?: number;
    maxYears?: number;
    status: 'MATCH' | 'MISMATCH' | 'FLEXIBLE' | 'UNKNOWN';
    message: string;
    isFresherMismatch: boolean;
}

export type EmploymentType = 'Internship' | 'Job';
export type CompensationType = 'Stipend' | 'CTC';

export interface EmploymentCompensationDetails {
    employmentType: EmploymentType;
    compensationType: CompensationType;
    compensation: string;
    rawMention?: string;
    isStipend: boolean;
    displayString: string;
}

export interface JobMetadataOutput {
    contact: ExtractedContact;
    experience: ExperienceAnalysis;
    employment: EmploymentCompensationDetails;
}

// ─── 1. EXTRACT CONTACT INFORMATION (EMAIL & PHONE) ───────────────────
export function extractContactInfo(text: string): ExtractedContact {
    if (!text) {
        return { displayString: 'Contact : None' };
    }

    let email: string | undefined;
    let phone: string | undefined;

    // A. Email Extraction Regex
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
    const emailMatches = text.match(emailRegex) || [];
    for (const match of emailMatches) {
        const clean = match.trim().toLowerCase();
        if (
            !clean.endsWith('.png') &&
            !clean.endsWith('.jpg') &&
            !clean.endsWith('.jpeg') &&
            !clean.endsWith('.gif') &&
            !clean.includes('example.com') &&
            !clean.includes('w3.org') &&
            !clean.includes('schema.org') &&
            !clean.includes('domain.com')
        ) {
            email = match.trim();
            break;
        }
    }

    // B. Phone Number Extraction Regex
    const labeledPhoneRegex = /(?:call|phone|mobile|contact(?:\s+us)?(?:\s+at)?|whatsapp|tel|inquiry)[:\s]+([+]?[0-9\s-()]{8,18}[0-9])/i;
    const labeledMatch = text.match(labeledPhoneRegex);

    if (labeledMatch && labeledMatch[1]) {
        const candidate = cleanPhoneNumber(labeledMatch[1]);
        if (isValidPhoneNumber(candidate)) {
            phone = candidate;
        }
    }

    if (!phone) {
        const indianPhoneRegex = /(?:\+?91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}\b/g;
        const matches = text.match(indianPhoneRegex) || [];
        for (const m of matches) {
            const candidate = cleanPhoneNumber(m);
            if (isValidPhoneNumber(candidate)) {
                phone = candidate;
                break;
            }
        }
    }

    if (!phone) {
        const usPhoneRegex = /(?:\+?1[\s-]?)?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4}\b/g;
        const usMatches = text.match(usPhoneRegex) || [];
        for (const m of usMatches) {
            const candidate = cleanPhoneNumber(m);
            if (isValidPhoneNumber(candidate)) {
                phone = candidate;
                break;
            }
        }
    }

    let displayString = 'Contact : None';
    if (phone && email) {
        displayString = `Contact : ${phone} · ${email}`;
    } else if (phone) {
        displayString = `Contact : ${phone}`;
    } else if (email) {
        displayString = `Contact : ${email}`;
    }

    return {
        email,
        phone,
        displayString,
    };
}

function cleanPhoneNumber(raw: string): string {
    let cleaned = raw.trim().replace(/[^\d+]/g, ' ').replace(/\s+/g, ' ').trim();
    const digitsOnly = cleaned.replace(/\D/g, '');
    if (digitsOnly.length === 10 && /^[6-9]/.test(digitsOnly)) {
        return `+91 ${digitsOnly.slice(0, 5)} ${digitsOnly.slice(5)}`;
    }
    if (digitsOnly.length === 12 && digitsOnly.startsWith('91')) {
        return `+91 ${digitsOnly.slice(2, 7)} ${digitsOnly.slice(7)}`;
    }
    return cleaned;
}

function isValidPhoneNumber(phone: string): boolean {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10 || digits.length > 13) return false;
    if (/^(19|20)\d{2}/.test(digits) && digits.length === 8) return false;
    return true;
}

// ─── 2. EXTRACT EXPERIENCE REQUIREMENT & VALIDATE AGAINST CANDIDATE ────
export function extractExperienceRequirement(
    jobDescription: string,
    candidateExperienceLevel: string = 'Entry Level'
): ExperienceAnalysis {
    if (!jobDescription) {
        return {
            status: 'FLEXIBLE',
            message: 'Experience requirement not explicitly specified in the job posting.',
            isFresherMismatch: false,
        };
    }

    const text = jobDescription.toLowerCase();
    let minYears: number | undefined;
    let maxYears: number | undefined;
    let requiredExperience: string | undefined;

    const rangeRegex = /(\d+)\s*(?:-|to)\s*(\d+)\s*(?:years?|yrs?)/i;
    const rangeMatch = text.match(rangeRegex);
    if (rangeMatch) {
        minYears = parseInt(rangeMatch[1], 10);
        maxYears = parseInt(rangeMatch[2], 10);
        requiredExperience = `${minYears}-${maxYears} Years`;
    }

    if (!minYears) {
        const plusRegex = /(\d+)\s*\+\s*(?:years?|yrs?)/i;
        const plusMatch = text.match(plusRegex);
        if (plusMatch) {
            minYears = parseInt(plusMatch[1], 10);
            requiredExperience = `${minYears}+ Years`;
        }
    }

    if (!minYears) {
        const minRegex = /(?:minimum|at least|min\.?)\s*(\d+)\s*(?:years?|yrs?)/i;
        const minMatch = text.match(minRegex);
        if (minMatch) {
            minYears = parseInt(minMatch[1], 10);
            requiredExperience = `Minimum ${minYears} Years`;
        }
    }

    const isFresherFriendly =
        text.includes('fresher') ||
        text.includes('freshers welcome') ||
        text.includes('fresh graduates') ||
        text.includes('entry level') ||
        text.includes('0-1 year') ||
        text.includes('0 to 1 year') ||
        text.includes('0-2 years') ||
        text.includes('0 to 2 years') ||
        text.includes('no experience required');

    if (!requiredExperience && isFresherFriendly) {
        minYears = 0;
        maxYears = 1;
        requiredExperience = '0-1 Years (Freshers Welcome)';
    }

    if (!requiredExperience) {
        if (text.includes('lead') || text.includes('principal') || text.includes('staff engineer') || text.includes('architect')) {
            minYears = 8;
            requiredExperience = 'Lead / Principal (8+ Years expected)';
        } else if (text.includes('senior') || text.includes('sr.') || text.includes('sr ')) {
            minYears = 5;
            requiredExperience = 'Senior Level (5+ Years expected)';
        }
    }

    const normCandLevel = (candidateExperienceLevel || '').toLowerCase();
    const isCandidateFresher =
        normCandLevel.includes('entry') ||
        normCandLevel.includes('fresher') ||
        normCandLevel.includes('0-2') ||
        normCandLevel.includes('junior');

    if (minYears !== undefined && minYears >= 3) {
        if (isCandidateFresher) {
            return {
                requiredExperience,
                minYears,
                maxYears,
                status: 'MISMATCH',
                isFresherMismatch: true,
                message: `Experience Warning: Role requires ${requiredExperience}. Candidate is an Entry Level / Fresher. You may encounter strict recruiter experience filters.`,
            };
        }
    }

    if (minYears !== undefined && minYears >= 7) {
        if (normCandLevel.includes('mid')) {
            return {
                requiredExperience,
                minYears,
                maxYears,
                status: 'MISMATCH',
                isFresherMismatch: false,
                message: `Experience Alert: Role demands ${requiredExperience} (Candidate Profile: Mid Level).`,
            };
        }
    }

    if (isFresherFriendly || (minYears !== undefined && minYears <= 2)) {
        return {
            requiredExperience: requiredExperience || '0-2 Years (Freshers Welcome)',
            minYears: minYears || 0,
            maxYears: maxYears || 2,
            status: 'MATCH',
            isFresherMismatch: false,
            message: 'Experience Valid: Role is open to entry-level professionals and freshers.',
        };
    }

    if (requiredExperience) {
        return {
            requiredExperience,
            minYears,
            maxYears,
            status: 'MATCH',
            isFresherMismatch: false,
            message: `Experience Valid: Candidate profile matches ${requiredExperience} requirement.`,
        };
    }

    return {
        status: 'FLEXIBLE',
        message: 'Experience requirement not explicitly specified in job posting.',
        isFresherMismatch: false,
    };
}

// ─── 3. EXTRACT EMPLOYMENT TYPE (JOB VS INTERNSHIP) & CTC / STIPEND ───
export function extractEmploymentAndCompensation(
    jobDescription: string = '',
    jobTitle: string = ''
): EmploymentCompensationDetails {
    const combined = `${jobTitle} ${jobDescription}`.toLowerCase();
    const titleLower = (jobTitle || '').toLowerCase();

    // 1. Determine Employment Type
    const isInternshipByTitle =
        /\b(?:intern|internship|trainee|apprentice|apprenticeship|fellowship)\b/i.test(titleLower);

    const isInternshipByBody =
        /\b(?:internship|looking for an intern|summer intern|winter intern|fresher internship|interns will|duration\s*:\s*\d+\s*(?:months?|weeks?)|stipend\s*[:=-])\b/i.test(combined);

    const isInternship = isInternshipByTitle || isInternshipByBody;
    const employmentType: EmploymentType = isInternship ? 'Internship' : 'Job';
    const compensationType: CompensationType = isInternship ? 'Stipend' : 'CTC';

    let compensation = '';
    let rawMention: string | undefined;

    if (isInternship) {
        // Look for stipend specifics
        const stipendLabeled = /(?:stipend|monthly\s+stipend|allowance)\s*[:=-]?\s*(?:(?:\u20B9|rs\.?|inr|\$)\s*)?([0-9,kK.]+(?:\s*(?:-|to)\s*[0-9,kK.]+)?(?:\s*(?:\/|\s*per\s*)(?:month|mo|pm\b))?)/i;
        const m1 = combined.match(stipendLabeled);
        if (m1 && m1[1]) {
            rawMention = m1[0];
            compensation = formatCompensationAmount(m1[1], 'month');
        }

        if (!compensation) {
            const monthlyRegex = /(?:\u20B9|rs\.?|inr|\$)\s*([0-9,kK.]+(?:\s*(?:-|to)\s*(?:\u20B9|rs\.?|inr|\$)?\s*[0-9,kK.]+)?)\s*(?:\/|\s*per\s*)(?:month|mo|pm\b)/i;
            const m2 = combined.match(monthlyRegex);
            if (m2 && m2[1]) {
                rawMention = m2[0];
                compensation = formatCompensationAmount(m2[1], 'month');
            }
        }

        if (!compensation && /\b(?:unpaid\s+internship|unpaid)\b/i.test(combined)) {
            compensation = 'Unpaid';
        }

        if (!compensation) {
            compensation = 'Not Disclosed / Performance-based';
        }
    } else {
        // Job: Look for CTC / Annual Salary
        const ctcLpaRegex = /(?:ctc|salary|package|compensation|remuneration)\s*[:=-]?\s*(?:(?:\u20B9|rs\.?|inr)\s*)?([0-9.]+(?:\s*(?:-|to)\s*[0-9.]+)?\s*(?:lpa|lakhs?|lac|lacs?|pa\b|per\s*annum))/i;
        const mCtc = combined.match(ctcLpaRegex);
        if (mCtc && mCtc[1]) {
            rawMention = mCtc[0];
            compensation = formatLpaAmount(mCtc[1]);
        }

        if (!compensation) {
            const standaloneLpa = /(?:(?:\u20B9|rs\.?|inr)\s*)?([0-9.]+(?:\s*(?:-|to)\s*[0-9.]+)?)\s*(?:lpa|lakhs?|lac|lacs?)\b/i;
            const mLpa = combined.match(standaloneLpa);
            if (mLpa && mLpa[1]) {
                rawMention = mLpa[0];
                compensation = `\u20B9${mLpa[1].replace(/\s+/g, ' ')} LPA`;
            }
        }

        if (!compensation) {
            const usdRegex = /(?:\$|usd\s*)\s*([0-9,kK.]+(?:\s*(?:-|to)\s*\$?\s*[0-9,kK.]+)?)\s*(?:\/|\s*per\s*)?(?:year|yr|annually|annual|annum)?\b/i;
            const mUsd = combined.match(usdRegex);
            if (mUsd && mUsd[1] && (combined.includes('year') || combined.includes('yr') || combined.includes('salary') || combined.includes('compensation') || combined.includes('k'))) {
                rawMention = mUsd[0];
                compensation = `$${mUsd[1].trim()} / year`;
            }
        }

        if (!compensation) {
            const inrAnnual = /(?:\u20B9|rs\.?|inr)\s*([0-9,]+(?:\s*(?:-|to)\s*(?:\u20B9|rs\.?|inr)?\s*[0-9,]+)?)\s*(?:per\s*annum|pa\b|\/yr\b|\/year\b)/i;
            const mInr = combined.match(inrAnnual);
            if (mInr && mInr[1]) {
                rawMention = mInr[0];
                compensation = `\u20B9${mInr[1].trim()} / year`;
            }
        }

        if (!compensation) {
            const monthlyJob = /(?:salary|ctc|pay)\s*[:=-]?\s*(?:(?:\u20B9|rs\.?|inr|\$)\s*)?([0-9,kK.]+(?:\s*(?:-|to)\s*[0-9,kK.]+)?)\s*(?:\/|\s*per\s*)(?:month|mo|pm\b)/i;
            const mMonth = combined.match(monthlyJob);
            if (mMonth && mMonth[1]) {
                rawMention = mMonth[0];
                compensation = formatCompensationAmount(mMonth[1], 'month');
            }
        }

        if (!compensation) {
            compensation = 'Not Disclosed / Competitive';
        }
    }

    const displayString = `${compensationType} : ${compensation}`;

    return {
        employmentType,
        compensationType,
        compensation,
        rawMention,
        isStipend: isInternship,
        displayString,
    };
}

function formatCompensationAmount(raw: string, period: 'month' | 'year'): string {
    const cleaned = raw.trim();
    if (cleaned.toLowerCase() === 'unpaid') return 'Unpaid';
    const hasDollar = cleaned.includes('$') || cleaned.toLowerCase().includes('usd');
    const symbol = hasDollar ? '$' : '\u20B9';
    const cleanNumbers = cleaned
        .replace(/(?:\u20B9|\$|rs\.?|inr|usd)\s*/gi, '')
        .replace(/\s*(?:\/|\s*per\s*)(?:month|mo|pm|year|yr|annum)\b/gi, '')
        .trim();
    return `${symbol}${cleanNumbers} / ${period}`;
}

function formatLpaAmount(raw: string): string {
    const cleaned = raw.trim().replace(/\s+/g, ' ');
    const numMatch = cleaned.match(/([0-9.]+(?:\s*(?:-|to)\s*[0-9.]+)?)/);
    if (numMatch) {
        return `\u20B9${numMatch[1].replace(/\s+/g, '')} LPA`;
    }
    return `\u20B9${cleaned.toUpperCase()}`;
}

export function extractAllJobMetadata(
    jobDescription: string,
    candidateExperienceLevel: string = 'Entry Level',
    jobTitle: string = ''
): JobMetadataOutput {
    return {
        contact: extractContactInfo(jobDescription),
        experience: extractExperienceRequirement(jobDescription, candidateExperienceLevel),
        employment: extractEmploymentAndCompensation(jobDescription, jobTitle),
    };
}
