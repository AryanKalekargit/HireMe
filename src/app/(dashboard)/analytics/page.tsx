'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import Link from 'next/link';

interface JobAnalysisItem {
    _id: string;
    jobTitle: string;
    company: string;
    hireScore: number;
    url?: string;
    source?: 'linkedin' | 'direct';
    matchedSkills: string[];
    missingSkills: string[];
    createdAt?: string;
}

function getScoreVisuals(score: number) {
    if (score >= 85) {
        return {
            textColor: 'text-emerald-400',
            bgColor: 'bg-emerald-500/10',
            borderColor: 'border-emerald-500/30',
            progressGradient: 'from-emerald-500 to-teal-400',
            tagline: 'Elite Compatibility',
        };
    }
    if (score >= 70) {
        return {
            textColor: 'text-teal-400',
            bgColor: 'bg-teal-500/10',
            borderColor: 'border-teal-500/30',
            progressGradient: 'from-teal-500 to-cyan-400',
            tagline: 'High Alignment',
        };
    }
    if (score >= 50) {
        return {
            textColor: 'text-amber-400',
            bgColor: 'bg-amber-500/10',
            borderColor: 'border-amber-500/30',
            progressGradient: 'from-amber-500 to-yellow-400',
            tagline: 'Moderate Match',
        };
    }
    if (score > 0) {
        return {
            textColor: 'text-rose-400',
            bgColor: 'bg-rose-500/10',
            borderColor: 'border-rose-500/30',
            progressGradient: 'from-rose-500 to-pink-500',
            tagline: 'Skill Gaps Present',
        };
    }
    return {
        textColor: 'text-slate-400',
        bgColor: 'bg-slate-500/10',
        borderColor: 'border-white/10',
        progressGradient: 'from-slate-600 to-slate-500',
        tagline: 'Pending Evaluations',
    };
}

