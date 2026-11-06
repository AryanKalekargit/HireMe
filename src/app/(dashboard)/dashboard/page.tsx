'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { useSession, getInitials } from '@/lib/session-context';
import Link from 'next/link';

interface AnalysisItem {
    _id: string;
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
    url?: string;
    source?: 'linkedin' | 'direct';
    createdAt: string;
}

function getScoreVisuals(score: number) {
    if (score >= 85) {
        return {
            textColor: 'text-emerald-400',
            bgColor: 'bg-emerald-500/10',
            borderColor: 'border-emerald-500/30',
            tagline: 'Elite Compatibility · High Interview Probability',
        };
    }
    if (score >= 70) {
        return {
            textColor: 'text-teal-400',
            bgColor: 'bg-teal-500/10',
            borderColor: 'border-teal-500/30',
            tagline: 'Competitive Alignment · Strong Core Skills',
        };
    }
    if (score >= 50) {
        return {
            textColor: 'text-amber-400',
            bgColor: 'bg-amber-500/10',
            borderColor: 'border-amber-500/30',
            tagline: 'Moderate Match · Targeted Skill Gaps to Bridge',
        };
    }
    if (score > 0) {
        return {
            textColor: 'text-rose-400',
            bgColor: 'bg-rose-500/10',
            borderColor: 'border-rose-500/30',
            tagline: 'Developing Alignment · Upskilling Advised Before Applying',
        };
    }
    return {
        textColor: 'text-slate-400',
        bgColor: 'bg-slate-500/10',
        borderColor: 'border-white/10',
        tagline: 'Pending Matches · Run Evaluation to Activate Insights',
    };
}

