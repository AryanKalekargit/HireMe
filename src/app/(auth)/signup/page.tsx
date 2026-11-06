'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { HireMeLogo } from '@/components/common/HireMeLogo';

const TARGET_ROLES = [
    'Full Stack Engineer',
    'Frontend Developer',
    'Backend Software Engineer',
    'DevOps & Cloud Engineer',
    'Data Scientist / AI Engineer',
    'Product Manager',
    'Mobile Developer (iOS/Android)',
    'ML / AI Research Engineer',
    'Site Reliability Engineer',
    'Software Engineering Manager',
];

export default function SignupPage() {
    const router = useRouter();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [targetRole, setTargetRole] = useState('Full Stack Engineer');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: email.trim().toLowerCase(),
                    name: name.trim(),
                    password,
                    targetRole,
                }),
            });
            const data = await res.json();
            if (data.success) {
                // Account created and session established -> go directly to dashboard
                window.location.href = '/dashboard';
            } else {
                setError(data.error || 'Account creation failed. Please try again.');
            }
        } catch {
            setError('Network error. Please check your connection.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background text-on-surface flex flex-col justify-center items-center p-6 relative">
            <div className="hero-glow" />

            <Link href="/" className="flex items-center gap-2 mb-6 z-10 hover:opacity-90 transition-opacity">
                <HireMeLogo size={46} subtitle="AI Job Assistant" />
            </Link>

            <div className="w-full max-w-md glass-card rounded-2xl p-8 z-10 border border-white/10 shadow-2xl">
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-extrabold text-white mb-1">Create Your Account</h2>
                    <p className="text-xs text-slate-400">Start matching your resume with top LinkedIn job postings</p>
                </div>

                {error && (
                    <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5 mb-5 text-xs text-red-400">
                        <span className="material-symbols-outlined text-sm">error</span>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-3.5">
                    <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Jordan Lee"
                            className="w-full bg-surface-container-high border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary-container transition-colors"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="jordan@example.com"
                            className="w-full bg-surface-container-high border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary-container transition-colors"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Target Role</label>
                        <select
                            value={targetRole}
                            onChange={(e) => setTargetRole(e.target.value)}
                            className="w-full bg-surface-container-high border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-primary-container transition-colors appearance-none"
                        >
                            {TARGET_ROLES.map((r) => (
                                <option key={r} value={r}>{r}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            minLength={6}
                            className="w-full bg-surface-container-high border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary-container transition-colors"
                            required
                        />
                        <p className="text-[10px] text-slate-500 mt-1">At least 6 characters</p>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-primary-container hover:bg-primary-container/90 disabled:opacity-60 text-white text-xs font-bold py-3 rounded-xl transition-all shadow-md shadow-indigo-500/25 active:scale-98 mt-2 flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Creating account…
                            </>
                        ) : (
                            <>
                                <span className="material-symbols-outlined text-sm">rocket_launch</span>
                                Create Free Account
                            </>
                        )}
                    </button>
                </form>

                <p className="text-center text-[10px] text-slate-500 mt-4">
                    By creating an account you agree to our{' '}
                    <span className="text-primary cursor-pointer">Terms of Service</span> and{' '}
                    <span className="text-primary cursor-pointer">Privacy Policy</span>.
                </p>

                <p className="text-center text-xs text-slate-400 mt-4">
                    Already have an account?{' '}
                    <Link href="/login" className="text-primary font-semibold hover:underline">
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
}