export default function AnalyticsPage() {
    const [timeframe, setTimeframe] = useState<'7D' | '30D' | '90D'>('30D');
    const [stats, setStats] = useState({
        totalAnalyzed: 0,
        avgHireScore: 0,
        savedJobsCount: 0,
        appliedJobsCount: 0,
        interviewingCount: 0,
        highMatchCount: 0,
        linkedinAnalyzedCount: 0,
        directAnalyzedCount: 0,
        linkedinAvgScore: 0,
        directAvgScore: 0,
        linkedinAnalyses: [] as JobAnalysisItem[],
        directAnalyses: [] as JobAnalysisItem[],
        missingSkills: [] as Array<{ name: string; count: number; pct: number }>,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const res = await fetch('/api/dashboard/stats');
                const data = await res.json();
                if (data.success && data.stats) {
                    const st = data.stats;
                    const maxCount = Math.max(...(st.missingSkillsFreq || []).map((s: any) => s.count), 1);
                    setStats({
                        totalAnalyzed: st.totalAnalyzed || 0,
                        avgHireScore: st.avgHireScore || 0,
                        savedJobsCount: st.savedJobsCount || 0,
                        appliedJobsCount: st.appliedJobsCount || 0,
                        interviewingCount: st.interviewingCount || 0,
                        highMatchCount: st.highMatchCount || 0,
                        linkedinAnalyzedCount: st.linkedinAnalyzedCount || 0,
                        directAnalyzedCount: st.directAnalyzedCount || 0,
                        linkedinAvgScore: st.linkedinAvgScore || 0,
                        directAvgScore: st.directAvgScore || 0,
                        linkedinAnalyses: st.linkedinAnalyses || [],
                        directAnalyses: st.directAnalyses || [],
                        missingSkills: (st.missingSkillsFreq || []).map((s: any) => ({
                            name: s.name,
                            count: s.count,
                            pct: Math.round((s.count / maxCount) * 100),
                        })),
                    });
                }
            } catch (e) {
                console.error('Analytics load error:', e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const interviewRate = stats.appliedJobsCount > 0
        ? Math.round((stats.interviewingCount / stats.appliedJobsCount) * 100)
        : 0;

    return (
        <div className="flex min-h-screen bg-background text-on-surface font-sans">
            <Sidebar />

            <div className="flex-1 flex flex-col min-w-0">
                <Header title="Analytics & Pipeline Insights" />

                <main className="p-6 space-y-6 max-w-7xl mx-auto w-full">
                    {/* Top Controls Banner */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 glass-card p-5 rounded-2xl border border-white/5">
                        <div>
                            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-primary text-[11px] font-semibold mb-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                                Comprehensive Performance Metrics
                            </div>
                            <h2 className="text-xl font-extrabold text-white tracking-tight">Application & Evaluation Analytics</h2>
                            <p className="text-xs text-slate-400 mt-0.5">
                                Visual breakdown of jobs evaluated via LinkedIn vs. direct JD pastes, interview ratios, and skill gaps.
                            </p>
                        </div>

                        <div className="flex items-center bg-surface-container-high rounded-xl p-1 border border-white/5 shrink-0">
                            {(['7D', '30D', '90D'] as const).map((t) => (
                                <button
                                    key={t}
                                    onClick={() => setTimeframe(t)}
                                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${timeframe === t
                                            ? 'bg-primary-container text-white shadow-sm'
                                            : 'text-slate-400 hover:text-white'
                                        }`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* OVERHAULED KPI METRIC CARDS */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Total Evaluated */}
                        <div className="glass-card rounded-2xl p-5 border border-white/5 relative overflow-hidden group hover:border-white/10 transition-all">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Evaluated</span>
                                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-primary">
                                    <span className="material-symbols-outlined text-lg">insights</span>
                                </div>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-extrabold text-white tracking-tight">{stats.totalAnalyzed}</span>
                                <span className="text-xs text-emerald-400 font-semibold">{stats.highMatchCount} high match</span>
                            </div>
                            <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-400">
                                <span className="text-sky-400 font-bold">{stats.linkedinAnalyzedCount} LinkedIn</span>
                                <span>•</span>
                                <span className="text-slate-300 font-bold">{stats.directAnalyzedCount} Direct</span>
                            </div>
                        </div>

                        {/* Average Match */}
                        {(() => {
                            const scoreStyle = getScoreVisuals(stats.avgHireScore);
                            return (
                                <div className="glass-card rounded-2xl p-5 border border-white/5 relative overflow-hidden group hover:border-white/10 transition-all">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Average Hire Score</span>
                                        <div className={`w-8 h-8 rounded-lg ${scoreStyle.bgColor} border ${scoreStyle.borderColor} flex items-center justify-center ${scoreStyle.textColor}`}>
                                            <span className="material-symbols-outlined text-lg">speed</span>
                                        </div>
                                    </div>
                                    <div className="flex items-baseline gap-2">
                                        <span className={`text-3xl font-extrabold tracking-tight ${scoreStyle.textColor}`}>
                                            {stats.avgHireScore > 0 ? `${stats.avgHireScore}%` : '--'}
                                        </span>
                                        <span className={`text-[10px] font-semibold ${scoreStyle.textColor}`}>{scoreStyle.tagline}</span>
                                    </div>
                                    <div className="w-full bg-white/5 rounded-full h-1.5 mt-3 overflow-hidden">
                                        <div
                                            className={`bg-gradient-to-r ${scoreStyle.progressGradient} h-full rounded-full transition-all duration-700`}
                                            style={{ width: `${stats.avgHireScore || 0}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })()}

                        {/* Saved for Review - OVERHAULED */}
                        <div className="glass-card rounded-2xl p-5 border border-white/5 relative overflow-hidden group hover:border-white/10 transition-all">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Saved For Review</span>
                                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                                    <span className="material-symbols-outlined text-lg">bookmark</span>
                                </div>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-extrabold text-white tracking-tight">{stats.savedJobsCount}</span>
                                <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-semibold">
                                    In Tracker
                                </span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-3">
                                Automatically queued for application & tracking
                            </p>
                        </div>

                        {/* Interview Rate - OVERHAULED */}
                        <div className="glass-card rounded-2xl p-5 border border-white/5 relative overflow-hidden group hover:border-white/10 transition-all">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Interview Conversion</span>
                                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                                    <span className="material-symbols-outlined text-lg">forum</span>
                                </div>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-extrabold text-amber-400 tracking-tight">{interviewRate}%</span>
                                <span className="text-xs text-slate-400">({stats.interviewingCount} active)</span>
                            </div>
                            <div className="w-full bg-white/5 rounded-full h-1.5 mt-3 overflow-hidden">
                                <div
                                    className="bg-gradient-to-r from-amber-500 to-orange-400 h-full rounded-full transition-all duration-700"
                                    style={{ width: `${Math.min(100, Math.max(8, interviewRate))}%` }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* SEPARATE EVALUATION CARDS: LINKEDIN VS DIRECT JD */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* 1. LINKEDIN EVALUATED JOBS CARD */}
                        <div className="glass-card rounded-2xl p-6 border border-sky-500/20 relative space-y-4 bg-gradient-to-br from-sky-950/20 via-surface-container to-surface-container-low">
                            <div className="flex items-center justify-between pb-3 border-b border-white/5">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-lg bg-[#0077b5]/20 border border-[#0077b5]/30 flex items-center justify-center text-[#38bdf8] font-bold text-sm">
                                        in
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-base text-white flex items-center gap-2">
                                            <span>LinkedIn Evaluated Jobs</span>
                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-400 font-bold border border-sky-500/30">
                                                {stats.linkedinAnalyzedCount} Total
                                            </span>
                                        </h3>
                                        <span className="text-[11px] text-slate-400">Captured live via Chrome Extension or LinkedIn links</span>
                                    </div>
                                </div>

                                <div className="text-right">
                                    <span className="text-[10px] text-slate-400 block">Avg LinkedIn Score</span>
                                    <span className="text-base font-extrabold text-sky-400">
                                        {stats.linkedinAvgScore > 0 ? `${stats.linkedinAvgScore}%` : '—'}
                                    </span>
                                </div>
                            </div>

                            {/* Job list */}
                            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                                {stats.linkedinAnalyses.length > 0 ? (
                                    stats.linkedinAnalyses.map((job) => (
                                        <div
                                            key={job._id}
                                            className="p-3.5 rounded-xl bg-surface-container border border-white/5 hover:border-sky-500/30 transition-all flex items-center justify-between gap-3 group"
                                        >
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-xs text-white truncate group-hover:text-sky-300 transition-colors">
                                                        {job.jobTitle}
                                                    </span>
                                                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-sky-500/10 text-sky-400 font-semibold border border-sky-500/20 shrink-0">
                                                        LinkedIn
                                                    </span>
                                                </div>
                                                <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                                                    🏢 {job.company}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3 shrink-0">
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${
                                                    job.hireScore >= 80
                                                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                                }`}>
                                                    {job.hireScore}%
                                                </span>

                                                {job.url ? (
                                                    <a
                                                        href={job.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="px-2.5 py-1 rounded-lg bg-[#0077b5]/15 hover:bg-[#0077b5]/30 text-sky-400 hover:text-white border border-[#0077b5]/30 text-xs font-semibold flex items-center gap-1 transition-colors"
                                                    >
                                                        <span>View Job</span>
                                                        <span className="material-symbols-outlined text-xs">open_in_new</span>
                                                    </a>
                                                ) : (
                                                    <span className="text-slate-500 text-xs">—</span>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-10 space-y-2">
                                        <div className="w-10 h-10 rounded-full bg-white/5 mx-auto flex items-center justify-center text-slate-400">
                                            <span className="material-symbols-outlined text-xl">open_in_browser</span>
                                        </div>
                                        <p className="text-xs text-slate-400">
                                            No LinkedIn jobs evaluated yet. Open any LinkedIn job and click the HireMe badge to analyze!
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 2. DIRECT JD MATCHED JOBS CARD */}
                        <div className="glass-card rounded-2xl p-6 border border-indigo-500/20 relative space-y-4 bg-gradient-to-br from-indigo-950/20 via-surface-container to-surface-container-low">
                            <div className="flex items-center justify-between pb-3 border-b border-white/5">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-primary font-bold text-sm">
                                        <span className="material-symbols-outlined text-base">description</span>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-base text-white flex items-center gap-2">
                                            <span>Direct JD Matched Jobs</span>
                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary-container/20 text-primary font-bold border border-primary-container/30">
                                                {stats.directAnalyzedCount} Total
                                            </span>
                                        </h3>
                                        <span className="text-[11px] text-slate-400">Analyzed directly via Dashboard Job Matcher</span>
                                    </div>
                                </div>

                                <div className="text-right">
                                    <span className="text-[10px] text-slate-400 block">Avg Match Score</span>
                                    <span className="text-base font-extrabold text-primary">
                                        {stats.directAvgScore > 0 ? `${stats.directAvgScore}%` : '—'}
                                    </span>
                                </div>
                            </div>

                            {/* Job list */}
                            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                                {stats.directAnalyses.length > 0 ? (
                                    stats.directAnalyses.map((job) => (
                                        <div
                                            key={job._id}
                                            className="p-3.5 rounded-xl bg-surface-container border border-white/5 hover:border-indigo-500/30 transition-all flex items-center justify-between gap-3 group"
                                        >
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-xs text-white truncate group-hover:text-primary transition-colors">
                                                        {job.jobTitle}
                                                    </span>
                                                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/5 text-slate-400 font-semibold border border-white/10 shrink-0">
                                                        Direct JD
                                                    </span>
                                                </div>
                                                <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                                                    🏢 {job.company}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3 shrink-0">
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${
                                                    job.hireScore >= 80
                                                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                        : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                                                }`}>
                                                    {job.hireScore}%
                                                </span>

                                                <Link
                                                    href="/tracker"
                                                    className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-semibold transition-colors"
                                                >
                                                    Tracker
                                                </Link>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-10 space-y-2">
                                        <div className="w-10 h-10 rounded-full bg-white/5 mx-auto flex items-center justify-center text-slate-400">
                                            <span className="material-symbols-outlined text-xl">post_add</span>
                                        </div>
                                        <p className="text-xs text-slate-400">
                                            No direct JD analyses yet. Use the Quick Analyzer on the Dashboard to test any job description!
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* REFINED PIPELINE PROGRESSION & SKILL GAPS */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Application Stage Breakdown - MINIMAL & AESTHETIC */}
                        <div className="lg:col-span-2 glass-card rounded-2xl p-6 border border-white/5 space-y-5 bg-gradient-to-b from-surface-container to-surface-container-low">
                            <div className="flex items-center justify-between pb-3 border-b border-white/5">
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary text-xl">waterfall_chart</span>
                                    <h3 className="font-bold text-base text-white">Application Pipeline Progression</h3>
                                </div>
                                <span className="text-xs text-slate-400">Active Records</span>
                            </div>

                            <div className="space-y-4 pt-1">
                                {[
                                    { label: 'Auto-Matched & Saved', count: stats.savedJobsCount, color: 'from-sky-500 to-indigo-500', barColor: 'bg-sky-400' },
                                    { label: 'Applications Submitted', count: stats.appliedJobsCount, color: 'from-purple-500 to-pink-500', barColor: 'bg-purple-400' },
                                    { label: 'Interviews in Progress', count: stats.interviewingCount, color: 'from-amber-500 to-emerald-500', barColor: 'bg-amber-400' },
                                ].map((item, idx) => {
                                    const totalOpportunities = Math.max(stats.savedJobsCount + stats.appliedJobsCount + stats.interviewingCount, 1);
                                    const pct = Math.round((item.count / totalOpportunities) * 100);
                                    return (
                                        <div key={idx} className="space-y-1.5 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                                            <div className="flex justify-between text-xs font-semibold">
                                                <span className="text-slate-300">{item.label}</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-white font-bold">{item.count}</span>
                                                    <span className="text-[10px] text-slate-400">({pct}%)</span>
                                                </div>
                                            </div>
                                            <div className="w-full h-2 rounded-full bg-surface-container-high overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full bg-gradient-to-r ${item.color} transition-all duration-700`}
                                                    style={{ width: `${item.count > 0 ? Math.min(100, Math.max(10, pct)) : 0}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Top Missing Skills Frequency - MINIMAL & AESTHETIC */}
                        <div className="glass-card rounded-2xl p-6 border border-white/5 space-y-4 bg-gradient-to-b from-surface-container to-surface-container-low">
                            <div className="flex items-center justify-between pb-3 border-b border-white/5">
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-amber-400 text-xl">auto_fix_high</span>
                                    <h3 className="font-bold text-base text-white">Skill Gaps in Demand</h3>
                                </div>
                            </div>
                            <p className="text-xs text-slate-400">
                                Keywords requested by evaluated jobs that are currently missing from your resume.
                            </p>

                            <div className="space-y-2.5 pt-1 max-h-72 overflow-y-auto pr-1">
                                {stats.missingSkills.length > 0 ? (
                                    stats.missingSkills.map((skill, idx) => (
                                        <div key={idx} className="space-y-1 p-2 rounded-xl bg-white/[0.02] border border-white/5">
                                            <div className="flex justify-between text-xs font-medium">
                                                <span className="text-slate-200 font-semibold">{skill.name}</span>
                                                <span className="text-amber-400 text-[11px] font-bold">{skill.count} jobs</span>
                                            </div>
                                            <div className="w-full h-1.5 rounded-full bg-surface-container-high overflow-hidden">
                                                <div
                                                    className="h-full rounded-full bg-gradient-to-r from-amber-500 to-indigo-500"
                                                    style={{ width: `${skill.pct}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-xs text-slate-500">
                                        No skill gaps detected yet. Start evaluating jobs to identify market keywords!
                                    </div>
                                )}
                            </div>

                            <Link
                                href="/profile"
                                className="block text-center w-full py-2.5 rounded-xl bg-primary-container/20 hover:bg-primary-container/30 text-xs font-semibold text-primary border border-primary-container/30 transition-all mt-3"
                            >
                                Add Missing Skills to Profile →
                            </Link>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
