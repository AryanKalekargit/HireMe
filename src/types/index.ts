export interface IUser {
    _id?: string;
    clerkId: string;
    email: string;
    name: string;
    passwordHash?: string;
    targetRole?: string;
    imageUrl?: string;
    role: 'job_seeker' | 'recruiter' | 'admin';
    createdAt?: string;
    updatedAt?: string;
}

export interface IProfile {
    _id?: string;
    userId: string;
    name?: string;
    email?: string;
    headline: string;
    targetRole: string;
    desiredSalary?: string;
    bio?: string;
    skills: string[];
    technicalSkills?: string[];
    softSkills?: string[];
    targetDomain?: string;
    experienceLevel: 'Entry Level' | 'Mid Level' | 'Senior Level' | 'Lead / Management';
    location?: string;
    updatedAt?: string;
}

export interface IResume {
    _id?: string;
    userId: string;
    fileName: string;
    fileUrl?: string;
    fileBase64?: string;
    fileSize?: number;
    fileType?: string;
    cloudinaryPublicId?: string;
    rawText: string;
    parsedSkills: string[];
    parsedTechnicalSkills?: string[];
    parsedSoftSkills?: string[];
    experience: Array<{
        title: string;
        company: string;
        duration?: string;
        description?: string;
    }>;
    education: Array<{
        degree: string;
        institution: string;
        year?: string;
    }>;
    isPrimary: boolean;
    createdAt?: string;
}

export interface IJob {
    _id?: string;
    title: string;
    company: string;
    location?: string;
    description: string;
    url?: string;
    salaryRange?: string;
    companyLogo?: string;
    createdAt?: string;
}

export interface IJobAnalysis {
    _id?: string;
    userId: string;
    jobId: string;
    jobTitle: string;
    company: string;
    hireScore: number;
    technicalScore?: number;
    softScore?: number;
    matchedSkills: string[];
    missingSkills: string[];
    matchedTechnicalSkills?: string[];
    missingTechnicalSkills?: string[];
    matchedSoftSkills?: string[];
    missingSoftSkills?: string[];
    bonusSkills: string[];
    detectedDomain?: string;
    contactEmail?: string;
    contactPhone?: string;
    contactDisplay?: string;
    requiredExperience?: string;
    experienceMatchStatus?: 'MATCH' | 'MISMATCH' | 'FLEXIBLE' | 'UNKNOWN';
    experienceMatchMessage?: string;
    employmentType?: 'Internship' | 'Job' | string;
    compensationType?: 'Stipend' | 'CTC' | string;
    compensation?: string;
    strengths: string[];
    recommendations: string[];
    url?: string;
    source?: 'linkedin' | 'direct';
    createdAt?: string;
}

export interface ISavedJob {
    _id?: string;
    userId: string;
    jobId: string;
    jobTitle: string;
    company: string;
    location?: string;
    hireScore: number;
    status: 'MATCHED' | 'SAVED' | 'APPLIED' | 'INTERVIEWING' | 'OFFERED' | 'REJECTED';
    notes?: string;
    description?: string;
    url?: string;
    source?: 'linkedin' | 'direct';
    contactEmail?: string;
    contactPhone?: string;
    contactDisplay?: string;
    requiredExperience?: string;
    experienceMatchStatus?: 'MATCH' | 'MISMATCH' | 'FLEXIBLE' | 'UNKNOWN';
    experienceMatchMessage?: string;
    employmentType?: 'Internship' | 'Job' | string;
    compensationType?: 'Stipend' | 'CTC' | string;
    compensation?: string;
    salaryRange?: string;
    appliedDate?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface IActivityLog {
    _id?: string;
    userId: string;
    action: string;
    details?: Record<string, unknown>;
    createdAt?: string;
}

export interface IDashboardStats {
    totalAnalyzed: number;
    avgHireScore: number;
    savedJobsCount: number;
    appliedJobsCount: number;
    interviewingCount?: number;
    highMatchCount?: number;
    linkedinAnalyzedCount?: number;
    directAnalyzedCount?: number;
    linkedinAvgScore?: number;
    directAvgScore?: number;
    topSkills: Array<{ name: string; count: number }>;
    missingSkillsFreq: Array<{ name: string; count: number }>;
    recentAnalyses: IJobAnalysis[];
    resumeStatus: {
        uploaded: boolean;
        fileName?: string;
        skillsCount: number;
        lastUpdated?: string;
    };
}
