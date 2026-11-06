'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { useSession } from '@/lib/session-context';

const DOMAIN_OPTIONS = [
    { id: 'all', label: 'All Domains' },
    { id: 'frontend', label: 'Frontend' },
    { id: 'backend', label: 'Backend' },
    { id: 'fullstack', label: 'Full Stack' },
    { id: 'database', label: 'Database & Data' },
    { id: 'cloud_devops', label: 'Cloud & DevOps' },
    { id: 'mobile', label: 'Mobile App' },
    { id: 'ai_ml_data', label: 'AI / Machine Learning' },
    { id: 'cybersecurity', label: 'Cybersecurity' },
    { id: 'qa_testing', label: 'QA & Testing' },
    { id: 'embedded_iot', label: 'Embedded & IoT' },
];

const DOMAIN_RECOMMENDED_SKILLS: Record<string, string[]> = {
    frontend: ['React', 'Next.js', 'TypeScript', 'JavaScript', 'HTML5', 'CSS3', 'Tailwind CSS', 'Redux', 'GraphQL', 'Vite'],
    backend: ['Node.js', 'Express.js', 'Python', 'FastAPI', 'Java', 'Spring Boot', 'Go', 'PostgreSQL', 'REST API', 'Microservices', 'Docker'],
    fullstack: ['React', 'Next.js', 'Node.js', 'TypeScript', 'PostgreSQL', 'MongoDB', 'REST API', 'GraphQL', 'Docker', 'Tailwind CSS'],
    database: ['PostgreSQL', 'MongoDB', 'MySQL', 'Redis', 'Snowflake', 'BigQuery', 'Elasticsearch', 'SQL', 'Database Indexing', 'Prisma'],
    cloud_devops: ['AWS', 'Docker', 'Kubernetes', 'Terraform', 'CI/CD', 'GitHub Actions', 'Linux', 'Nginx', 'Prometheus', 'SRE'],
    mobile: ['React Native', 'Flutter', 'Dart', 'Swift', 'iOS Development', 'Kotlin', 'Android Development', 'Jetpack Compose'],
    ai_ml_data: ['Python', 'PyTorch', 'TensorFlow', 'Scikit-learn', 'Machine Learning', 'Artificial Intelligence', 'Pandas', 'NumPy', 'LLM', 'RAG', 'NLP'],
    cybersecurity: ['Cybersecurity', 'OWASP Top 10', 'Penetration Testing', 'Network Security', 'Cryptography', 'IAM', 'SIEM', 'SOC', 'Zero Trust'],
    qa_testing: ['Selenium', 'Cypress', 'Playwright', 'Jest', 'Test Automation', 'Manual Testing', 'E2E Testing', 'Postman', 'TDD'],
    embedded_iot: ['C', 'C++', 'Embedded C', 'RTOS', 'ARM Cortex', 'Firmware', 'ESP32', 'Arduino', 'IoT', 'MQTT'],
};

const RECOMMENDED_SOFT_SKILLS = [
    'Communication',
    'Team Leadership',
    'Problem Solving',
    'Critical Thinking',
    'Collaboration',
    'Adaptability',
    'Mentorship',
    'Time Management',
    'Conflict Resolution',
    'Agile Mindset',
    'Ownership',
    'Emotional Intelligence',
];

