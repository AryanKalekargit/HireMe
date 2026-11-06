// Multi-User In-Memory Data Store for HireMe
// Maintains strict data isolation per userId for profiles, resumes, saved jobs, and analyses.

export interface MockProfile {
    _id: string;
    userId: string;
    name?: string;
    email?: string;
    headline: string;
    targetRole: string;
    desiredSalary: string;
    bio: string;
    skills: string[];
    technicalSkills?: string[];
    softSkills?: string[];
    targetDomain?: string;
    experienceLevel: string;
    location: string;
    createdAt: string;
    updatedAt: string;
}

export interface MockResume {
    _id: string;
    userId: string;
    fileName: string;
    fileUrl: string;
    cloudinaryPublicId?: string;
    rawText: string;
    parsedSkills: string[];
    parsedTechnicalSkills?: string[];
    parsedSoftSkills?: string[];
    experience: Array<{ title: string; company: string; duration?: string; description?: string }>;
    education: Array<{ degree: string; institution: string; year?: string }>;
    isPrimary: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface MockSavedJob {
    _id: string;
    userId: string;
    jobId: string;
    jobTitle: string;
    company: string;
    location?: string;
    hireScore: number;
    status: 'MATCHED' | 'Matched' | 'SAVED' | 'APPLIED' | 'INTERVIEWING' | 'OFFERED' | 'REJECTED' | 'Saved' | 'Applied' | 'Interviewing' | 'Offer' | 'Rejected';
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
    createdAt: string;
    updatedAt: string;
}

export interface MockJobAnalysis {
    _id: string;
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
    createdAt: string;
    updatedAt: string;
}

export interface MockUserAccount {
    userId: string;
    email: string;
    name: string;
    passwordHash?: string;
    targetRole?: string;
    role: string;
    imageUrl?: string;
    createdAt: string;
}

class MemoryStore {
    users: Map<string, MockUserAccount> = new Map();
    profiles: Map<string, MockProfile> = new Map();
    resumes: MockResume[] = [];
    savedJobs: MockSavedJob[] = [];
    analyses: MockJobAnalysis[] = [];
    activityLogs: Array<{ userId: string; action: string; details: any; createdAt: string }> = [];

    constructor() {
        this.seedInitialUsers();
    }

