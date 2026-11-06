'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { HireMeLogo } from '@/components/common/HireMeLogo';

export default function LoginPage() {
    const router = useRouter();

    // Form state
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // ── Email / Password Login ─────────────────────────────────────────────
    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
            });
            const data = await res.json();
            if (data.success) {
                window.location.href = '/dashboard';
            } else {
                setError(data.error || 'Login failed. Please check your credentials.');
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

            {/* Brand Header */}
            <Link href="/" className="flex items-center gap-2 mb-8 z-10 hover:opacity-90 transition-opacity">
                <HireMeLogo size={46} subtitle="AI Job Assistant" />
            </Link>

            {/* Card */}
            <div className="w-full max-w-md glass-card rounded-2xl p-8 z-10 border border-white/10 shadow-2xl">
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-extrabold text-white mb-2">Welcome Back</h2>
                    <p className="text-xs text-slate-400">Sign in to your HireMe account to analyze and track jobs</p>
                </div>

                {/* Error banner */}
                {error && (
                    <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5 mb-5 text-xs text-red-400">
                        <span className="material-symbols-outlined text-sm">error</span>
                        {error}
                    </div>
                )}

                <form onSubmit={handleEmailLogin} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="name@example.com"
                            className="w-full bg-surface-container-high border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary-container transition-colors"
                            required
                        />
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-1.5">
                            <label className="text-xs font-semibold text-slate-300">Password</label>
                            <span className="text-[11px] text-primary cursor-pointer hover:underline">Forgot password?</span>
                        </div>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full bg-surface-container-high border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary-container transition-colors"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-primary-container hover:bg-primary-container/90 disabled:opacity-60 text-white text-xs font-bold py-3 rounded-xl transition-all shadow-md shadow-indigo-500/25 active:scale-98 mt-2 flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Signing in…
                            </>
                        ) : (
                            'Sign In to Dashboard'
                        )}
                    </button>
                </form>

                <div className="mt-6 pt-6 border-t border-white/10 text-center">
                    <p className="text-xs text-slate-400">
                        Don&apos;t have an account?{' '}
                        <Link href="/signup" className="text-primary font-semibold hover:underline">
                            Create account first
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