export default function ProfilePage() {
    const { user } = useSession();
    const [fullName, setFullName] = useState(user?.name || '');
    const [accountEmail, setAccountEmail] = useState(user?.email || '');
    const [targetTitle, setTargetTitle] = useState('Full Stack Engineer');
    const [selectedDomain, setSelectedDomain] = useState('all');
    const [experienceLevel, setExperienceLevel] = useState('Mid Level');
    const [technicalSkills, setTechnicalSkills] = useState<string[]>([]);
    const [softSkills, setSoftSkills] = useState<string[]>([]);
    const [newTechSkill, setNewTechSkill] = useState('');
    const [newSoftSkill, setNewSoftSkill] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [uploadSummary, setUploadSummary] = useState('');
    const [saveSuccess, setSaveSuccess] = useState(false);

    useEffect(() => {
        if (user?.name && !fullName) {
            setFullName(user.name);
        }
        if (user?.email && !accountEmail) {
            setAccountEmail(user.email);
        }
    }, [user, fullName, accountEmail]);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await fetch('/api/profile');
            const data = await res.json();
            if (data.success && data.profile) {
                if (data.profile.name) {
                    setFullName(data.profile.name);
                } else if (user?.name) {
                    setFullName(user.name);
                } else if (data.profile.headline && data.profile.headline.includes(' - ')) {
                    const namePart = data.profile.headline.split(' - ')[0];
                    setFullName(namePart || '');
                }

                if (data.profile.email) {
                    setAccountEmail(data.profile.email);
                } else if (user?.email) {
                    setAccountEmail(user.email);
                }

                if (data.profile.targetRole || data.profile.targetJobTitle) {
                    setTargetTitle(data.profile.targetRole || data.profile.targetJobTitle);
                }
                if (data.profile.experienceLevel) {
                    setExperienceLevel(data.profile.experienceLevel);
                }
                if (data.profile.targetDomain) {
                    setSelectedDomain(data.profile.targetDomain);
                }

                // Handle segregated skills
                if (Array.isArray(data.profile.technicalSkills)) {
                    setTechnicalSkills(data.profile.technicalSkills);
                }
                if (Array.isArray(data.profile.softSkills)) {
                    setSoftSkills(data.profile.softSkills);
                }
                // Fallback if only combined skills exists
                if (
                    (!data.profile.technicalSkills || data.profile.technicalSkills.length === 0) &&
                    (!data.profile.softSkills || data.profile.softSkills.length === 0) &&
                    Array.isArray(data.profile.skills)
                ) {
                    setTechnicalSkills(data.profile.skills);
                }
            }
        } catch (e) {
            console.error('Fetch profile failed:', e);
        }
    };

    // Add Technical Skill
    const handleAddTechSkill = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = newTechSkill.trim();
        if (!trimmed) return;
        if (!technicalSkills.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
            setTechnicalSkills([...technicalSkills, trimmed]);
        }
        setNewTechSkill('');
    };

    const handleRemoveTechSkill = (skillToRemove: string) => {
        setTechnicalSkills(technicalSkills.filter((s) => s !== skillToRemove));
    };

    const handleQuickAddTechSkill = (skill: string) => {
        if (!technicalSkills.some((s) => s.toLowerCase() === skill.toLowerCase())) {
            setTechnicalSkills([...technicalSkills, skill]);
        }
    };

    // Add Soft Skill
    const handleAddSoftSkill = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = newSoftSkill.trim();
        if (!trimmed) return;
        if (!softSkills.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
            setSoftSkills([...softSkills, trimmed]);
        }
        setNewSoftSkill('');
    };

    const handleRemoveSoftSkill = (skillToRemove: string) => {
        setSoftSkills(softSkills.filter((s) => s !== skillToRemove));
    };

    const handleQuickAddSoftSkill = (skill: string) => {
        if (!softSkills.some((s) => s.toLowerCase() === skill.toLowerCase())) {
            setSoftSkills([...softSkills, skill]);
        }
    };

    // Upload Resume & Parse Dual Skillsets
    const handleUploadResume = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return;
        setUploading(true);
        setUploadSuccess(false);

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('resume', file);

            const res = await fetch('/api/resume/upload', {
                method: 'POST',
                body: formData,
            });

            const data = await res.json();
            if (data.success) {
                const detectedTech = data.technicalSkills || [];
                const detectedSoft = data.softSkills || [];
                const allParsed = data.parsedSkills || [];

                let updatedTech = technicalSkills;
                let updatedSoft = softSkills;

                if (detectedTech.length > 0) {
                    updatedTech = Array.from(new Set([...technicalSkills, ...detectedTech]));
                    setTechnicalSkills(updatedTech);
                } else if (allParsed.length > 0) {
                    updatedTech = Array.from(new Set([...technicalSkills, ...allParsed]));
                    setTechnicalSkills(updatedTech);
                }

                if (detectedSoft.length > 0) {
                    updatedSoft = Array.from(new Set([...softSkills, ...detectedSoft]));
                    setSoftSkills(updatedSoft);
                }

                setUploadSummary(
                    `Extracted ${detectedTech.length || allParsed.length} Technical Skills and ${detectedSoft.length} Personality Development Skills!`
                );
                setUploadSuccess(true);
                setTimeout(() => setUploadSuccess(false), 7000);
            }
        } catch (err) {
            console.error('Resume upload error:', err);
        } finally {
            setUploading(false);
        }
    };

    // Save Profile (Syncs Technical & Soft Skills to MongoDB Atlas)
    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const combinedSkills = Array.from(new Set([...technicalSkills, ...softSkills]));
            const res = await fetch('/api/profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: fullName,
                    headline: `${fullName} - ${targetTitle}`,
                    targetRole: targetTitle,
                    targetJobTitle: targetTitle,
                    targetDomain: selectedDomain,
                    experienceLevel,
                    technicalSkills,
                    softSkills,
                    skills: combinedSkills,
                }),
            });
            const data = await res.json();
            if (data.success) {
                setSaveSuccess(true);
                setTimeout(() => setSaveSuccess(false), 4000);
            }
        } catch (err) {
            console.error('Save profile error:', err);
        }
    };

    const activeRecommendedTech =
        selectedDomain === 'all'
            ? Object.values(DOMAIN_RECOMMENDED_SKILLS).flat().slice(0, 16)
            : DOMAIN_RECOMMENDED_SKILLS[selectedDomain] || DOMAIN_RECOMMENDED_SKILLS.fullstack;

    return (
        <div className="flex min-h-screen bg-background text-on-surface font-sans">
            <Sidebar />

            <div className="flex-1 flex flex-col min-w-0">
                <Header title="Resume & Candidate Profile" />

                <main className="p-6 space-y-6 max-w-7xl mx-auto w-full">
                    {saveSuccess && (
                        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center gap-2 animate-fade-in">
                            <span className="material-symbols-outlined text-sm">verified</span>
                            Profile details, technical skills, and personality development skills synchronized in MongoDB!
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left 2 Columns: Resume Upload & Dual Skillsets */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Resume Upload Dropzone Card */}
                            <div className="glass-card rounded-2xl p-6 border border-white/10">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="material-symbols-outlined text-primary text-xl">upload_file</span>
                                    <h3 className="font-bold text-lg text-white">Upload Resume PDF</h3>
                                </div>
                                <p className="text-xs text-slate-400 mb-5">
                                    Upload your resume to automatically extract both <span className="text-secondary font-semibold">Technical Skills</span> and <span className="text-emerald-400 font-semibold">Personality Development Skills</span>.
                                </p>

                                <form onSubmit={handleUploadResume} className="space-y-4">
                                    <div className="border-2 border-dashed border-white/10 hover:border-primary-container rounded-2xl p-6 text-center bg-surface-container-high/50 transition-colors cursor-pointer relative">
                                        <input
                                            type="file"
                                            accept=".pdf"
                                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        />
                                        <div className="w-12 h-12 rounded-full bg-primary-container/10 border border-primary-container/20 flex items-center justify-center text-primary mx-auto mb-2">
                                            <span className="material-symbols-outlined text-2xl">cloud_upload</span>
                                        </div>
                                        <p className="text-xs font-semibold text-white">
                                            {file ? file.name : 'Click to select PDF or drag and drop here'}
                                        </p>
                                        <p className="text-[10px] text-slate-400 mt-1">Supports PDF up to 10MB</p>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={!file || uploading}
                                        className="w-full bg-primary-container hover:bg-primary-container/90 text-white text-xs font-bold py-3 rounded-xl transition-all shadow-md shadow-indigo-500/25 flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {uploading ? (
                                            <>
                                                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                Parsing Resume Content & Skills...
                                            </>
                                        ) : (
                                            <>
                                                <span className="material-symbols-outlined text-sm">auto_awesome</span>
                                                Parse & Extract Dual Skillsets
                                            </>
                                        )}
                                    </button>

                                    {uploadSuccess && (
                                        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center gap-2 animate-fade-in">
                                            <span className="material-symbols-outlined text-sm">check_circle</span>
                                            {uploadSummary || 'Resume parsed and skills synchronized!'}
                                        </div>
                                    )}
                                </form>
                            </div>

                            {/* 1. TECHNICAL SKILLS SECTION */}
                            <div className="glass-card rounded-2xl p-6 border border-white/10 space-y-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-white/5">
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-primary text-xl">code</span>
                                        <h3 className="font-bold text-base text-white">
                                            Technical Skills ({technicalSkills.length})
                                        </h3>
                                    </div>
                                    <span className="text-[10px] text-slate-400">
                                        Normalized with canonical aliases & 50%+ fuzzy matching
                                    </span>
                                </div>

                                {/* Domain Track Filter Pills */}
                                <div>
                                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-2 tracking-wider">
                                        Filter Recommendations by Technical Domain
                                    </span>
                                    <div className="flex flex-wrap gap-1.5">
                                        {DOMAIN_OPTIONS.map((opt) => (
                                            <button
                                                key={opt.id}
                                                type="button"
                                                onClick={() => setSelectedDomain(opt.id)}
                                                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                                                    selectedDomain === opt.id
                                                        ? 'bg-primary-container text-white shadow-sm shadow-indigo-500/30'
                                                        : 'bg-surface-container-high text-slate-400 hover:text-white hover:bg-white/10'
                                                }`}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Quick Add Suggestions for Active Domain */}
                                <div className="p-3 rounded-xl bg-surface-container-lowest/60 border border-white/5">
                                    <span className="text-[10px] text-slate-400 font-semibold block mb-1.5">
                                        + Quick Add Popular {DOMAIN_OPTIONS.find((d) => d.id === selectedDomain)?.label} Skills:
                                    </span>
                                    <div className="flex flex-wrap gap-1.5">
                                        {activeRecommendedTech.map((skill) => {
                                            const hasSkill = technicalSkills.some((s) => s.toLowerCase() === skill.toLowerCase());
                                            return (
                                                <button
                                                    key={skill}
                                                    type="button"
                                                    onClick={() => handleQuickAddTechSkill(skill)}
                                                    disabled={hasSkill}
                                                    className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                                                        hasSkill
                                                            ? 'bg-white/5 text-slate-500 cursor-not-allowed border border-white/5'
                                                            : 'bg-primary-container/10 hover:bg-primary-container/20 text-primary border border-primary/20'
                                                    }`}
                                                >
                                                    {hasSkill ? `✓ ${skill}` : `+ ${skill}`}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Add Custom Technical Skill Form */}
                                <form onSubmit={handleAddTechSkill} className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Add custom tech skill (e.g. Next.js, Kubernetes, PyTorch, C#, AWS Lambda)"
                                        value={newTechSkill}
                                        onChange={(e) => setNewTechSkill(e.target.value)}
                                        className="flex-1 bg-surface-container-high border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary-container"
                                    />
                                    <button
                                        type="submit"
                                        className="bg-primary-container hover:bg-primary-container/90 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors"
                                    >
                                        Add Skill
                                    </button>
                                </form>

                                {/* Technical Skill Badges */}
                                <div className="flex flex-wrap gap-2 pt-1 max-h-56 overflow-y-auto">
                                    {technicalSkills.length > 0 ? (
                                        technicalSkills.map((skill) => (
                                            <span
                                                key={skill}
                                                className="px-3 py-1 rounded-xl bg-surface-container-high border border-indigo-500/20 text-xs font-medium text-white flex items-center gap-1.5 hover:border-primary-container transition-colors"
                                            >
                                                <span>{skill}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveTechSkill(skill)}
                                                    className="text-slate-400 hover:text-red-400 transition-colors text-sm leading-none ml-1"
                                                >
                                                    ×
                                                </button>
                                            </span>
                                        ))
                                    ) : (
                                        <p className="text-xs text-slate-500 italic py-2">
                                            No technical skills added yet. Add manually above or upload your CV.
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* 2. PERSONALITY DEVELOPMENT & SOFT SKILLS SECTION */}
                            <div className="glass-card rounded-2xl p-6 border border-white/10 space-y-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-white/5">
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-emerald-400 text-xl">psychology</span>
                                        <h3 className="font-bold text-base text-white">
                                            Personality Development & Soft Skills ({softSkills.length})
                                        </h3>
                                    </div>
                                    <span className="text-[10px] text-emerald-400 font-medium">
                                        Universal across all tech roles · Essential for high hire scores
                                    </span>
                                </div>

                                <p className="text-xs text-slate-400">
                                    Job descriptions evaluate personality development traits like leadership, communication, and adaptability. If a candidate lacks soft skills that the JD specifies, the hire score will reflect that gap.
                                </p>

                                {/* Quick Add Universal Soft Skills */}
                                <div className="p-3 rounded-xl bg-surface-container-lowest/60 border border-white/5">
                                    <span className="text-[10px] text-slate-400 font-semibold block mb-1.5">
                                        + Quick Add Personality & Leadership Skills:
                                    </span>
                                    <div className="flex flex-wrap gap-1.5">
                                        {RECOMMENDED_SOFT_SKILLS.map((skill) => {
                                            const hasSkill = softSkills.some((s) => s.toLowerCase() === skill.toLowerCase());
                                            return (
                                                <button
                                                    key={skill}
                                                    type="button"
                                                    onClick={() => handleQuickAddSoftSkill(skill)}
                                                    disabled={hasSkill}
                                                    className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                                                        hasSkill
                                                            ? 'bg-white/5 text-slate-500 cursor-not-allowed border border-white/5'
                                                            : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20'
                                                    }`}
                                                >
                                                    {hasSkill ? `✓ ${skill}` : `+ ${skill}`}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Add Custom Soft Skill Form */}
                                <form onSubmit={handleAddSoftSkill} className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Add personality skill (e.g. Stakeholder Management, Mentorship, Agile/Scrum)"
                                        value={newSoftSkill}
                                        onChange={(e) => setNewSoftSkill(e.target.value)}
                                        className="flex-1 bg-surface-container-high border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                                    />
                                    <button
                                        type="submit"
                                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors"
                                    >
                                        Add Trait
                                    </button>
                                </form>

                                {/* Soft Skill Badges */}
                                <div className="flex flex-wrap gap-2 pt-1 max-h-56 overflow-y-auto">
                                    {softSkills.length > 0 ? (
                                        softSkills.map((skill) => (
                                            <span
                                                key={skill}
                                                className="px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-medium text-emerald-300 flex items-center gap-1.5 hover:border-emerald-400 transition-colors"
                                            >
                                                <span>{skill}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveSoftSkill(skill)}
                                                    className="text-slate-400 hover:text-red-400 transition-colors text-sm leading-none ml-1"
                                                >
                                                    ×
                                                </button>
                                            </span>
                                        ))
                                    ) : (
                                        <p className="text-xs text-slate-500 italic py-2">
                                            No personality development skills added yet. Click suggestions above to add.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Candidate Profile Settings */}
                        <div className="glass-card rounded-2xl p-6 border border-white/10 space-y-6 h-fit sticky top-6">
                            <div className="flex items-center gap-2 pb-4 border-b border-white/5">
                                <span className="material-symbols-outlined text-primary text-xl">person</span>
                                <h3 className="font-bold text-base text-white">Candidate Details</h3>
                            </div>

                            <form onSubmit={handleSaveProfile} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
                                    <input
                                        type="text"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        placeholder="Your full name"
                                        className="w-full bg-surface-container-high border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-primary-container"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1">Account Email</label>
                                    <input
                                        type="text"
                                        value={accountEmail || user?.email || ''}
                                        disabled
                                        placeholder="Loading account email..."
                                        className="w-full bg-surface-container-lowest border border-white/5 rounded-xl px-3.5 py-2 text-xs text-slate-300 cursor-not-allowed"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1">Target Job Title</label>
                                    <input
                                        type="text"
                                        value={targetTitle}
                                        onChange={(e) => setTargetTitle(e.target.value)}
                                        className="w-full bg-surface-container-high border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-primary-container"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1">Primary Role Track</label>
                                    <select
                                        value={selectedDomain}
                                        onChange={(e) => setSelectedDomain(e.target.value)}
                                        className="w-full bg-surface-container-high border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none"
                                    >
                                        {DOMAIN_OPTIONS.map((d) => (
                                            <option key={d.id} value={d.id}>
                                                {d.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1">Experience Level</label>
                                    <select
                                        value={experienceLevel}
                                        onChange={(e) => setExperienceLevel(e.target.value)}
                                        className="w-full bg-surface-container-high border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none"
                                    >
                                        <option value="Entry Level">Entry Level (0-2 yrs)</option>
                                        <option value="Mid Level">Mid Level (2-5 yrs)</option>
                                        <option value="Senior Level">Senior Level (5+ yrs)</option>
                                        <option value="Lead / Management">Lead / Management (8+ yrs)</option>
                                    </select>
                                </div>

                                {/* Skills Summary pill */}
                                <div className="p-3 rounded-xl bg-surface-container-high/60 border border-white/5 space-y-1">
                                    <div className="flex justify-between text-[11px]">
                                        <span className="text-slate-400">Technical Skills:</span>
                                        <span className="text-white font-bold">{technicalSkills.length}</span>
                                    </div>
                                    <div className="flex justify-between text-[11px]">
                                        <span className="text-slate-400">Personality Skills:</span>
                                        <span className="text-emerald-400 font-bold">{softSkills.length}</span>
                                    </div>
                                    <div className="flex justify-between text-[11px] pt-1 border-t border-white/5 font-semibold">
                                        <span className="text-slate-300">Total Skills:</span>
                                        <span className="text-primary font-bold">{technicalSkills.length + softSkills.length}</span>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full bg-primary-container hover:bg-primary-container/90 text-white text-xs font-bold py-3 rounded-xl transition-all shadow-md shadow-indigo-500/25 mt-2"
                                >
                                    Save Profile & Skillsets
                                </button>
                            </form>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