    private seedInitialUsers() {
        const now = new Date().toISOString();

        // ═════════════════════════════════════════════════════════════════════
        // USER 1: Alex Morgan (Senior Full Stack Engineer)
        // ═════════════════════════════════════════════════════════════════════
        const alexId = 'user_alex_morgan';
        this.profiles.set(alexId, {
            _id: 'prof_alex',
            userId: alexId,
            headline: 'Alex Morgan - Senior Full Stack Engineer',
            targetRole: 'Senior Full Stack Engineer',
            desiredSalary: '₹24,00,000 - ₹35,00,000',
            bio: 'Passionate developer building high-performance web applications with React, Next.js, Node.js, and Cloud Infrastructure.',
            skills: ['React', 'TypeScript', 'Next.js', 'Node.js', 'MongoDB', 'Tailwind CSS', 'AWS', 'Docker', 'GraphQL', 'REST API'],
            experienceLevel: 'Senior Level',
            location: 'Bengaluru, Karnataka (Hybrid)',
            createdAt: now,
            updatedAt: now,
        });

        this.resumes.push({
            _id: 'res_alex',
            userId: alexId,
            fileName: 'alex_morgan_resume_2026.pdf',
            fileUrl: '/uploads/alex_morgan_resume.pdf',
            rawText: `Alex Morgan - Senior Full Stack Engineer. 6+ years experience in React, Next.js, TypeScript, Node.js, MongoDB, AWS, Docker, REST APIs, and microservices architecture. Built scalable web applications serving over 2M active users in India and globally.`,
            parsedSkills: ['React', 'TypeScript', 'Next.js', 'Node.js', 'MongoDB', 'Tailwind CSS', 'AWS', 'Docker', 'REST API'],
            experience: [
                {
                    title: 'Senior Software Engineer',
                    company: 'Swiggy Tech',
                    duration: '2022 - Present',
                    description: 'Architected micro-frontends and real-time delivery dashboards using Next.js 14 and Node.js. Reduced bundle size by 35%.',
                },
                {
                    title: 'Full Stack Developer',
                    company: 'Razorpay',
                    duration: '2020 - 2022',
                    description: 'Developed scalable RESTful payment gateway APIs with MongoDB and Node.js. Integrated CI/CD automation pipelines.',
                },
            ],
            education: [
                {
                    degree: 'B.Tech in Computer Science',
                    institution: 'IIT Bangalore / NIT',
                    year: '2020',
                },
            ],
            isPrimary: true,
            createdAt: now,
            updatedAt: now,
        });

        this.savedJobs.push(
            {
                _id: 'job_alex_1',
                userId: alexId,
                jobId: 'flipkart_fullstack_2026',
                jobTitle: 'Senior Full Stack Engineer',
                company: 'Flipkart',
                location: 'Bengaluru, Karnataka (Hybrid)',
                status: 'INTERVIEWING',
                hireScore: 92,
                salaryRange: '₹28,00,000 - ₹38,00,000',
                notes: 'Passed initial recruiter screen. System design interview scheduled for next week.',
                url: 'https://linkedin.com/jobs/view/flipkart-senior-fullstack',
                appliedDate: '2026-08-01',
                createdAt: now,
                updatedAt: now,
            },
            {
                _id: 'job_alex_2',
                userId: alexId,
                jobId: 'zomato_frontend_2026',
                jobTitle: 'Lead Frontend Engineer',
                company: 'Zomato',
                location: 'Gurgaon, Haryana (Hybrid)',
                status: 'APPLIED',
                hireScore: 88,
                salaryRange: '₹30,00,000 - ₹42,00,000',
                notes: 'Tailored resume emphasizing Next.js SSR performance and design system expertise.',
                url: 'https://linkedin.com/jobs/view/zomato-frontend-lead',
                appliedDate: '2026-08-03',
                createdAt: now,
                updatedAt: now,
            }
        );

        this.analyses.push({
            _id: 'ana_alex_1',
            userId: alexId,
            jobId: 'flipkart_fullstack_2026',
            jobTitle: 'Senior Full Stack Engineer',
            company: 'Flipkart',
            hireScore: 92,
            matchedSkills: ['React', 'TypeScript', 'Next.js', 'Node.js', 'GraphQL', 'REST API'],
            missingSkills: ['Redis', 'Kafka'],
            bonusSkills: ['Docker', 'AWS', 'Tailwind CSS'],
            strengths: ['Exceptional alignment in React, TypeScript, and modern frontend architecture.'],
            recommendations: ['Highlight distributed caching with Redis and message queues.'],
            createdAt: now,
            updatedAt: now,
        });

        // ═════════════════════════════════════════════════════════════════════
        // USER 2: Sarah Chen (Lead Cloud & DevOps Architect)
        // ═════════════════════════════════════════════════════════════════════
        const sarahId = 'user_sarah_chen';
        this.profiles.set(sarahId, {
            _id: 'prof_sarah',
            userId: sarahId,
            headline: 'Sarah Chen - Lead Cloud & DevOps Architect',
            targetRole: 'Lead Cloud & DevOps Architect',
            desiredSalary: '₹35,00,000 - ₹50,00,000',
            bio: 'DevOps & Site Reliability Engineer with 8+ years experience scaling Kubernetes clusters, Terraform infrastructure, and zero-downtime CI/CD pipelines.',
            skills: ['Kubernetes', 'Docker', 'AWS', 'Terraform', 'CI/CD', 'Python', 'Go', 'Linux', 'Prometheus', 'Grafana'],
            experienceLevel: 'Lead / Management',
            location: 'Hyderabad, Telangana (Remote)',
            createdAt: now,
            updatedAt: now,
        });

        this.resumes.push({
            _id: 'res_sarah',
            userId: sarahId,
            fileName: 'sarah_chen_cloud_architect.pdf',
            fileUrl: '/uploads/sarah_chen_resume.pdf',
            rawText: `Sarah Chen - Lead Cloud Architect. Specializing in AWS multi-region infrastructure, Kubernetes orchestration, Terraform automation, and microservice observability. Led DevOps team supporting 99.99% uptime for fintech banking platform.`,
            parsedSkills: ['Kubernetes', 'Docker', 'AWS', 'Terraform', 'CI/CD', 'Python', 'Go', 'Linux'],
            experience: [
                {
                    title: 'Principal DevOps Architect',
                    company: 'Jio Platforms',
                    duration: '2021 - Present',
                    description: 'Managed Kubernetes infrastructure hosting 120+ microservices on AWS and private clouds with Terraform IaC.',
                },
            ],
            education: [
                {
                    degree: 'M.Tech in Computer Engineering',
                    institution: 'IIT Hyderabad',
                    year: '2018',
                },
            ],
            isPrimary: true,
            createdAt: now,
            updatedAt: now,
        });

        this.savedJobs.push(
            {
                _id: 'job_sarah_1',
                userId: sarahId,
                jobId: 'aws_principal_architect_india',
                jobTitle: 'Principal Cloud Architect',
                company: 'Amazon Web Services India',
                location: 'Hyderabad, Telangana',
                status: 'INTERVIEWING',
                hireScore: 96,
                salaryRange: '₹45,00,000 - ₹65,00,000',
                notes: 'Passed executive architectural review. Presentation scheduled for Friday.',
                url: 'https://linkedin.com/jobs/view/aws-india-principal-architect',
                appliedDate: '2026-08-05',
                createdAt: now,
                updatedAt: now,
            }
        );

        this.analyses.push({
            _id: 'ana_sarah_1',
            userId: sarahId,
            jobId: 'aws_principal_architect_india',
            jobTitle: 'Principal Cloud Architect',
            company: 'Amazon Web Services India',
            hireScore: 96,
            matchedSkills: ['Kubernetes', 'Docker', 'AWS', 'Terraform', 'CI/CD', 'Python', 'Go'],
            missingSkills: ['Rust'],
            bonusSkills: ['Prometheus', 'Grafana'],
            strengths: ['Unmatched mastery in cloud infrastructure and cluster governance.'],
            recommendations: ['Emphasize multi-account cost optimization metrics.'],
            createdAt: now,
            updatedAt: now,
        });

        // ═════════════════════════════════════════════════════════════════════
        // USER 3: David Kim (AI & Machine Learning Engineer)
        // ═════════════════════════════════════════════════════════════════════
        const davidId = 'user_david_kim';
        this.profiles.set(davidId, {
            _id: 'prof_david',
            userId: davidId,
            headline: 'David Kim - AI & Machine Learning Engineer',
            targetRole: 'AI & Machine Learning Engineer',
            desiredSalary: '₹30,00,000 - ₹45,00,000',
            bio: 'AI researcher and engineer deploying large language model pipelines, vector search embeddings, and PyTorch fine-tuning.',
            skills: ['Python', 'PyTorch', 'TensorFlow', 'LLMs', 'LangChain', 'FastAPI', 'SQL', 'Docker', 'Git'],
            experienceLevel: 'Senior Level',
            location: 'Pune, Maharashtra (Hybrid)',
            createdAt: now,
            updatedAt: now,
        });

        this.resumes.push({
            _id: 'res_david',
            userId: davidId,
            fileName: 'david_kim_ai_engineer.pdf',
            fileUrl: '/uploads/david_kim_resume.pdf',
            rawText: `David Kim - Senior AI Engineer. Deep experience in PyTorch model training, fine-tuning Llama and Mistral models, vector databases (Pinecone/Milvus), and RAG enterprise search architectures.`,
            parsedSkills: ['Python', 'PyTorch', 'TensorFlow', 'FastAPI', 'SQL', 'Docker', 'Git'],
            experience: [
                {
                    title: 'Lead AI Engineer',
                    company: 'Tata Consultancy Services - AI Lab',
                    duration: '2022 - Present',
                    description: 'Deployed enterprise RAG search system reducing customer support latency by 60%.',
                },
            ],
            education: [
                {
                    degree: 'B.Tech in Artificial Intelligence',
                    institution: 'IIT Bombay',
                    year: '2021',
                },
            ],
            isPrimary: true,
            createdAt: now,
            updatedAt: now,
        });

        this.savedJobs.push(
            {
                _id: 'job_david_1',
                userId: davidId,
                jobId: 'microsoft_india_ml_engineer',
                jobTitle: 'Research Engineer - Applied AI',
                company: 'Microsoft India IDC',
                location: 'Bengaluru / Hyderabad',
                status: 'APPLIED',
                hireScore: 91,
                salaryRange: '₹40,00,000 - ₹55,00,000',
                notes: 'Submitted customized portfolio highlighting LLM evaluation framework.',
                url: 'https://linkedin.com/jobs/view/microsoft-india-applied-ai',
                appliedDate: '2026-08-08',
                createdAt: now,
                updatedAt: now,
            }
        );

        // Seed user accounts for authentication
        this.users.set(alexId, {
            userId: alexId,
            email: 'alex.morgan@gmail.com',
            name: 'Alex Morgan',
            targetRole: 'Senior Full Stack Engineer',
            role: 'job_seeker',
            imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
            createdAt: now,
        });

        this.users.set(sarahId, {
            userId: sarahId,
            email: 'sarah.chen@gmail.com',
            name: 'Sarah Chen',
            targetRole: 'Lead Cloud & DevOps Architect',
            role: 'job_seeker',
            imageUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&auto=format&fit=crop&q=80',
            createdAt: now,
        });

        this.users.set(davidId, {
            userId: davidId,
            email: 'david.kim@gmail.com',
            name: 'David Kim',
            targetRole: 'AI & Machine Learning Engineer',
            role: 'job_seeker',
            imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
            createdAt: now,
        });
    }

