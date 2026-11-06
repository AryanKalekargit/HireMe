import {
    extractTechnicalSkills,
    extractSoftSkills,
    detectRoleDomain,
    classifySkillsList,
    isSkillFuzzyMatch,
    formatSkillTitle,
    DOMAIN_ROLE_TITLES,
    DOMAIN_TECH_SKILLS,
    UNIVERSAL_SOFT_SKILLS,
} from './skill-dictionary';
import { extractAllJobMetadata, ExtractedContact, ExperienceAnalysis, EmploymentCompensationDetails } from './metadata-extractor';

export interface MatchingAnalysisOutput {
    hireScore: number;
    technicalScore: number;
    softScore: number;
    matchedTechnicalSkills: string[];
    missingTechnicalSkills: string[];
    matchedSoftSkills: string[];
    missingSoftSkills: string[];
    matchedSkills: string[]; // combined for backwards compatibility
    missingSkills: string[]; // combined for backwards compatibility
    bonusSkills: string[];
    detectedRoleDomain: string;
    contact: ExtractedContact;
    experience: ExperienceAnalysis;
    employment: EmploymentCompensationDetails;
    strengths: string[];
    recommendations: string[];
}

export function analyzeJobMatch(
    jobDescription: string,
    resumeText: string,
    candidateSkills: string[] = [],
    candidateSoftSkills: string[] = [],
    candidateExperienceLevel: string = 'Entry Level',
    jobTitle: string = ''
): MatchingAnalysisOutput {
    const normalizedJobText = normalizeText(jobDescription);
    const normalizedResumeText = normalizeText(resumeText);

    // 0. Extract Contact Information, Experience Requirement & Employment/Compensation
    const metadata = extractAllJobMetadata(jobDescription, candidateExperienceLevel, jobTitle);

    // 1. Detect target domain of the job description (e.g. backend, frontend, ai_ml_data, etc.)
    const { domain, domainTitle } = detectRoleDomain(jobDescription);

    // 2. Extract required skills from Job Description
    // 2a. Required Technical Skills across all technical domains
    let requiredTechSkills = extractTechnicalSkills(jobDescription);
    if (requiredTechSkills.length === 0) {
        // If job description is minimal, seed standard core skills for that domain
        const domainFallback = DOMAIN_TECH_SKILLS[domain] || DOMAIN_TECH_SKILLS.fullstack;
        requiredTechSkills = domainFallback.slice(0, 6).map(formatSkillTitle);
    }

    // 2b. Required Personality Development / Soft Skills from JD
    let requiredSoftSkills = extractSoftSkills(jobDescription);
    if (requiredSoftSkills.length === 0) {
        // Default fundamental professional skills expected in all tech roles
        requiredSoftSkills = ['Communication', 'Problem Solving', 'Collaboration'];
    }

    // 3. Extract skills from candidate Resume & Profile
    // 3a. Candidate Technical Skills
    const resumeTechSkills = extractTechnicalSkills(resumeText);
    const candidateProfileClassified = classifySkillsList(candidateSkills);

    const allCandidateTechSet = new Set<string>();
    [...candidateProfileClassified.technicalSkills, ...resumeTechSkills].forEach((s) => {
        if (s && s.trim()) allCandidateTechSet.add(s.trim());
    });
    const candidateTechList = Array.from(allCandidateTechSet);

    // 3b. Candidate Personality Development / Soft Skills
    const resumeSoftSkills = extractSoftSkills(resumeText);
    const allCandidateSoftSet = new Set<string>();
    [...candidateSoftSkills, ...candidateProfileClassified.softSkills, ...resumeSoftSkills].forEach((s) => {
        if (s && s.trim()) allCandidateSoftSet.add(s.trim());
    });
    const candidateSoftList = Array.from(allCandidateSoftSet);

    // 4. Evaluate Technical Skill Matching (using Canonical Alias + >= 50% Fuzzy Match)
    const matchedTechnicalSkills: string[] = [];
    const missingTechnicalSkills: string[] = [];

    requiredTechSkills.forEach((jobSkill) => {
        let isMatch = false;

        // Check against candidate's technical skills with fuzzy/canonical matcher
        for (const candSkill of candidateTechList) {
            const check = isSkillFuzzyMatch(candSkill, jobSkill);
            if (check.matched) {
                isMatch = true;
                break;
            }
        }

        // Check if skill keyword appears in normalized resume text directly
        if (!isMatch && checkSkillInText(jobSkill, normalizedResumeText)) {
            isMatch = true;
        }

        if (isMatch) {
            matchedTechnicalSkills.push(jobSkill);
        } else {
            missingTechnicalSkills.push(jobSkill);
        }
    });

    // 5. Evaluate Personality Development / Soft Skill Matching
    const matchedSoftSkills: string[] = [];
    const missingSoftSkills: string[] = [];

    requiredSoftSkills.forEach((jobSoft) => {
        let isMatch = false;

        for (const candSoft of candidateSoftList) {
            const check = isSkillFuzzyMatch(candSoft, jobSoft);
            if (check.matched) {
                isMatch = true;
                break;
            }
        }

        if (!isMatch && checkSkillInText(jobSoft, normalizedResumeText)) {
            isMatch = true;
        }

        if (isMatch) {
            matchedSoftSkills.push(jobSoft);
        } else {
            missingSoftSkills.push(jobSoft);
        }
    });

    // 6. Identify Bonus Technical Skills (candidate has, but JD didn't explicitly demand)
    const bonusSkills: string[] = candidateTechList
        .filter((ct) => !requiredTechSkills.some((rt) => isSkillFuzzyMatch(ct, rt).matched))
        .slice(0, 5)
        .map(formatSkillTitle);

    // 7. Calculate Independent Technical and Soft Scores
    const totalReqTech = Math.max(1, requiredTechSkills.length);
    const techRatio = matchedTechnicalSkills.length / totalReqTech;
    const technicalScore = Math.min(100, Math.round(techRatio * 100));

    const totalReqSoft = Math.max(1, requiredSoftSkills.length);
    const softRatio = matchedSoftSkills.length / totalReqSoft;
    const softScore = Math.min(100, Math.round(softRatio * 100));

    // 8. Calculate Balanced Combined Hire Score
    // Weightings: 70% Technical Fit + 30% Personality / Soft Skills Fit
    // If a candidate has 100% tech skills but 0% soft skills required by the JD,
    // their score is penalized accordingly: base = (0.70 * 1.0 + 0.30 * 0.0) * 80 = 56%
    const weightedFitRatio = 0.70 * techRatio + 0.30 * softRatio;
    let baseScore = weightedFitRatio * 80;

    // Additional depth score based on overall seniority, breadth, and dual-skill excellence
    let depthBonus = 0;
    if (bonusSkills.length >= 3) depthBonus += 4;
    else if (bonusSkills.length >= 1) depthBonus += 2;

    if (
        normalizedResumeText.includes('senior') ||
        normalizedResumeText.includes('lead') ||
        normalizedResumeText.includes('architect') ||
        normalizedResumeText.includes('principal') ||
        normalizedResumeText.includes('experienced')
    ) {
        depthBonus += 4;
    }

    if (matchedTechnicalSkills.length >= 3 && matchedSoftSkills.length >= 2) {
        depthBonus += 4;
    }

    if (techRatio >= 0.8 && softRatio >= 0.8) {
        depthBonus += 4;
    }

    const calculatedScore = Math.round(baseScore + depthBonus);
    // Clamp score dynamically between 15% and 95%
    const hireScore = Math.min(95, Math.max(15, calculatedScore));

    // 9. Generate Distinct Strengths
    const strengths: string[] = [];
    if (matchedTechnicalSkills.length > 0) {
        strengths.push(
            `Strong technical alignment in core requirements: ${matchedTechnicalSkills.slice(0, 3).map(formatSkillTitle).join(', ')}.`
        );
    }
    if (matchedSoftSkills.length > 0) {
        strengths.push(
            `Solid personality development & teamwork match: Demonstrated ${matchedSoftSkills.slice(0, 2).map(formatSkillTitle).join(' & ')}.`
        );
    }
    if (bonusSkills.length > 0) {
        strengths.push(`Bonus technical expertise in ${bonusSkills.slice(0, 2).join(' & ')} provides an edge.`);
    }
    if (
        normalizedResumeText.includes('led') ||
        normalizedResumeText.includes('architected') ||
        normalizedResumeText.includes('deployed')
    ) {
        strengths.push('Demonstrated hands-on experience driving projects to production.');
    } else {
        strengths.push(`Solid alignment with ${domainTitle} role expectations.`);
    }

    // 10. Generate Actionable Recommendations for Both Skillsets
    const recommendations: string[] = [];

    // Technical skill recommendations
    if (missingTechnicalSkills.length > 0) {
        recommendations.push(
            `Incorporate missing technical competencies such as ${missingTechnicalSkills.slice(0, 3).map(formatSkillTitle).join(', ')} into your project descriptions.`
        );
    } else {
        recommendations.push(
            'Your technical skillset comprehensively matches the technical requirements of this role.'
        );
    }

    // Personality development / soft skill recommendations
    if (missingSoftSkills.length > 0) {
        recommendations.push(
            `Highlight personality development skills emphasized by the employer such as ${missingSoftSkills.slice(0, 2).map(formatSkillTitle).join(' & ')} by detailing team leadership or cross-functional outcomes.`
        );
    } else {
        recommendations.push(
            'Your interpersonal and personality skills match the team culture outlined in the job description.'
        );
    }

    if (metadata.experience.isFresherMismatch) {
        recommendations.unshift(
            `Experience Notice: ${metadata.experience.message} Highlight strong projects, hackathons, and certifications to stand out.`
        );
    }

    recommendations.push(
        'Include measurable metrics and quantifiable results (e.g. % performance increase, latency reduction) in recent work experience.'
    );

    // Combined lists for backwards compatibility with any existing UI or extension
    const matchedSkills = [...matchedTechnicalSkills, ...matchedSoftSkills].map(formatSkillTitle);
    const missingSkills = [...missingTechnicalSkills, ...missingSoftSkills].map(formatSkillTitle);

    return {
        hireScore,
        technicalScore,
        softScore,
        matchedTechnicalSkills: matchedTechnicalSkills.map(formatSkillTitle),
        missingTechnicalSkills: missingTechnicalSkills.map(formatSkillTitle),
        matchedSoftSkills: matchedSoftSkills.map(formatSkillTitle),
        missingSoftSkills: missingSoftSkills.map(formatSkillTitle),
        matchedSkills,
        missingSkills,
        bonusSkills,
        detectedRoleDomain: domainTitle,
        contact: metadata.contact,
        experience: metadata.experience,
        employment: metadata.employment,
        strengths,
        recommendations,
    };
}

function normalizeText(text: string): string {
    return (text || '')
        .toLowerCase()
        .replace(/[^\w\s.#+]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function checkSkillInText(skill: string, normalizedText: string): boolean {
    if (!skill || !normalizedText) return false;
    const cleanSkill = skill.toLowerCase().trim();
    const escaped = cleanSkill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const startBoundary = /^\w/.test(cleanSkill) ? '(?:^|\\b)' : '(?:^|\\s|[.,;()!])';
    const endBoundary = /\w$/.test(cleanSkill) ? '(?:$|\\b)' : '(?:$|\\s|[.,;()!])';

    const regex = new RegExp(`${startBoundary}${escaped}${endBoundary}`, 'i');
    return regex.test(normalizedText);
}
