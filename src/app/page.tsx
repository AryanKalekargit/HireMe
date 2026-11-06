'use client';

import React from 'react';
import Link from 'next/link';
import { HireMeLogo } from '@/components/common/HireMeLogo';

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-background text-on-surface font-sans selection:bg-primary-container selection:text-white">
            {/* Top Navigation */}
            <nav className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-xl border-b border-white/10 shadow-sm">
                <div className="flex justify-between items-center h-16 px-6 max-w-7xl mx-auto">
                    <Link href="/" className="flex items-center gap-2 group">
                        <HireMeLogo size={34} subtitle="AI Job Assistant" />
                    </Link>

                    <div className="hidden md:flex items-center gap-8 text-sm">
                        <a href="#features" className="text-slate-400 hover:text-primary transition-colors">
                            Features
                        </a>
                        <a href="#how-it-works" className="text-slate-400 hover:text-primary transition-colors">
                            How It Works
                        </a>
                        <a href="#extension" className="text-slate-400 hover:text-primary transition-colors">
                            Chrome Extension
                        </a>
                    </div>

                    <div className="flex items-center gap-4">
                        <Link
                            href="/login"
                            className="text-sm font-semibold text-slate-300 hover:text-white transition-colors hidden sm:block"
                        >
                            Sign In
                        </Link>
                        <Link
                            href="/dashboard"
                            className="bg-primary-container hover:bg-primary-container/90 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-indigo-500/20 active:scale-95 flex items-center gap-1.5"
                        >
                            Go to Dashboard
                            <span className="material-symbols-outlined text-sm">arrow_forward</span>
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="pt-24 pb-32">
                {/* Hero Section */}
                <section className="relative pt-20 pb-28 px-6 max-w-7xl mx-auto text-center">
                    <div className="hero-glow" />

                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/10 bg-surface-container-high/60 backdrop-blur-md mb-8">
                        <span className="w-2 h-2 rounded-full bg-secondary shadow-[0_0_10px_rgba(78,222,163,0.8)]" />
                        <span className="text-xs font-medium text-slate-300">HireMe AI Engine v2.0 is live</span>
                    </div>

                    <h1 className="text-4xl sm:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-400 max-w-4xl mx-auto mb-6 leading-tight tracking-tight">
                        Apply Smarter. <br className="hidden md:block" />
                        Get Hired Faster.
                    </h1>

                    <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
                        Analyze LinkedIn jobs instantly using AI and discover how well your resume matches before you apply. Turn rejections into interviews with data-driven insights.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
                        <Link
                            href="/dashboard"
                            className="w-full sm:w-auto bg-primary-container text-white px-8 py-3.5 rounded-xl font-semibold text-sm hover:bg-primary-container/90 transition-all shadow-[0_0_25px_rgba(79,70,229,0.4)] active:scale-95 flex items-center justify-center gap-2"
                        >
                            Get Started Free
                            <span className="material-symbols-outlined text-sm">arrow_forward</span>
                        </Link>
                        <Link
                            href="/tracker"
                            className="w-full sm:w-auto glass-panel text-on-surface px-8 py-3.5 rounded-xl font-semibold text-sm hover:bg-white/10 transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                                table_chart
                            </span>
                            View Demo Tracker
                        </Link>
                    </div>

                    {/* Interface Preview Mockup Card */}
                    <div className="relative max-w-5xl mx-auto rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-surface-container group">
                        <div className="p-4 bg-surface-container-high border-b border-white/5 flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-500/80" />
                            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                            <div className="w-3 h-3 rounded-full bg-green-500/80" />
                            <div className="ml-4 text-xs text-slate-400 font-mono">https://hireme.ai/dashboard</div>
                        </div>
                        <div className="p-8 text-left grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2 glass-card rounded-xl p-6">
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <h3 className="font-bold text-lg text-white">Senior Full Stack Engineer</h3>
                                        <p className="text-xs text-slate-400">Flipkart • Bengaluru, Karnataka (Hybrid)</p>
                                    </div>
                                    <div className="w-16 h-16 rounded-full bg-indigo-500/10 border-2 border-indigo-500 flex flex-col items-center justify-center text-indigo-400">
                                        <span className="text-xl font-extrabold leading-none">92%</span>
                                        <span className="text-[9px] uppercase font-bold text-slate-400">Match</span>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <span className="text-xs font-semibold text-secondary uppercase tracking-wider block mb-2">Matched Skills (8)</span>
                                        <div className="flex flex-wrap gap-2">
                                            {['React', 'TypeScript', 'Next.js', 'Node.js', 'GraphQL', 'Tailwind CSS', 'MongoDB', 'AWS'].map((s) => (
                                                <span key={s} className="px-2.5 py-1 rounded-lg bg-secondary/10 border border-secondary/20 text-secondary text-xs font-medium">
                                                    ✓ {s}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="glass-card rounded-xl p-6 flex flex-col justify-between">
                                <div>
                                    <h4 className="font-bold text-sm text-white mb-3 flex items-center gap-1.5">
                                        <span className="material-symbols-outlined text-warning text-base">warning</span>
                                        Missing Skills (2)
                                    </h4>
                                    <div className="space-y-2">
                                        <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium">
                                            • Kubernetes (K8s)
                                        </div>
                                        <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium">
                                            • gRPC Services
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-6 pt-4 border-t border-white/5">
                                    <button className="w-full bg-primary-container text-white text-xs font-semibold py-2.5 rounded-lg hover:bg-primary-container/90 transition-colors">
                                        One-Click Save Job
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features Bento Grid */}
                <section className="py-24 px-6 max-w-7xl mx-auto" id="features">
                    <div className="mb-16 text-center">
                        <h2 className="text-3xl font-extrabold text-white mb-4">The ultimate AI toolkit for job seekers</h2>
                        <p className="text-slate-400 max-w-2xl mx-auto">Everything you need to optimize your profile and land interviews at top tech companies.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="glass-panel rounded-2xl p-8 transition-all hover:-translate-y-1 hover:border-primary/40">
                            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-primary mb-6 border border-indigo-500/20">
                                <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                                    description
                                </span>
                            </div>
                            <h3 className="font-bold text-xl text-white mb-3">Resume Analysis & Parser</h3>
                            <p className="text-sm text-slate-400 leading-relaxed">
                                Extract skills, experience, and education automatically using pdf-parse and our 1,000+ tech skill dictionary.
                            </p>
                        </div>

                        <div className="glass-panel rounded-2xl p-8 transition-all hover:-translate-y-1 hover:border-secondary/40">
                            <div className="w-12 h-12 rounded-xl bg-teal-500/10 flex items-center justify-center text-secondary mb-6 border border-teal-500/20">
                                <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                                    extension
                                </span>
                            </div>
                            <h3 className="font-bold text-xl text-white mb-3">LinkedIn Extension</h3>
                            <p className="text-sm text-slate-400 leading-relaxed">
                                Manifest V3 Chrome Extension analyzes job postings directly from your Chrome toolbar — showing instant Hire Scores, CTC/Stipend, and recruiter contacts.
                            </p>
                        </div>

                        <div className="glass-panel rounded-2xl p-8 transition-all hover:-translate-y-1 hover:border-warning/40">
                            <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-warning mb-6 border border-amber-500/20">
                                <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                                    psychology
                                </span>
                            </div>
                            <h3 className="font-bold text-xl text-white mb-3">AI Career Coach</h3>
                            <p className="text-sm text-slate-400 leading-relaxed">
                                Tailored interview preparation questions, bullet point rewrites, and skill gap roadmaps generated specifically for your target role.
                            </p>
                        </div>
                    </div>
                </section>

                {/* How It Works Section */}
                <section className="py-20 px-6 max-w-7xl mx-auto border-t border-white/5" id="how-it-works">
                    <div className="mb-16 text-center">
                        <h2 className="text-3xl font-extrabold text-white mb-4">Streamlined 4-Step Workflow</h2>
                        <p className="text-slate-400">Four simple steps to transform your job search process.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        {[
                            { step: '1', title: 'Upload Resume', desc: 'PDF parse extracts your technical skills and experience.' },
                            { step: '2', title: 'Browse LinkedIn', desc: 'Open any job description on LinkedIn Jobs.' },
                            { step: '3', title: 'Instant Hire Score', desc: 'Chrome Extension compares your resume and shows match score.' },
                            { step: '4', title: 'Apply & Track', desc: 'Save jobs to Opportunity Tracker and prepare with AI Career Coach.' },
                        ].map((item) => (
                            <div key={item.step} className="glass-card rounded-xl p-6 relative">
                                <div className="w-10 h-10 rounded-full bg-primary-container text-white font-bold flex items-center justify-center mb-4">
                                    {item.step}
                                </div>
                                <h4 className="font-bold text-white text-base mb-2">{item.title}</h4>
                                <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* CTA Section */}
                <section className="py-20 px-6 max-w-4xl mx-auto text-center">
                    <div className="glass-panel rounded-3xl p-12 relative overflow-hidden border border-white/10">
                        <h2 className="text-3xl font-extrabold text-white mb-4">Ready to double your interview response rate?</h2>
                        <p className="text-slate-400 mb-8 max-w-xl mx-auto">
                            Start analyzing job postings for free today with HireMe AI Job Assistant.
                        </p>
                        <Link
                            href="/dashboard"
                            className="inline-flex items-center gap-2 bg-primary-container text-white px-8 py-3.5 rounded-xl font-bold text-sm hover:bg-primary-container/90 transition-all shadow-lg shadow-indigo-500/30"
                        >
                            Launch HireMe Dashboard
                            <span className="material-symbols-outlined text-sm">rocket_launch</span>
                        </Link>
                    </div>
                </section>

                {/* Footer with Brand Logo */}
                <footer className="border-t border-white/5 py-10 px-6 max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
                    <HireMeLogo size={28} subtitle="v2.0 AI Engine" />
                    <p>© {new Date().getFullYear()} HireMe AI Job Assistant. All rights reserved.</p>
                </footer>
            </main>
        </div>
    );
}