    // Helper to get or create a profile on demand
    getOrCreateProfile(userId: string, name?: string, email?: string, targetRole?: string): MockProfile {
        let profile = this.profiles.get(userId);
        if (!profile) {
            const now = new Date().toISOString();
            profile = {
                _id: `prof_${Date.now()}`,
                userId,
                headline: name ? `${name} - ${targetRole || 'Software Professional'}` : 'Tech Professional',
                targetRole: targetRole || 'Software Engineer',
                desiredSalary: '₹18,00,000 - ₹28,00,000',
                bio: 'Passionate developer building scalable modern applications.',
                skills: [],
                technicalSkills: [],
                softSkills: [],
                targetDomain: 'fullstack',
                experienceLevel: 'Mid Level',
                location: 'Bengaluru, Karnataka (Remote)',
                createdAt: now,
                updatedAt: now,
            };
            this.profiles.set(userId, profile);
        }
        return profile;
    }
}

// Global singleton instance across Next.js dev server hot-reloads
declare global {
    // eslint-disable-next-line no-var
    var hiremeMemoryStore: MemoryStore | undefined;
}

if (!global.hiremeMemoryStore) {
    global.hiremeMemoryStore = new MemoryStore();
} else if (!global.hiremeMemoryStore.users) {
    global.hiremeMemoryStore.users = new Map();
}

export const memoryStore = global.hiremeMemoryStore!;