export default function DashboardPage() {
    const { user } = useSession();
    const [profile, setProfile] = useState<{ name?: string; email?: string; targetRole?: string } | null>(null);
    const [jobTitle, setJobTitle] = useState('');
    const [company, setCompany] = useState('');
    const [jobUrl, setJobUrl] = useState('');
    const [description, setDescription] = useState('');
    const [useCustomResume, setUseCustomResume] = useState(false);
    const [customResumeText, setCustomResumeText] = useState('');
    const [analyzing, setAnalyzing] = useState(false);
    const [latestAnalysis, setLatestAnalysis] = useState<AnalysisItem | null>(null);
    const [autoSavedNotice, setAutoSavedNotice] = useState(false);
    const [recentList, setRecentList] = useState<AnalysisItem[]>([]);
    const [stats, setStats] = useState({
        totalAnalyzed: 0,
        avgHireScore: 0,
        savedJobsCount: 0,
        appliedJobsCount: 0,
        resumeUploaded: false,
        skillsCount: 0,
    });

    useEffect(() => {
        fetchStats();
        fetchProfileData();
    }, []);

    const fetchProfileData = async () => {
        try {
            const res = await fetch('/api/profile');
            const data = await res.json();
            if (data.success && data.profile) {
                setProfile(data.profile);
            }
        } catch {}
    };

    const fetchStats = async () => {
        try {
            const res = await fetch('/api/dashboard/stats');
            const data = await res.json();
            if (data.success) {
                setStats({
                    totalAnalyzed: data.stats.totalAnalyzed || 0,
                    avgHireScore: data.stats.avgHireScore || 0,
                    savedJobsCount: data.stats.savedJobsCount || 0,
                    appliedJobsCount: data.stats.appliedJobsCount || 0,
                    resumeUploaded: Boolean(data.stats.resumeStatus?.uploaded),
                    skillsCount: data.stats.resumeStatus?.skillsCount || 0,
                });
                if (data.stats.recentAnalyses) {
                    setRecentList(data.stats.recentAnalyses);
                }
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleAnalyze = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!description) return;
        setAnalyzing(true);
        setAutoSavedNotice(false);

        try {
            const res = await fetch('/api/analyze-job', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: jobTitle || 'Full Stack Engineer',
                    company: company || 'Tech Company',
                    url: jobUrl.trim(),
                    description,
                    resumeText: useCustomResume && customResumeText.trim() ? customResumeText.trim() : undefined,
                    source: jobUrl.includes('linkedin.com') ? 'linkedin' : 'direct',
                }),
            });
            const data = await res.json();
            if (data.success) {
                setLatestAnalysis(data.analysis);
                setAutoSavedNotice(true);
                fetchStats();
            }
        } catch (err) {
            console.error(err);
        } finally {
            setAnalyzing(false);
        }
    };

    const resolvedName = profile?.name || user?.name || '';
    const displayName = resolvedName || 'Active Candidate';
    const displayEmail = profile?.email || user?.email || '';
    const displayUsername = displayEmail ? displayEmail.split('@')[0] : (resolvedName ? resolvedName.toLowerCase().replace(/\s+/g, '') : 'candidate');
    const initials = resolvedName ? getInitials(resolvedName) : (user ? getInitials(user.name) : '??');

    return (
        <div className="flex min-h-screen bg-background text-on-surface font-sans">
            <Sidebar />

            <div className="flex-1 flex flex-col min-w-0">
                <Header title="Dashboard Overview" />

                <main className="p-6 space-y-6 max-w-7xl mx-auto w-full">
                    {/* Welcome & Profile Identity Banner */}
                    <div className="glass-panel rounded-2xl p-6 border border-white/10 relative overflow-hidden bg-gradient-to-r from-indigo-950/70 via-slate-900 to-surface-container">
                        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="flex items-start sm:items-center gap-4">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 to-emerald-400 p-0.5 shadow-xl shrink-0">
                                    {user?.imageUrl ? (
                                        <img
                                            src={user.imageUrl}
                                            alt={displayName}
                                            className="w-full h-full rounded-2xl object-cover"
                                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                        />
                                    ) : (
                                        <div className="w-full h-full rounded-2xl bg-surface-container flex items-center justify-center text-xl font-bold text-white">
                                            {initials}
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                        <h1 className="text-2xl font-extrabold text-white tracking-tight">
                                            {displayName}
                                        </h1>
                                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary-container/30 text-primary border border-primary-container/40">
                                            @{displayUsername}
                                        </span>
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-secondary/10 border border-secondary/20 text-secondary text-[11px] font-semibold">
                                            <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
                                            {stats.resumeUploaded ? `${stats.skillsCount} Skills Synced` : 'Profile Active'}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-300">
                                        Account: <span className="text-white font-medium">{displayEmail || 'Authenticated'}</span> • Target Role: <span className="text-emerald-400 font-medium">{profile?.targetRole || 'Full Stack Engineer'}</span>
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                                <Link
                                    href="/profile"
                                    className="bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-4 py-2.5 rounded-xl border border-white/10 transition-colors flex items-center gap-1.5"
                                >
                                    <span className="material-symbols-outlined text-sm">upload_file</span>
                                    {stats.resumeUploaded ? `Update Resume (${stats.skillsCount} skills)` : 'Upload Resume'}
                                </Link>
                                <Link
                                    href="/tracker"
                                    className="bg-primary-container hover:bg-primary-container/90 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-indigo-500/20 flex items-center gap-1.5"
                                >
                                    <span className="material-symbols-outlined text-sm">table_chart</span>
                                    View Tracker
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Key Metrics Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                        <div className="glass-card rounded-2xl p-5 border border-white/5 flex items-center justify-between">
                            <div>
                                <span className="text-xs font-medium text-slate-400 block mb-1">Jobs Evaluated</span>
                                <span className="text-2xl font-extrabold text-white">{stats.totalAnalyzed}</span>
                                <span className="text-[10px] text-emerald-400 font-semibold block mt-1">
                                    {stats.totalAnalyzed > 0 ? `${stats.totalAnalyzed} total matches run` : 'No analyses yet'}
                                </span>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-primary">
                                <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                                    find_in_page
                                </span>
                            </div>
                        </div>

                        {(() => {
                            const scoreStyle = getScoreVisuals(stats.avgHireScore);
                            return (
                                <div className="glass-card rounded-2xl p-5 border border-white/5 flex items-center justify-between">
                                    <div>
                                        <span className="text-xs font-medium text-slate-400 block mb-1">Avg Hire Score</span>
                                        <span className={`text-2xl font-extrabold ${scoreStyle.textColor}`}>
                                            {stats.avgHireScore > 0 ? `${stats.avgHireScore}%` : '--'}
                                        </span>
                                        <span className={`text-[10px] font-semibold block mt-1 ${scoreStyle.textColor}`}>
                                            {scoreStyle.tagline}
                                        </span>
                                    </div>
                                    <div className={`w-12 h-12 rounded-xl ${scoreStyle.bgColor} border ${scoreStyle.borderColor} flex items-center justify-center ${scoreStyle.textColor}`}>
                                        <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                                            speed
                                        </span>
                                    </div>
                                </div>
                            );
                        })()}

                        <div className="glass-card rounded-2xl p-5 border border-white/5 flex items-center justify-between">
                            <div>
                                <span className="text-xs font-medium text-slate-400 block mb-1">Matched in Tracker</span>
                                <span className="text-2xl font-extrabold text-white">{stats.savedJobsCount}</span>
                                <span className="text-[10px] text-slate-400 block mt-1">Auto-saved for application</span>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                                <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                                    bookmark
                                </span>
                            </div>
                        </div>

                        <div className="glass-card rounded-2xl p-5 border border-white/5 flex items-center justify-between">
                            <div>
                                <span className="text-xs font-medium text-slate-400 block mb-1">Active In Pipeline</span>
                                <span className="text-2xl font-extrabold text-purple-400">{stats.appliedJobsCount}</span>
                                <span className="text-[10px] text-purple-300 block mt-1">Applied / Interviewing</span>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                                <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                                    send
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Quick Job Match Analyzer Section */}
                    <div id="quick-analyze" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 glass-card rounded-2xl p-6 border border-white/10">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="material-symbols-outlined text-primary text-xl">auto_awesome</span>
                                <h3 className="font-bold text-lg text-white">Instant Job Match Analyzer</h3>
                            </div>
                            <p className="text-xs text-slate-400 mb-5">
                                Paste job requirements below. Every analyzed job is automatically saved into your Opportunity Tracker under the <span className="text-secondary font-semibold">&quot;Matched&quot;</span> stage.
                            </p>

                            <form onSubmit={handleAnalyze} className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <input
                                        type="text"
                                        placeholder="Job Title (e.g. Senior Frontend Developer)"
                                        value={jobTitle}
                                        onChange={(e) => setJobTitle(e.target.value)}
                                        className="w-full bg-surface-container-high border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary-container"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Company Name (e.g. Stripe, Google)"
                                        value={company}
                                        onChange={(e) => setCompany(e.target.value)}
                                        className="w-full bg-surface-container-high border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary-container"
                                    />
                                </div>

                                <input
                                    type="url"
                                    placeholder="Job Posting URL (Optional, e.g. https://www.linkedin.com/jobs/view/...)"
                                    value={jobUrl}
                                    onChange={(e) => setJobUrl(e.target.value)}
                                    className="w-full bg-surface-container-high border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary-container"
                                />

                                <div>
                                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                                        Job Description (JD) Requirements *
                                    </label>
                                    <textarea
                                        rows={4}
                                        placeholder="Paste full job description requirements here..."
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        className="w-full bg-surface-container-high border border-white/10 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary-container resize-none"
                                        required
                                    />
                                </div>

                                {/* Resume Source Switcher */}
                                <div className="p-3 rounded-xl bg-surface-container-high/60 border border-white/5 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] font-semibold text-slate-300">Resume for Compatibility Evaluation:</span>
                                        <div className="flex items-center gap-1 bg-surface-container-low p-0.5 rounded-lg border border-white/5 text-[10px]">
                                            <button
                                                type="button"
                                                onClick={() => setUseCustomResume(false)}
                                                className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                                                    !useCustomResume
                                                        ? 'bg-primary-container text-white shadow-sm'
                                                        : 'text-slate-400 hover:text-white'
                                                }`}
                                            >
                                                Active Profile Resume
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setUseCustomResume(true)}
                                                className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                                                    useCustomResume
                                                        ? 'bg-primary-container text-white shadow-sm'
                                                        : 'text-slate-400 hover:text-white'
                                                }`}
                                            >
                                                Paste Custom Resume
                                            </button>
                                        </div>
                                    </div>

                                    {!useCustomResume ? (
                                        <p className="text-[11px] text-slate-400">
                                            ✓ Evaluating against your profile&apos;s primary resume ({stats.skillsCount || 'detected'} skills in memory).
                                        </p>
                                    ) : (
                                        <textarea
                                            rows={3}
                                            placeholder="Paste custom resume text or skills to evaluate against this specific JD..."
                                            value={customResumeText}
                                            onChange={(e) => setCustomResumeText(e.target.value)}
                                            className="w-full bg-surface-container border border-white/10 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary-container"
                                        />
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    disabled={analyzing}
                                    className="w-full bg-primary-container hover:bg-primary-container/90 text-white text-xs font-bold py-3 rounded-xl transition-all shadow-md shadow-indigo-500/25 flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {analyzing ? (
                                        <>
                                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            Analyzing Resume vs Job Description...
                                        </>
                                    ) : (
                                        <>
                                            <span className="material-symbols-outlined text-sm">bolt</span>
                                            Analyze & Auto-Save to Opportunity Tracker
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>

                        {/* Analysis Output Result Card */}
                        <div className="glass-card rounded-2xl p-6 border border-white/10 flex flex-col justify-between">
                            <div>
                                <h4 className="font-bold text-sm text-white mb-4 flex items-center justify-between">
                                    <span>Match Analysis Output</span>
                                    {latestAnalysis && (
                                        <span className="text-[10px] bg-secondary/10 border border-secondary/20 text-secondary px-2 py-0.5 rounded-full font-semibold">
                                            Calculated Live
                                        </span>
                                    )}
                                </h4>

                                {autoSavedNotice && (
                                    <div className="p-3 mb-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center gap-2">
                                        <span className="material-symbols-outlined text-sm">bookmark_added</span>
                                        Auto-saved in Opportunity Tracker as &quot;Matched&quot;!
                                    </div>
                                )}

                                {latestAnalysis ? (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-4 bg-surface-container p-3.5 rounded-xl border border-white/5">
                                            <div className="w-14 h-14 rounded-full bg-indigo-500/20 border-2 border-indigo-500 flex items-center justify-center text-primary font-extrabold text-xl shrink-0">
                                                {latestAnalysis.hireScore}%
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="font-bold text-sm text-white truncate">{latestAnalysis.jobTitle}</div>
                                                <div className="text-xs text-slate-400 truncate">{latestAnalysis.company}</div>
                                                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                                    <span className={`text-[10px] px-2 py-0.2 rounded-full font-bold border ${
                                                        latestAnalysis.employmentType === 'Internship'
                                                            ? 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                                                            : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                                    }`}>
                                                        {latestAnalysis.employmentType || 'Job'}
                                                    </span>
                                                    <span className="text-[10px] text-amber-300 font-semibold bg-amber-500/10 border border-amber-500/20 px-2 py-0.2 rounded-full">
                                                        {latestAnalysis.compensationType || (latestAnalysis.employmentType === 'Internship' ? 'Stipend' : 'CTC')} : {latestAnalysis.compensation || 'Not Disclosed'}
                                                    </span>
                                                </div>
                                                {latestAnalysis.url && (
                                                    <a
                                                        href={latestAnalysis.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-[10px] text-primary hover:underline flex items-center gap-1 mt-0.5"
                                                    >
                                                        <span>Open Job Link</span>
                                                        <span className="material-symbols-outlined text-[10px]">open_in_new</span>
                                                    </a>
                                                )}
                                            </div>
                                        </div>

                                        {/* Recruiter / Company Contact Info & Experience Notice */}
                                        <div className="p-3 rounded-xl bg-surface-container-high/60 border border-white/5 space-y-2">
                                            <div className="text-xs">
                                                {latestAnalysis.contactPhone ? (
                                                    <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                                                        <span className="material-symbols-outlined text-xs">call</span>
                                                        <span>Contact : <a href={`tel:${latestAnalysis.contactPhone.replace(/\s+/g, '')}`} className="hover:underline">{latestAnalysis.contactPhone}</a></span>
                                                    </div>
                                                ) : null}
                                                {latestAnalysis.contactEmail ? (
                                                    <div className="flex items-center gap-1.5 text-sky-400 font-semibold mt-1">
                                                        <span className="material-symbols-outlined text-xs">mail</span>
                                                        <span>Contact : <a href={`mailto:${latestAnalysis.contactEmail}`} className="hover:underline">{latestAnalysis.contactEmail}</a></span>
                                                    </div>
                                                ) : null}
                                                {!latestAnalysis.contactPhone && !latestAnalysis.contactEmail && (
                                                    <div className="text-slate-400 flex items-center gap-1.5">
                                                        <span className="material-symbols-outlined text-xs">contact_support</span>
                                                        <span>Contact : <span className="font-medium text-slate-300">None</span></span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Experience Requirement / Fresher Alert */}
                                            {(latestAnalysis.experienceMatchStatus === 'MISMATCH' || (latestAnalysis.experienceMatchMessage && latestAnalysis.experienceMatchMessage.includes('Warning'))) ? (
                                                <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-semibold flex items-center gap-1.5">
                                                    <span className="material-symbols-outlined text-xs shrink-0">warning</span>
                                                    <span>{latestAnalysis.experienceMatchMessage || `Role requires ${latestAnalysis.requiredExperience || 'higher experience'}. Candidate is Entry Level / Fresher.`}</span>
                                                </div>
                                            ) : latestAnalysis.requiredExperience ? (
                                                <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-medium flex items-center gap-1.5">
                                                    <span className="material-symbols-outlined text-xs shrink-0">verified</span>
                                                    <span>Experience Valid: {latestAnalysis.requiredExperience}</span>
                                                </div>
                                            ) : null}
                                        </div>

                                        {/* Dual Sub-scores Breakdown */}
                                        {(latestAnalysis.technicalScore !== undefined || latestAnalysis.softScore !== undefined) && (
                                            <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-surface-container-high/60 border border-white/5 text-center">
                                                <div>
                                                    <span className="text-[10px] text-slate-400 block">Technical Fit</span>
                                                    <span className="text-sm font-bold text-white">{latestAnalysis.technicalScore ?? '--'}%</span>
                                                </div>
                                                <div>
                                                    <span className="text-[10px] text-slate-400 block">Personality / Soft Fit</span>
                                                    <span className="text-sm font-bold text-emerald-400">{latestAnalysis.softScore ?? '--'}%</span>
                                                </div>
                                            </div>
                                        )}

                                        {/* Matched Skills */}
                                        <div>
                                            <span className="text-[11px] font-semibold text-secondary uppercase block mb-1.5">
                                                Matched Skills ({latestAnalysis.matchedSkills.length})
                                            </span>
                                            <div className="flex flex-wrap gap-1.5">
                                                {latestAnalysis.matchedTechnicalSkills && latestAnalysis.matchedTechnicalSkills.length > 0 ? (
                                                    latestAnalysis.matchedTechnicalSkills.slice(0, 8).map((s) => (
                                                        <span key={s} className="px-2 py-0.5 rounded bg-secondary/10 text-secondary text-[11px] font-medium border border-secondary/20">
                                                            ✓ {s}
                                                        </span>
                                                    ))
                                                ) : (
                                                    latestAnalysis.matchedSkills.slice(0, 8).map((s) => (
                                                        <span key={s} className="px-2 py-0.5 rounded bg-secondary/10 text-secondary text-[11px] font-medium border border-secondary/20">
                                                            ✓ {s}
                                                        </span>
                                                    ))
                                                )}
                                                {latestAnalysis.matchedSoftSkills && latestAnalysis.matchedSoftSkills.slice(0, 4).map((s) => (
                                                    <span key={`soft-${s}`} className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[11px] font-medium border border-emerald-500/20">
                                                        ✓ {s}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Missing Skills */}
                                        {latestAnalysis.missingSkills.length > 0 && (
                                            <div>
                                                <span className="text-[11px] font-semibold text-red-400 uppercase block mb-1.5">
                                                    Missing Skills ({latestAnalysis.missingSkills.length})
                                                </span>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {latestAnalysis.missingTechnicalSkills && latestAnalysis.missingTechnicalSkills.length > 0 ? (
                                                        latestAnalysis.missingTechnicalSkills.slice(0, 6).map((s) => (
                                                            <span key={s} className="px-2 py-0.5 rounded bg-red-500/10 text-red-400 text-[11px] font-medium border border-red-500/20">
                                                                ! {s}
                                                            </span>
                                                        ))
                                                    ) : (
                                                        latestAnalysis.missingSkills.slice(0, 6).map((s) => (
                                                            <span key={s} className="px-2 py-0.5 rounded bg-red-500/10 text-red-400 text-[11px] font-medium border border-red-500/20">
                                                                ! {s}
                                                            </span>
                                                        ))
                                                    )}
                                                    {latestAnalysis.missingSoftSkills && latestAnalysis.missingSoftSkills.slice(0, 3).map((s) => (
                                                        <span key={`miss-soft-${s}`} className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 text-[11px] font-medium border border-rose-500/20">
                                                            ! {s} (Soft Skill)
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-center py-10 space-y-3">
                                        <div className="w-12 h-12 rounded-full bg-surface-container-high mx-auto flex items-center justify-center text-slate-400">
                                            <span className="material-symbols-outlined text-2xl">analytics</span>
                                        </div>
                                        <p className="text-xs text-slate-400">
                                            Paste job requirements on the left to see your instant match score, missing skills, and auto-save the job to your tracker.
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="mt-4 pt-4 border-t border-white/5">
                                <Link
                                    href="/tracker"
                                    className="w-full inline-flex items-center justify-center gap-1.5 bg-secondary-container/20 hover:bg-secondary-container/30 text-secondary border border-secondary/30 text-xs font-semibold py-2.5 rounded-xl transition-colors"
                                >
                                    <span className="material-symbols-outlined text-sm">table_chart</span>
                                    Go to Opportunity Tracker →
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Recent Analyses Table */}
                    <div className="glass-card rounded-2xl p-6 border border-white/5">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-base text-white">Recent Analyses</h3>
                            <Link href="/tracker" className="text-xs text-primary font-semibold hover:underline">
                                View In Tracker →
                            </Link>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs text-slate-300">
                                <thead className="bg-surface-container-high text-slate-400 uppercase font-semibold text-[10px] border-b border-white/5">
                                    <tr>
                                        <th className="p-3">Job Title & Company</th>
                                        <th className="p-3">Source</th>
                                        <th className="p-3">Hire Score</th>
                                        <th className="p-3">Matched Skills</th>
                                        <th className="p-3">Missing Skills</th>
                                        <th className="p-3 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {recentList.length > 0 ? (
                                        recentList.slice(0, 8).map((item) => (
                                            <tr key={item._id} className="hover:bg-white/5 transition-colors">
                                                <td className="p-3">
                                                    <div className="font-bold text-white text-sm">{item.jobTitle}</div>
                                                    <div className="text-[11px] text-slate-400">{item.company}</div>
                                                </td>
                                                <td className="p-3">
                                                    {item.source === 'linkedin' || (item.url && item.url.includes('linkedin.com')) ? (
                                                        <span className="px-2 py-0.5 rounded-md bg-sky-500/10 text-sky-400 border border-sky-500/30 text-[10px] font-semibold inline-flex items-center gap-1">
                                                            LinkedIn
                                                        </span>
                                                    ) : (
                                                        <span className="px-2 py-0.5 rounded-md bg-white/5 text-slate-400 border border-white/10 text-[10px] font-semibold">
                                                            Direct JD
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="p-3">
                                                    <span
                                                        className={`px-2.5 py-1 rounded-full text-xs font-bold ${item.hireScore >= 80
                                                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                                                : item.hireScore >= 60
                                                                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                                                    : 'bg-red-500/10 text-red-400 border border-red-500/20'
                                                            }`}
                                                    >
                                                        {item.hireScore}% Match
                                                    </span>
                                                </td>
                                                <td className="p-3">
                                                    <span className="text-slate-300">{item.matchedSkills.slice(0, 3).join(', ') || '—'}</span>
                                                </td>
                                                <td className="p-3 text-red-400">{item.missingSkills.slice(0, 2).join(', ') || 'None'}</td>
                                                <td className="p-3 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {item.url && (
                                                            <a
                                                                href={item.url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-xs text-sky-400 hover:underline inline-flex items-center gap-1"
                                                            >
                                                                <span>Link</span>
                                                                <span className="material-symbols-outlined text-[10px]">open_in_new</span>
                                                            </a>
                                                        )}
                                                        <Link
                                                            href="/tracker"
                                                            className="text-xs text-primary font-semibold hover:underline"
                                                        >
                                                            Tracker →
                                                        </Link>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={6} className="p-6 text-center text-slate-500">
                                                No recent job analyses yet. Run an analysis above or use the Chrome Extension!
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
