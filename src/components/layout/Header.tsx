'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession, getInitials } from '@/lib/session-context';

interface NotificationItem {
    id: string;
    title: string;
    description: string;
    type: 'match' | 'tracker' | 'resume' | 'info';
    timeAgo: string;
    url?: string;
}

export function Header({ title = 'Dashboard' }: { title?: string }) {
    const { user, loading, logout } = useSession();
    const [showNotification, setShowNotification] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [loadingNotifications, setLoadingNotifications] = useState(false);

    const displayName = user?.name ?? 'Candidate';
    const displayRole = user?.role === 'job_seeker' ? 'Job Seeker' : (user?.role ?? '');
    const initials = user ? getInitials(user.name) : '??';

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        setLoadingNotifications(true);
        try {
            const res = await fetch('/api/notifications');
            const data = await res.json();
            if (data.success && Array.isArray(data.notifications)) {
                setNotifications(data.notifications);
            }
        } catch (e) {
            console.error('Failed to load notifications:', e);
        } finally {
            setLoadingNotifications(false);
        }
    };

    return (
        <header className="h-16 bg-surface/80 backdrop-blur-xl border-b border-white/5 px-6 flex items-center justify-between sticky top-0 z-30">
            <div>
                <h2 className="text-xl font-bold text-on-surface tracking-tight">{title}</h2>
            </div>

            <div className="flex items-center gap-3.5">
                {/* Quick Analyze Button */}
                <Link
                    href="/dashboard#quick-analyze"
                    className="hidden sm:inline-flex items-center gap-1.5 bg-primary-container hover:bg-primary-container/90 text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition-all shadow-sm shadow-indigo-500/20 active:scale-95"
                >
                    <span className="material-symbols-outlined text-sm">auto_awesome</span>
                    Analyze Job
                </Link>

                {/* Real Notifications */}
                <div className="relative">
                    <button
                        onClick={() => {
                            setShowNotification(!showNotification);
                            setShowUserMenu(false);
                            if (!showNotification) fetchNotifications();
                        }}
                        className="w-9 h-9 rounded-xl bg-surface-container-high border border-white/5 flex items-center justify-center text-slate-300 hover:text-white transition-colors relative"
                        aria-label="View notifications"
                    >
                        <span className="material-symbols-outlined text-lg">notifications</span>
                        {notifications.length > 0 && (
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-secondary rounded-full ring-2 ring-background animate-pulse" />
                        )}
                    </button>

                    {showNotification && (
                        <div className="absolute right-0 mt-2 w-80 glass-card rounded-2xl p-4 shadow-2xl z-50 border border-white/10">
                            <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-3">
                                <span className="text-xs font-bold text-white">Live Activity Notifications</span>
                                <span
                                    onClick={fetchNotifications}
                                    className="text-[10px] text-primary hover:underline cursor-pointer"
                                >
                                    Refresh
                                </span>
                            </div>

                            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                                {loadingNotifications ? (
                                    <div className="text-center py-6 text-xs text-slate-400">Loading activity…</div>
                                ) : notifications.length > 0 ? (
                                    notifications.map((item) => (
                                        <Link
                                            key={item.id}
                                            href={item.url || '/dashboard'}
                                            onClick={() => setShowNotification(false)}
                                            className="flex items-start gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors group"
                                        >
                                            <div
                                                className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs shrink-0 ${
                                                    item.type === 'match'
                                                        ? 'bg-secondary/10 border border-secondary/20 text-secondary'
                                                        : item.type === 'tracker'
                                                        ? 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-400'
                                                        : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                                                }`}
                                            >
                                                <span className="material-symbols-outlined text-sm">
                                                    {item.type === 'match'
                                                        ? 'auto_awesome'
                                                        : item.type === 'tracker'
                                                        ? 'table_chart'
                                                        : 'description'}
                                                </span>
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center justify-between gap-1">
                                                    <p className="text-xs text-white font-semibold truncate group-hover:text-primary transition-colors">
                                                        {item.title}
                                                    </p>
                                                    <span className="text-[9px] text-slate-500 shrink-0">{item.timeAgo}</span>
                                                </div>
                                                <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">{item.description}</p>
                                            </div>
                                        </Link>
                                    ))
                                ) : (
                                    <div className="text-center py-6 text-xs text-slate-500">
                                        No activity yet. Analyze a job to see real-time updates!
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* User Profile / Account Menu */}
                <div className="relative">
                    <button
                        onClick={() => { setShowUserMenu(!showUserMenu); setShowNotification(false); }}
                        className="flex items-center gap-2.5 pl-2 border-l border-white/10 hover:opacity-80 transition-opacity"
                    >
                        {/* Avatar */}
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-teal-400 p-0.5 shadow-md">
                            {user?.imageUrl ? (
                                <img
                                    src={user.imageUrl}
                                    alt={displayName}
                                    className="w-full h-full rounded-full object-cover"
                                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                />
                            ) : (
                                <div className="w-full h-full rounded-full bg-surface-container flex items-center justify-center text-xs font-bold text-white">
                                    {loading ? '…' : initials}
                                </div>
                            )}
                        </div>
                        <div className="hidden lg:block text-left">
                            <div className="text-xs font-semibold text-on-surface leading-tight">{displayName}</div>
                            <div className="text-[10px] text-slate-400 leading-tight">{user?.email || displayRole}</div>
                        </div>
                        <span className="material-symbols-outlined text-sm text-slate-400 hidden lg:block">expand_more</span>
                    </button>

                    {/* User Dropdown */}
                    {showUserMenu && (
                        <div className="absolute right-0 mt-2 w-56 glass-card rounded-2xl p-2 shadow-2xl z-50 border border-white/10">
                            {/* User info */}
                            <div className="px-3 py-2.5 border-b border-white/5 mb-1">
                                <div className="text-xs font-bold text-white truncate">{displayName}</div>
                                <div className="text-[10px] text-slate-400 truncate">{user?.email}</div>
                            </div>

                            <Link
                                href="/profile"
                                onClick={() => setShowUserMenu(false)}
                                className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-white/5 text-xs text-slate-300 hover:text-white transition-colors"
                            >
                                <span className="material-symbols-outlined text-sm">account_circle</span>
                                My Profile
                            </Link>
                            <Link
                                href="/settings"
                                onClick={() => setShowUserMenu(false)}
                                className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-white/5 text-xs text-slate-300 hover:text-white transition-colors"
                            >
                                <span className="material-symbols-outlined text-sm">settings</span>
                                Settings
                            </Link>

                            <div className="border-t border-white/5 mt-1 pt-1">
                                <button
                                    onClick={() => { setShowUserMenu(false); logout(); }}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-red-500/10 text-xs text-red-400 hover:text-red-300 transition-colors"
                                >
                                    <span className="material-symbols-outlined text-sm">logout</span>
                                    Sign Out
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
