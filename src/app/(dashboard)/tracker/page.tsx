'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { extractAllJobMetadata } from '@/lib/metadata-extractor';

interface SavedJobItem {
    _id: string;
    jobId?: string;
    jobTitle: string;
    company: string;
    location: string;
    status: 'Matched' | 'Saved' | 'Applied' | 'Interviewing' | 'Offer' | 'Rejected' | 'MATCHED' | 'SAVED' | 'APPLIED' | 'INTERVIEWING' | 'OFFERED' | 'REJECTED';
    hireScore: number;
    salaryRange?: string;
    description?: string;
    url?: string;
    source?: 'linkedin' | 'direct';
    notes?: string;
    contactEmail?: string;
    contactPhone?: string;
    contactDisplay?: string;
    requiredExperience?: string;
    experienceMatchStatus?: 'MATCH' | 'MISMATCH' | 'FLEXIBLE' | 'UNKNOWN';
    experienceMatchMessage?: string;
    employmentType?: 'Internship' | 'Job' | string;
    compensationType?: 'Stipend' | 'CTC' | string;
    compensation?: string;
    appliedDate?: string;
    createdAt?: string;
}

const displayStages = ['Matched', 'Saved', 'Applied', 'Interviewing', 'Offer', 'Rejected'] as const;

function getScoreVisuals(score: number) {
    if (score >= 85) {
        return {
            textColor: 'text-emerald-400',
            bgColor: 'bg-emerald-500/10',
            borderColor: 'border-emerald-500/30',
            tagline: 'Elite Fit · Strong Interview Probability',
        };
    }
    if (score >= 70) {
        return {
            textColor: 'text-teal-400',
            bgColor: 'bg-teal-500/10',
            borderColor: 'border-teal-500/30',
            tagline: 'Competitive Alignment · High Quality Match',
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
            tagline: 'Developing Match · Review Recommended Upskilling',
        };
    }
    return {
        textColor: 'text-slate-400',
        bgColor: 'bg-slate-500/10',
        borderColor: 'border-white/10',
        tagline: 'No Opportunities Yet · Evaluate Jobs to Populate Stats',
    };
}

