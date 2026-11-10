'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { useSession } from '@/lib/session-context';

export default function SettingsPage() {
    const { user } = useSession();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [minHireScore, setMinHireScore] = useState(75);
    const [emailAlerts, setEmailAlerts] = useState(true);
    const [autoAnalyze, setAutoAnalyze] = useState(true);
    const [savedNotice, setSavedNotice] = useState(false);

    useEffect(() => {
        if (user) {
            setName(user.name || '');
            setEmail(user.email || '');
        }
    }, [user]);

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        setSavedNotice(true);
        setTimeout(() => setSavedNotice(false), 3000);
    };

    return (
        <div className="flex min-h-screen bg-background text-on-surface font-sans">
            <Sidebar />

            <div className="flex-1 flex flex-col min-w-0">
                <Header title="Account & Extension Settings" />

                <main className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto w-full">
                    {savedNotice && (
                        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm">check_circle</span>
                            Preferences and assistant settings saved successfully.
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Profile Settings */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="glass-card rounded-2xl p-4 sm:p-6 border border-white/5 space-y-5">
                                <div className="flex items-center gap-2 pb-3 border-b border-white/5">
                                    <span className="material-symbols-outlined text-primary text-xl">manage_accounts</span>
                                    <h3 className="font-bold text-base text-white">Account Details</h3>
                                </div>

                                <form onSubmit={handleSave} className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-300 mb-1">Display Name</label>
                                            <input
                                                type="text"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                className="w-full bg-surface-container-high border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-primary-container"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
                                            <input
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="w-full bg-surface-container-high border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-primary-container"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                                            Minimum Target Hire Score Threshold: <span className="text-primary font-bold">{minHireScore}%</span>
                                        </label>
                                        <input
                                            type="range"
                                            min="50"
                                            max="95"
                                            value={minHireScore}
                                            onChange={(e) => setMinHireScore(Number(e.target.value))}
                                            className="w-full accent-indigo-500 cursor-pointer"
                                        />
                                        <p className="text-[11px] text-slate-400 mt-1">
                                            LinkedIn postings scoring above this threshold will be marked with a green high-match badge in your extension.
                                        </p>
                                    </div>

                                    <div className="pt-2">
                                        <button
                                            type="submit"
                                            className="bg-primary-container hover:bg-primary-container/90 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-sm shadow-indigo-500/25"
                                        >
                                            Save Settings
                                        </button>
                                    </div>
                                </form>
                            </div>

                            {/* Automation & Notification Preferences */}
                            <div className="glass-card rounded-2xl p-4 sm:p-6 border border-white/5 space-y-4">
                                <div className="flex items-center gap-2 pb-3 border-b border-white/5">
                                    <span className="material-symbols-outlined text-secondary text-xl">tune</span>
                                    <h3 className="font-bold text-base text-white">Assistant Behavior</h3>
                                </div>

                                <div className="space-y-3">
                                    <label className="flex items-center justify-between p-3 rounded-xl bg-surface-container-high/40 border border-white/5 cursor-pointer">
                                        <div>
                                            <span className="text-xs font-semibold text-white block">Auto-analyze LinkedIn postings</span>
                                            <span className="text-[11px] text-slate-400">Calculate Hire Score immediately upon viewing a job page</span>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={autoAnalyze}
                                            onChange={(e) => setAutoAnalyze(e.target.checked)}
                                            className="w-4 h-4 accent-indigo-500 rounded cursor-pointer"
                                        />
                                    </label>

                                    <label className="flex items-center justify-between p-3 rounded-xl bg-surface-container-high/40 border border-white/5 cursor-pointer">
                                        <div>
                                            <span className="text-xs font-semibold text-white block">Weekly Summary Reports</span>
                                            <span className="text-[11px] text-slate-400">Receive an email breakdown of opportunities, skills, and callbacks</span>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={emailAlerts}
                                            onChange={(e) => setEmailAlerts(e.target.checked)}
                                            className="w-4 h-4 accent-indigo-500 rounded cursor-pointer"
                                        />
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Chrome Extension Status Card */}
                        <div className="space-y-6">
                            <div className="glass-card rounded-2xl p-4 sm:p-6 border border-white/5 space-y-4">
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-amber-400 text-xl">extension</span>
                                    <h3 className="font-bold text-base text-white">Chrome Extension</h3>
                                </div>

                                <div className="p-3.5 rounded-xl bg-surface-container-high border border-white/5 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-slate-300 font-semibold">LinkedIn Sync Status</span>
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                            Ready
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-slate-400">
                                        The extension communicates with your HireMe server at <code className="text-primary">localhost:3000</code>.
                                    </p>
                                </div>

                                <div className="text-xs text-slate-400 space-y-2">
                                    <span className="font-semibold text-slate-300 block">How to Load in Chrome:</span>
                                    <ol className="list-decimal list-inside space-y-1 text-[11px]">
                                        <li>Open Chrome and navigate to <code className="text-slate-300">chrome://extensions</code></li>
                                        <li>Toggle on <strong>Developer mode</strong> in the top-right corner</li>
                                        <li>Click <strong>Load unpacked</strong></li>
                                        <li>Select the <code className="text-slate-300">extension</code> folder in this project</li>
                                    </ol>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