export default function OpportunityTrackerPage() {
    const [jobs, setJobs] = useState<SavedJobItem[]>([]);
    const [loadingJobs, setLoadingJobs] = useState(true);

    const [filterStage, setFilterStage] = useState<string>('All');
    const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedJob, setSelectedJob] = useState<SavedJobItem | null>(null);
    const [editingNotes, setEditingNotes] = useState('');
    const [copiedJd, setCopiedJd] = useState(false);
    const [candidateExpLevel, setCandidateExpLevel] = useState('Entry Level');

    // Form states
    const [newTitle, setNewTitle] = useState('');
    const [newCompany, setNewCompany] = useState('');
    const [newLocation, setNewLocation] = useState('');
    const [newUrl, setNewUrl] = useState('');
    const [newStatus, setNewStatus] = useState<string>('MATCHED');
    const [newSalary, setNewSalary] = useState('');
    const [newDescription, setNewDescription] = useState('');
    const [newNotes, setNewNotes] = useState('');

    useEffect(() => {
        fetchJobs();
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await fetch('/api/profile');
            const data = await res.json();
            if (data.success && data.profile?.experienceLevel) {
                setCandidateExpLevel(data.profile.experienceLevel);
            }
        } catch {}
    };

    const getJobMeta = (job: SavedJobItem) => {
        if (job.contactPhone || job.contactEmail || job.experienceMatchStatus || job.employmentType) {
            const isIntern = job.employmentType
                ? job.employmentType.toLowerCase().includes('intern')
                : /\b(?:intern|internship|trainee)\b/i.test(`${job.jobTitle} ${job.description || ''}`);
            const empType = isIntern ? 'Internship' : 'Job';
            const compType = isIntern ? 'Stipend' : 'CTC';
            const comp = job.compensation || (job.salaryRange && job.salaryRange !== 'Competitive' ? job.salaryRange : 'Not Disclosed');
            return {
                contactEmail: job.contactEmail,
                contactPhone: job.contactPhone,
                contactDisplay: job.contactDisplay,
                requiredExperience: job.requiredExperience,
                experienceMatchStatus: job.experienceMatchStatus || 'FLEXIBLE',
                experienceMatchMessage: job.experienceMatchMessage,
                isFresherMismatch: job.experienceMatchStatus === 'MISMATCH',
                employmentType: empType,
                compensationType: compType,
                compensation: comp,
                displayCompensation: `${compType} : ${comp}`,
            };
        }
        const meta = extractAllJobMetadata(job.description || job.notes || '', candidateExpLevel, job.jobTitle);
        return {
            contactEmail: meta.contact.email,
            contactPhone: meta.contact.phone,
            contactDisplay: meta.contact.displayString,
            requiredExperience: meta.experience.requiredExperience,
            experienceMatchStatus: meta.experience.status,
            experienceMatchMessage: meta.experience.message,
            isFresherMismatch: meta.experience.isFresherMismatch,
            employmentType: meta.employment.employmentType,
            compensationType: meta.employment.compensationType,
            compensation: meta.employment.compensation,
            displayCompensation: meta.employment.displayString,
        };
    };

    const fetchJobs = async () => {
        setLoadingJobs(true);
        try {
            const res = await fetch('/api/saved-jobs');
            const data = await res.json();
            const list = data.savedJobs || data.jobs;
            if (data.success && Array.isArray(list)) {
                setJobs(list);
            }
        } catch (e) {
            console.error('Fetch jobs error:', e);
        } finally {
            setLoadingJobs(false);
        }
    };

    const handleAddJob = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTitle || !newCompany) return;

        try {
            const res = await fetch('/api/saved-jobs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jobTitle: newTitle.trim(),
                    company: newCompany.trim(),
                    location: newLocation.trim() || 'Remote / Hybrid',
                    status: newStatus.toUpperCase(),
                    url: newUrl.trim(),
                    source: newUrl.includes('linkedin.com') ? 'linkedin' : 'direct',
                    description: newDescription.trim(),
                    hireScore: 85,
                    salaryRange: newSalary || 'Competitive',
                    notes: newNotes.trim() || newDescription.trim(),
                }),
            });
            const data = await res.json();
            const created = data.savedJob || data.job;
            if (data.success && created) {
                setJobs([created, ...jobs]);
                setShowAddModal(false);
                setNewTitle('');
                setNewCompany('');
                setNewLocation('');
                setNewUrl('');
                setNewSalary('');
                setNewDescription('');
                setNewNotes('');
            }
        } catch (err) {
            console.error('Add job error:', err);
        }
    };

    const updateJobStatus = async (id: string, newStat: string) => {
        const formatted = newStat.toUpperCase();
        setJobs((prev) => prev.map((j) => (j._id === id ? { ...j, status: formatted as any } : j)));
        if (selectedJob && selectedJob._id === id) {
            setSelectedJob({ ...selectedJob, status: formatted as any });
        }

        try {
            await fetch(`/api/saved-jobs/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: formatted }),
            });
        } catch (err) {
            console.error('Update status error:', err);
        }
    };

    const handleSaveNotes = async () => {
        if (!selectedJob) return;
        const updated = { ...selectedJob, notes: editingNotes };
        setSelectedJob(updated);
        setJobs((prev) => prev.map((j) => (j._id === selectedJob._id ? updated : j)));

        try {
            await fetch(`/api/saved-jobs/${selectedJob._id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notes: editingNotes }),
            });
        } catch (err) {
            console.error('Save notes error:', err);
        }
    };

    const handleDeleteJob = async (id: string) => {
        setJobs((prev) => prev.filter((j) => j._id !== id));
        if (selectedJob?._id === id) setSelectedJob(null);

        try {
            await fetch(`/api/saved-jobs/${id}`, { method: 'DELETE' });
        } catch (err) {
            console.error('Delete job error:', err);
        }
    };

    const normalizeStatus = (s: string) => {
        const u = (s || '').toUpperCase();
        if (u === 'MATCHED') return 'Matched';
        if (u === 'SAVED') return 'Saved';
        if (u === 'APPLIED') return 'Applied';
        if (u === 'INTERVIEWING') return 'Interviewing';
        if (u === 'OFFER' || u === 'OFFERED') return 'Offer';
        if (u === 'REJECTED') return 'Rejected';
        return s || 'Matched';
    };

    const getStatusBadgeClass = (s: string) => {
        const norm = normalizeStatus(s);
        switch (norm) {
            case 'Matched':
                return 'bg-sky-500/10 text-sky-400 border-sky-500/30';
            case 'Saved':
                return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30';
            case 'Applied':
                return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
            case 'Interviewing':
                return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
            case 'Offer':
                return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
            case 'Rejected':
                return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
            default:
                return 'bg-white/10 text-slate-300 border-white/20';
        }
    };

    const filteredJobs = jobs.filter((j) => {
        if (filterStage === 'All') return true;
        return normalizeStatus(j.status) === filterStage;
    });

    const totalOpportunities = jobs.length;
    const avgHireScore = totalOpportunities > 0
        ? Math.round(jobs.reduce((acc, j) => acc + (j.hireScore || 0), 0) / totalOpportunities)
        : 0;
    const matchedCount = jobs.filter((j) => normalizeStatus(j.status) === 'Matched').length;
    const inPipelineCount = jobs.filter((j) => ['Applied', 'Interviewing', 'Offer'].includes(normalizeStatus(j.status))).length;
    const interviewCount = jobs.filter((j) => normalizeStatus(j.status) === 'Interviewing').length;
    const scoreVisuals = getScoreVisuals(avgHireScore);

    return (
        <div className="flex min-h-screen bg-background text-on-surface font-sans">
            <Sidebar />

            <div className="flex-1 flex flex-col min-w-0">
                <Header title="Opportunity Tracker" />

                <main className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto w-full">
                    {/* Live Dynamic Stats Bar */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="glass-card rounded-2xl p-4 border border-white/5 flex items-center justify-between">
                            <div>
                                <span className="text-[11px] font-medium text-slate-400 block mb-1">Total Tracked Jobs</span>
                                <span className="text-2xl font-extrabold text-white">{totalOpportunities}</span>
                                <span className="text-[10px] text-slate-400 block mt-0.5">
                                    {totalOpportunities > 0 ? `${totalOpportunities} active positions` : 'No opportunities yet'}
                                </span>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-primary">
                                <span className="material-symbols-outlined text-xl">folder_shared</span>
                            </div>
                        </div>

                        <div className="glass-card rounded-2xl p-4 border border-white/5 flex items-center justify-between">
                            <div>
                                <span className="text-[11px] font-medium text-slate-400 block mb-1">Average Hire Score</span>
                                <span className={`text-2xl font-extrabold ${scoreVisuals.textColor}`}>
                                    {avgHireScore > 0 ? `${avgHireScore}%` : '--'}
                                </span>
                                <span className={`text-[10px] font-semibold block mt-0.5 ${scoreVisuals.textColor}`}>
                                    {scoreVisuals.tagline}
                                </span>
                            </div>
                            <div className={`w-10 h-10 rounded-xl ${scoreVisuals.bgColor} border ${scoreVisuals.borderColor} flex items-center justify-center ${scoreVisuals.textColor}`}>
                                <span className="material-symbols-outlined text-xl">speed</span>
                            </div>
                        </div>

                        <div className="glass-card rounded-2xl p-4 border border-white/5 flex items-center justify-between">
                            <div>
                                <span className="text-[11px] font-medium text-slate-400 block mb-1">Matched For Review</span>
                                <span className="text-2xl font-extrabold text-sky-400">{matchedCount}</span>
                                <span className="text-[10px] text-slate-400 block mt-0.5">Ready to review & apply</span>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                                <span className="material-symbols-outlined text-xl">fact_check</span>
                            </div>
                        </div>

                        <div className="glass-card rounded-2xl p-4 border border-white/5 flex items-center justify-between">
                            <div>
                                <span className="text-[11px] font-medium text-slate-400 block mb-1">Active In Pipeline</span>
                                <span className="text-2xl font-extrabold text-purple-400">{inPipelineCount}</span>
                                <span className="text-[10px] text-purple-300 block mt-0.5">
                                    {interviewCount > 0 ? `${interviewCount} currently interviewing` : 'Applied & in review'}
                                </span>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                                <span className="material-symbols-outlined text-xl">send</span>
                            </div>
                        </div>
                    </div>

                    {/* Header Controls */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glass-card p-4 rounded-2xl border border-white/5">
                        {/* Stage Filter Buttons */}
                        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
                            <button
                                onClick={() => setFilterStage('All')}
                                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${filterStage === 'All'
                                        ? 'bg-primary-container text-white shadow-sm shadow-indigo-500/30'
                                        : 'bg-surface-container-high text-slate-400 hover:text-white hover:bg-white/10'
                                    }`}
                            >
                                All ({jobs.length})
                            </button>
                            {displayStages.map((stage) => {
                                const count = jobs.filter((j) => normalizeStatus(j.status) === stage).length;
                                return (
                                    <button
                                        key={stage}
                                        onClick={() => setFilterStage(stage)}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${filterStage === stage
                                                ? 'bg-primary-container text-white shadow-sm shadow-indigo-500/30'
                                                : 'bg-surface-container-high text-slate-400 hover:text-white hover:bg-white/10'
                                            }`}
                                    >
                                        <span>{stage}</span>
                                        <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/10 font-bold">
                                            {count}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* View Switcher & Add Job Button */}
                        <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
                            <div className="bg-surface-container-high p-1 rounded-xl flex items-center border border-white/5">
                                <button
                                    onClick={() => setViewMode('table')}
                                    className={`p-1.5 rounded-lg flex items-center justify-center transition-colors ${viewMode === 'table' ? 'bg-primary-container text-white' : 'text-slate-400 hover:text-white'
                                        }`}
                                    title="Table View"
                                >
                                    <span className="material-symbols-outlined text-sm">table_rows</span>
                                </button>
                                <button
                                    onClick={() => setViewMode('kanban')}
                                    className={`p-1.5 rounded-lg flex items-center justify-center transition-colors ${viewMode === 'kanban' ? 'bg-primary-container text-white' : 'text-slate-400 hover:text-white'
                                        }`}
                                    title="Kanban Board View"
                                >
                                    <span className="material-symbols-outlined text-sm">view_kanban</span>
                                </button>
                            </div>

                            <button
                                onClick={() => setShowAddModal(true)}
                                className="bg-primary-container hover:bg-primary-container/90 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-sm shadow-indigo-500/25 flex items-center gap-1.5"
                            >
                                <span className="material-symbols-outlined text-sm">add</span>
                                Add Job
                            </button>
                        </div>
                    </div>

                    {/* TABLE VIEW */}
                    {viewMode === 'table' && (
                        <div className="glass-card rounded-2xl p-4 sm:p-6 border border-white/5">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs text-slate-300">
                                    <thead className="bg-surface-container-high text-slate-400 uppercase font-semibold text-[10px] border-b border-white/5">
                                        <tr>
                                            <th className="p-3.5">Company & Role</th>
                                            <th className="p-3.5">Job Link</th>
                                            <th className="p-3.5">Hire Score</th>
                                            <th className="p-3.5">Pipeline Stage</th>
                                            <th className="p-3.5">Compensation</th>
                                            <th className="p-3.5">Date Added</th>
                                            <th className="p-3.5 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {filteredJobs.length > 0 ? (
                                            filteredJobs.map((job) => {
                                                const isLinkedIn = job.source === 'linkedin' || (job.url && job.url.includes('linkedin.com'));
                                                const meta = getJobMeta(job);
                                                return (
                                                    <tr
                                                        key={job._id}
                                                        onClick={() => {
                                                            setSelectedJob(job);
                                                            setEditingNotes(job.notes || '');
                                                        }}
                                                        className="hover:bg-white/5 transition-colors cursor-pointer group"
                                                    >
                                                        <td className="p-3.5">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-bold text-white text-sm group-hover:text-primary transition-colors">
                                                                    {job.jobTitle}
                                                                </span>
                                                                {isLinkedIn ? (
                                                                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-sky-500/10 text-sky-400 border border-sky-500/30 font-semibold">
                                                                        LinkedIn
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/5 text-slate-400 border border-white/10 font-semibold">
                                                                        Direct
                                                                    </span>
                                                                )}
                                                                <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold border ${
                                                                    meta.employmentType === 'Internship'
                                                                        ? 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                                                                        : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                                                }`}>
                                                                    {meta.employmentType}
                                                                </span>
                                                            </div>
                                                            <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-2 flex-wrap">
                                                                <span>{job.company} • {job.location || 'Remote'}</span>
                                                                <span className="text-amber-300 font-medium bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20">
                                                                    {meta.displayCompensation}
                                                                </span>
                                                                {meta.contactPhone ? (
                                                                    <span className="text-emerald-400 font-semibold inline-flex items-center gap-0.5">
                                                                        <span className="material-symbols-outlined text-xs">call</span>
                                                                        {meta.contactPhone}
                                                                    </span>
                                                                ) : meta.contactEmail ? (
                                                                    <span className="text-sky-400 font-semibold inline-flex items-center gap-0.5">
                                                                        <span className="material-symbols-outlined text-xs">mail</span>
                                                                        {meta.contactEmail}
                                                                    </span>
                                                                ) : null}
                                                                {meta.isFresherMismatch && (
                                                                    <span className="text-[10px] bg-amber-500/15 text-amber-300 px-1.5 py-0.2 rounded border border-amber-500/30 font-semibold">
                                                                        ⚠️ Req: {meta.requiredExperience}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>

                                                        <td className="p-3.5">
                                                            {job.url ? (
                                                                <a
                                                                    href={job.url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                                                                        isLinkedIn
                                                                            ? 'bg-[#0077b5]/15 text-[#38bdf8] hover:bg-[#0077b5]/25 border border-[#0077b5]/30'
                                                                            : 'bg-white/5 text-slate-300 hover:text-white border border-white/10'
                                                                    }`}
                                                                >
                                                                    <span>{isLinkedIn ? 'LinkedIn Post' : 'Direct Link'}</span>
                                                                    <span className="material-symbols-outlined text-xs">open_in_new</span>
                                                                </a>
                                                            ) : (
                                                                <span className="text-slate-500 text-[11px]">—</span>
                                                            )}
                                                        </td>

                                                        <td className="p-3.5">
                                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                                                                job.hireScore >= 80
                                                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                                                    : job.hireScore >= 60
                                                                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                                                    : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                                                            }`}>
                                                                {job.hireScore}%
                                                            </span>
                                                        </td>

                                                        <td className="p-3.5">
                                                            <select
                                                                value={normalizeStatus(job.status)}
                                                                onClick={(e) => e.stopPropagation()}
                                                                onChange={(e) => updateJobStatus(job._id, e.target.value)}
                                                                className={`text-xs font-bold rounded-xl px-2.5 py-1 focus:outline-none border transition-colors cursor-pointer ${getStatusBadgeClass(job.status)}`}
                                                            >
                                                                {displayStages.map((s) => (
                                                                    <option key={s} value={s} className="bg-slate-900 text-white">
                                                                        {s}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </td>

                                                        <td className="p-3.5 font-medium text-slate-300">{job.salaryRange || 'Competitive'}</td>
                                                        <td className="p-3.5 text-slate-400">{job.appliedDate || (job.createdAt ? new Date(job.createdAt).toLocaleDateString() : 'Recent')}</td>

                                                        <td className="p-3.5 text-right">
                                                            <div className="flex items-center justify-end gap-2">
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setSelectedJob(job);
                                                                        setEditingNotes(job.notes || '');
                                                                    }}
                                                                    className="text-xs text-primary font-semibold hover:underline"
                                                                >
                                                                    Inspect
                                                                </button>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleDeleteJob(job._id);
                                                                    }}
                                                                    className="text-slate-500 hover:text-red-400 transition-colors p-1"
                                                                    title="Remove job"
                                                                >
                                                                    <span className="material-symbols-outlined text-sm">delete</span>
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        ) : (
                                            <tr>
                                                <td colSpan={7} className="p-8 text-center text-slate-500">
                                                    No opportunities in this stage. Analyze a job from the Dashboard or use the LinkedIn Extension!
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* KANBAN BOARD VIEW */}
                    {viewMode === 'kanban' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5 overflow-x-auto pb-4">
                            {displayStages.map((stage) => {
                                const stageJobs = jobs.filter((j) => normalizeStatus(j.status) === stage);
                                return (
                                    <div key={stage} className="bg-surface-container-low/70 border border-white/5 rounded-2xl p-3.5 flex flex-col min-w-[210px]">
                                        <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-white/5">
                                            <span className="text-xs font-bold text-slate-200">{stage}</span>
                                            <span className="text-[10px] px-2 py-0.2 rounded-full bg-white/10 text-slate-300 font-bold">
                                                {stageJobs.length}
                                            </span>
                                        </div>

                                        <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[70vh]">
                                            {stageJobs.map((job) => {
                                                const isLinkedIn = job.source === 'linkedin' || (job.url && job.url.includes('linkedin.com'));
                                                const meta = getJobMeta(job);
                                                return (
                                                    <div
                                                        key={job._id}
                                                        onClick={() => {
                                                            setSelectedJob(job);
                                                            setEditingNotes(job.notes || '');
                                                        }}
                                                        className="glass-card p-3 rounded-xl border border-white/5 hover:border-primary-container/40 transition-all cursor-pointer space-y-2 group"
                                                    >
                                                        <div className="flex items-start justify-between gap-1">
                                                            <span className="text-xs font-bold text-white leading-tight group-hover:text-primary transition-colors line-clamp-2">
                                                                {job.jobTitle}
                                                            </span>
                                                            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-md shrink-0">
                                                                {job.hireScore}%
                                                            </span>
                                                        </div>

                                                        <p className="text-[11px] text-slate-400 truncate">{job.company}</p>

                                                        {(meta.contactPhone || meta.contactEmail || meta.isFresherMismatch) && (
                                                            <div className="text-[10px] space-y-0.5 pt-0.5">
                                                                {meta.isFresherMismatch ? (
                                                                    <div className="text-amber-300 font-semibold truncate flex items-center gap-0.5">
                                                                        <span>⚠️</span>
                                                                        <span>Req: {meta.requiredExperience}</span>
                                                                    </div>
                                                                ) : null}
                                                                {meta.contactPhone ? (
                                                                    <div className="text-emerald-400 font-medium truncate flex items-center gap-1">
                                                                        <span className="material-symbols-outlined text-[11px]">call</span>
                                                                        <span>{meta.contactPhone}</span>
                                                                    </div>
                                                                ) : meta.contactEmail ? (
                                                                    <div className="text-sky-400 font-medium truncate flex items-center gap-1">
                                                                        <span className="material-symbols-outlined text-[11px]">mail</span>
                                                                        <span>{meta.contactEmail}</span>
                                                                    </div>
                                                                ) : null}
                                                            </div>
                                                        )}

                                                        <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[10px]">
                                                            {job.url ? (
                                                                <a
                                                                    href={job.url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    className="text-sky-400 hover:underline flex items-center gap-0.5"
                                                                >
                                                                    <span>{isLinkedIn ? 'LinkedIn' : 'Link'}</span>
                                                                    <span className="material-symbols-outlined text-[10px]">open_in_new</span>
                                                                </a>
                                                            ) : (
                                                                <span className="text-slate-500">Direct</span>
                                                            )}
                                                            <span className="text-slate-400">{job.salaryRange || 'Competitive'}</span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* JOB DEEP-DIVE MODAL */}
                    {selectedJob && (
                        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
                            <div className="glass-card bg-surface-container-low border border-white/10 rounded-2xl max-w-2xl w-full p-4 sm:p-6 space-y-5 max-h-[90vh] overflow-y-auto">
                                <div className="flex items-start justify-between border-b border-white/5 pb-4">
                                    <div>
                                        <div className="inline-flex items-center gap-2 mb-1">
                                            <span className="text-xs text-primary font-semibold">{selectedJob.company}</span>
                                            <span className="text-slate-500 text-xs">•</span>
                                            <span className="text-xs text-slate-400">{selectedJob.location || 'Remote'}</span>
                                        </div>
                                        <h2 className="text-xl font-bold text-white">{selectedJob.jobTitle}</h2>
                                    </div>
                                    <button
                                        onClick={() => setSelectedJob(null)}
                                        className="text-slate-400 hover:text-white p-1 rounded-lg"
                                    >
                                        <span className="material-symbols-outlined">close</span>
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    <div className="bg-surface-container-high/60 p-3 rounded-xl border border-white/5">
                                        <span className="text-[10px] text-slate-400 block">Hire Score</span>
                                        <span className="text-lg font-bold text-emerald-400">{selectedJob.hireScore}%</span>
                                    </div>
                                    <div className="bg-surface-container-high/60 p-3 rounded-xl border border-white/5">
                                        <span className="text-[10px] text-slate-400 block">Role Type</span>
                                        <span className={`text-sm font-bold inline-flex items-center gap-1 ${
                                            getJobMeta(selectedJob).employmentType === 'Internship' ? 'text-purple-300' : 'text-emerald-400'
                                        }`}>
                                            <span className="material-symbols-outlined text-xs">
                                                {getJobMeta(selectedJob).employmentType === 'Internship' ? 'school' : 'business_center'}
                                            </span>
                                            {getJobMeta(selectedJob).employmentType}
                                        </span>
                                    </div>
                                    <div className="bg-surface-container-high/60 p-3 rounded-xl border border-white/5">
                                        <span className="text-[10px] text-slate-400 block">{getJobMeta(selectedJob).compensationType}</span>
                                        <span className="text-sm font-semibold text-amber-300 truncate block">{getJobMeta(selectedJob).compensation}</span>
                                    </div>
                                    <div className="bg-surface-container-high/60 p-3 rounded-xl border border-white/5">
                                        <span className="text-[10px] text-slate-400 block">Current Stage</span>
                                        <span className="text-sm font-bold text-white">{normalizeStatus(selectedJob.status)}</span>
                                    </div>
                                </div>

                                {/* Link Row */}
                                {selectedJob.url && (
                                    <div className="p-3.5 rounded-xl bg-surface-container-high border border-white/5 flex items-center justify-between">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span className="material-symbols-outlined text-sky-400 text-lg">link</span>
                                            <span className="text-xs text-slate-300 truncate">{selectedJob.url}</span>
                                        </div>
                                        <a
                                            href={selectedJob.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="bg-primary-container hover:bg-primary-container/90 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1 shrink-0 ml-3"
                                        >
                                            <span>Open LinkedIn</span>
                                            <span className="material-symbols-outlined text-xs">open_in_new</span>
                                        </a>
                                    </div>
                                )}

                                {/* Recruiter Contact, Experience Validity & Compensation Section */}
                                {(() => {
                                    const meta = getJobMeta(selectedJob);
                                    return (
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                            {/* Role Type & CTC / Stipend Card */}
                                            <div className="p-3.5 rounded-xl bg-surface-container-high/60 border border-white/5 space-y-2 flex flex-col justify-between">
                                                <div>
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                                                            Opportunity & Pay
                                                        </span>
                                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border flex items-center gap-1 ${
                                                            meta.employmentType === 'Internship'
                                                                ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                                                                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                                        }`}>
                                                            <span className="material-symbols-outlined text-xs">
                                                                {meta.employmentType === 'Internship' ? 'school' : 'business_center'}
                                                            </span>
                                                            {meta.employmentType}
                                                        </span>
                                                    </div>

                                                    <div className="space-y-1 pt-0.5">
                                                        <div className="flex items-center gap-1.5 text-xs text-white">
                                                            <span className="material-symbols-outlined text-amber-400 text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
                                                                payments
                                                            </span>
                                                            <span>
                                                                <span className="text-slate-300 font-semibold">{meta.compensationType} : </span>
                                                                <strong className="text-amber-300 font-bold">{meta.compensation}</strong>
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <p className="text-[10.5px] leading-tight text-slate-400 mt-2">
                                                    {meta.employmentType === 'Internship'
                                                        ? 'Identified as an Internship opportunity with monthly stipend compensation.'
                                                        : 'Identified as a Job opportunity with annual CTC package.'}
                                                </p>
                                            </div>

                                            {/* Company & Recruiter Contact Card */}
                                            <div className="p-3.5 rounded-xl bg-surface-container-high/60 border border-white/5 space-y-2 flex flex-col justify-between">
                                                <div>
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                                                            Recruiter Contact
                                                        </span>
                                                        <span className="text-[10px] text-slate-500 font-medium">From JD</span>
                                                    </div>

                                                    <div className="space-y-1.5 pt-0.5">
                                                        {meta.contactPhone && (
                                                            <div className="flex items-center gap-2 text-xs text-white">
                                                                <span className="material-symbols-outlined text-emerald-400 text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
                                                                    call
                                                                </span>
                                                                <span>
                                                                    Contact : <a href={`tel:${meta.contactPhone.replace(/\s+/g, '')}`} className="font-semibold text-emerald-300 hover:underline">{meta.contactPhone}</a>
                                                                </span>
                                                            </div>
                                                        )}

                                                        {meta.contactEmail && (
                                                            <div className="flex items-center gap-2 text-xs text-white">
                                                                <span className="material-symbols-outlined text-sky-400 text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
                                                                    mail
                                                                </span>
                                                                <span>
                                                                    Contact : <a href={`mailto:${meta.contactEmail}`} className="font-semibold text-sky-300 hover:underline">{meta.contactEmail}</a>
                                                                </span>
                                                            </div>
                                                        )}

                                                        {!meta.contactPhone && !meta.contactEmail && (
                                                            <div className="flex items-center gap-2 text-xs text-slate-400">
                                                                <span className="material-symbols-outlined text-slate-500 text-base">
                                                                    perm_contact_calendar
                                                                </span>
                                                                <span>Contact : <span className="text-slate-400 font-medium">None</span></span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <p className="text-[10.5px] leading-tight text-slate-400 mt-2">
                                                    Recruiter email and direct calling coordinates extracted from JD.
                                                </p>
                                            </div>

                                            {/* Experience Requirement & Fresher Alert Card */}
                                            <div className={`p-3.5 rounded-xl border space-y-1.5 flex flex-col justify-between ${
                                                meta.isFresherMismatch || meta.experienceMatchStatus === 'MISMATCH'
                                                    ? 'bg-amber-500/10 border-amber-500/30'
                                                    : meta.experienceMatchStatus === 'MATCH'
                                                    ? 'bg-emerald-500/10 border-emerald-500/30'
                                                    : 'bg-surface-container-high/60 border-white/5'
                                            }`}>
                                                <div>
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                                                            Experience
                                                        </span>
                                                        {meta.isFresherMismatch || meta.experienceMatchStatus === 'MISMATCH' ? (
                                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30 flex items-center gap-1">
                                                                <span className="material-symbols-outlined text-xs">warning</span>
                                                                Mismatch
                                                            </span>
                                                        ) : meta.experienceMatchStatus === 'MATCH' ? (
                                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30 flex items-center gap-1">
                                                                <span className="material-symbols-outlined text-xs">verified</span>
                                                                Valid
                                                            </span>
                                                        ) : (
                                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-slate-300 font-semibold">
                                                                Flexible
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                                                        <span className="material-symbols-outlined text-sm text-slate-400">work_history</span>
                                                        <span>
                                                            {meta.requiredExperience ? `Req: ${meta.requiredExperience}` : 'Requirement: Flexible'}
                                                        </span>
                                                    </div>
                                                </div>

                                                <p className="text-[10.5px] leading-tight text-slate-300 mt-2">
                                                    {meta.experienceMatchMessage ||
                                                        (meta.isFresherMismatch
                                                            ? `Role demands ${meta.requiredExperience}. Fresher candidates may face filters.`
                                                            : `Experience level aligns with candidate profile.`)}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })()}

                                {/* Job Description (JD) Section */}
                                {(selectedJob.description || (selectedJob.notes && selectedJob.notes.length > 30)) && (
                                    <div className="space-y-2 p-3.5 rounded-xl bg-surface-container-high/60 border border-white/5">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="material-symbols-outlined text-primary text-base">description</span>
                                                <span className="text-xs font-bold text-white uppercase tracking-wider">Job Description (JD)</span>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    const textToCopy = selectedJob.description || selectedJob.notes || '';
                                                    navigator.clipboard.writeText(textToCopy);
                                                    setCopiedJd(true);
                                                    setTimeout(() => setCopiedJd(false), 2000);
                                                }}
                                                className="text-[11px] text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1 transition-colors"
                                            >
                                                <span className="material-symbols-outlined text-xs">content_copy</span>
                                                {copiedJd ? 'Copied JD!' : 'Copy JD'}
                                            </button>
                                        </div>
                                        <div className="max-h-48 overflow-y-auto pr-2 text-xs text-slate-300 whitespace-pre-wrap leading-relaxed bg-black/30 p-3 rounded-lg border border-white/5 font-sans">
                                            {selectedJob.description || selectedJob.notes}
                                        </div>
                                    </div>
                                )}

                                {/* Notes section */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-semibold text-slate-300">Candidate Notes & Custom Details</label>
                                        <button
                                            onClick={handleSaveNotes}
                                            className="text-[11px] text-primary hover:underline font-semibold"
                                        >
                                            Save Notes
                                        </button>
                                    </div>
                                    <textarea
                                        rows={3}
                                        value={editingNotes}
                                        onChange={(e) => setEditingNotes(e.target.value)}
                                        className="w-full bg-surface-container-high border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-primary-container"
                                        placeholder="Add personal interview notes, recruiter contacts, or referral details..."
                                    />
                                </div>

                                {/* Status transition buttons */}
                                <div className="pt-3 border-t border-white/5 flex flex-wrap items-center justify-between gap-3">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="text-[11px] text-slate-400 mr-1">Move to:</span>
                                        {displayStages.map((s) => (
                                            <button
                                                key={s}
                                                onClick={() => updateJobStatus(selectedJob._id, s)}
                                                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all ${
                                                    normalizeStatus(selectedJob.status) === s
                                                        ? 'bg-primary-container text-white border-primary-container'
                                                        : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'
                                                }`}
                                            >
                                                {s}
                                            </button>
                                        ))}
                                    </div>

                                    <button
                                        onClick={() => handleDeleteJob(selectedJob._id)}
                                        className="text-xs text-red-400 hover:text-red-300 hover:underline flex items-center gap-1"
                                    >
                                        <span className="material-symbols-outlined text-sm">delete</span>
                                        Delete Opportunity
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ADD OPPORTUNITY MODAL */}
                    {showAddModal && (
                        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
                            <div className="glass-card bg-surface-container-low border border-white/10 rounded-2xl max-w-lg w-full p-4 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto">
                                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                                    <h3 className="font-bold text-base text-white">Add Job Opportunity</h3>
                                    <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                                        <span className="material-symbols-outlined">close</span>
                                    </button>
                                </div>

                                <form onSubmit={handleAddJob} className="space-y-3.5">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-300 mb-1">Job Title *</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="e.g. Senior Frontend Engineer"
                                            value={newTitle}
                                            onChange={(e) => setNewTitle(e.target.value)}
                                            className="w-full bg-surface-container-high border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-primary-container"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-300 mb-1">Company *</label>
                                            <input
                                                type="text"
                                                required
                                                placeholder="e.g. Stripe"
                                                value={newCompany}
                                                onChange={(e) => setNewCompany(e.target.value)}
                                                className="w-full bg-surface-container-high border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-primary-container"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-300 mb-1">Location</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. Remote / Bengaluru"
                                                value={newLocation}
                                                onChange={(e) => setNewLocation(e.target.value)}
                                                className="w-full bg-surface-container-high border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-primary-container"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-300 mb-1">LinkedIn or Job Posting URL</label>
                                        <input
                                            type="url"
                                            placeholder="https://www.linkedin.com/jobs/view/..."
                                            value={newUrl}
                                            onChange={(e) => setNewUrl(e.target.value)}
                                            className="w-full bg-surface-container-high border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-primary-container"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-300 mb-1">Initial Stage</label>
                                            <select
                                                value={newStatus}
                                                onChange={(e) => setNewStatus(e.target.value)}
                                                className="w-full bg-surface-container-high border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                                            >
                                                {displayStages.map((s) => (
                                                    <option key={s} value={s.toUpperCase()}>
                                                        {s}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-300 mb-1">Target Compensation</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. ₹25L - ₹32L"
                                                value={newSalary}
                                                onChange={(e) => setNewSalary(e.target.value)}
                                                className="w-full bg-surface-container-high border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-primary-container"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-300 mb-1">Job Description (JD)</label>
                                        <textarea
                                            rows={3}
                                            placeholder="Paste job description requirements here..."
                                            value={newDescription}
                                            onChange={(e) => setNewDescription(e.target.value)}
                                            className="w-full bg-surface-container-high border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-primary-container"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-300 mb-1">Notes</label>
                                        <textarea
                                            rows={2}
                                            placeholder="Optional notes..."
                                            value={newNotes}
                                            onChange={(e) => setNewNotes(e.target.value)}
                                            className="w-full bg-surface-container-high border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-primary-container"
                                        />
                                    </div>

                                    <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
                                        <button
                                            type="button"
                                            onClick={() => setShowAddModal(false)}
                                            className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="bg-primary-container hover:bg-primary-container/90 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-md shadow-indigo-500/20"
                                        >
                                            Save to Tracker
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
