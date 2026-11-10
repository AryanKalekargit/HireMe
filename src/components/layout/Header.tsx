'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createPortal } from 'react-dom';
import { useSession, getInitials } from '@/lib/session-context';
import { HireMeLogo } from '@/components/common/HireMeLogo';
import { PwaInstallButton } from '@/components/common/PwaInstallButton';

interface NotificationItem {
    id: string;
    title: string;
    description: string;
    type: 'match' | 'tracker' | 'resume' | 'info';
    timeAgo: string;
    url?: string;
}

const mobileNavItems = [
    { name: 'Dashboard', path: '/dashboard', icon: 'dashboard' },
    { name: 'Profile & Resume', path: '/profile', icon: 'account_circle' },
    { name: 'Opportunity Tracker', path: '/tracker', icon: 'table_chart' },
    { name: 'AI Career Coach', path: '/career-coach', icon: 'smart_toy' },
    { name: 'Analytics & Insights', path: '/analytics', icon: 'insights' },
    { name: 'Settings', path: '/settings', icon: 'settings' },
];

export function Header({ title = 'Dashboard' }: { title?: string }) {
    const { user, loading, logout } = useSession();
    const pathname = usePathname();
    const [mounted, setMounted] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [showNotification, setShowNotification] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [loadingNotifications, setLoadingNotifications] = useState(false);

    const displayName = user?.name ?? 'Candidate';
    const displayRole = user?.role === 'job_seeker' ? 'Job Seeker' : (user?.role ?? '');
    const initials = user ? getInitials(user.name) : '??';

    useEffect(() => {
        setMounted(true);
        fetchNotifications();
    }, []);

    // Close mobile menu whenever pathname changes
    useEffect(() => {
        setMobileMenuOpen(false);
    }, [pathname]);

    // Prevent background scrolling while mobile drawer is open
    useEffect(() => {
        if (mobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [mobileMenuOpen]);

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
        <>
            <header className="h-16 bg-surface/80 backdrop-blur-xl border-b border-white/5 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
                {/* Left: Mobile Menu Trigger + Logo + Page Title */}
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                    {/* Mobile Menu Toggle Button (Corner Hamburger) - hidden on md+ */}
                    <button
                        type="button"
                        onClick={() => {
                            setMobileMenuOpen(!mobileMenuOpen);
                            setShowNotification(false);
                            setShowUserMenu(false);
                        }}
                        className="md:hidden w-9 h-9 rounded-xl bg-surface-container-high hover:bg-surface-container-highest border border-white/15 flex items-center justify-center text-white transition-all shrink-0 active:scale-95 shadow-sm"
                        aria-label="Toggle navigation menu"
                    >
                        <span className="material-symbols-outlined text-xl">
                            {mobileMenuOpen ? 'close' : 'menu'}
                        </span>
                    </button>

                    {/* Mobile HireMe icon - hidden on md+ */}
                    <Link href="/dashboard" className="md:hidden flex items-center shrink-0">
                        <HireMeLogo size={28} showText={false} />
                    </Link>

                    {/* Page Title */}
                    <h2 className="text-base sm:text-xl font-bold text-on-surface tracking-tight truncate max-w-[150px] xs:max-w-[200px] sm:max-w-none">
                        {title}
                    </h2>
                </div>

                <div className="flex items-center gap-2 sm:gap-3.5 shrink-0">
                    {/* Download Chrome Extension Button - DESKTOP ONLY (hidden on mobile) */}
                    <a
                        href="/hireme-extension.zip"
                        download="hireme-extension.zip"
                        className="hidden md:inline-flex items-center gap-1.5 bg-secondary/15 hover:bg-secondary/25 text-secondary border border-secondary/30 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all active:scale-95 shadow-sm"
                        title="Download Chrome Extension (v1.0.2)"
                    >
                        <span className="material-symbols-outlined text-sm">extension</span>
                        <span>Chrome Extension</span>
                    </a>

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
                                    href="/career-coach"
                                    onClick={() => setShowUserMenu(false)}
                                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-white/5 text-xs text-slate-300 hover:text-white transition-colors"
                                >
                                    <span className="material-symbols-outlined text-sm">smart_toy</span>
                                    AI Career Coach
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

            {/* Mobile Navigation Drawer: Rendered via Portal directly into document.body to avoid CSS containing-block traps */}
            {mounted && mobileMenuOpen && createPortal(
                <div className="fixed inset-0 z-[9999] md:hidden">
                    {/* Full-Screen Frosted Glass Backdrop across the entire viewport */}
                    <div
                        className="fixed inset-0 bg-[#030712]/85 backdrop-blur-xl transition-all duration-300"
                        onClick={() => setMobileMenuOpen(false)}
                        aria-hidden="true"
                    />

                    {/* Drawer Slide-Over Panel with Deep Contrast */}
                    <div className="fixed inset-y-0 left-0 w-80 max-w-[85vw] bg-gradient-to-b from-[#141b2e] via-[#0c1322] to-[#070e1d] border-r border-indigo-500/25 p-5 flex flex-col justify-between shadow-[0_0_60px_rgba(0,0,0,0.85)] z-[10000] ring-1 ring-white/10 animate-drawer-in overflow-y-auto">
                        <div>
                            {/* Brand Header & Close Button */}
                            <div className="flex items-center justify-between pb-4 mb-5 border-b border-white/10">
                                <Link
                                    href="/dashboard"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="hover:opacity-90 transition-opacity"
                                >
                                    <HireMeLogo size={34} subtitle="AI Job Assistant" />
                                </Link>
                                <button
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center text-white transition-all active:scale-95 shadow-sm"
                                    aria-label="Close Navigation Menu"
                                >
                                    <span className="material-symbols-outlined text-lg">close</span>
                                </button>
                            </div>

                            {/* Navigation Items with Strong Visual Contrast */}
                            <nav className="space-y-2">
                                <div className="px-1 pb-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                                    <span>Main Menu</span>
                                    <span className="text-[10px] text-indigo-400 font-medium">Fast Access</span>
                                </div>
                                {mobileNavItems.map((item) => {
                                    const isActive = pathname === item.path || (item.path === '/career-coach' && pathname === '/coach');
                                    return (
                                        <Link
                                            key={item.path}
                                            href={item.path}
                                            onClick={() => setMobileMenuOpen(false)}
                                            className={`group flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all border ${
                                                isActive
                                                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white border-indigo-400/40 shadow-lg shadow-indigo-600/30'
                                                    : 'text-slate-200 hover:text-white bg-surface-container-high/70 hover:bg-surface-container-high border-white/10 hover:border-indigo-400/30'
                                            }`}
                                        >
                                            <div
                                                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                                                    isActive
                                                        ? 'bg-white/20 text-white'
                                                        : 'bg-indigo-500/10 border border-indigo-500/20 text-primary group-hover:text-white group-hover:bg-indigo-500/20'
                                                }`}
                                            >
                                                <span
                                                    className="material-symbols-outlined text-lg"
                                                    style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
                                                >
                                                    {item.icon}
                                                </span>
                                            </div>
                                            <span className="flex-1 tracking-wide">{item.name}</span>
                                            {isActive ? (
                                                <span className="w-2 h-2 rounded-full bg-secondary shadow-sm shadow-secondary shrink-0 animate-pulse" />
                                            ) : (
                                                <span className="material-symbols-outlined text-sm text-slate-500 group-hover:text-slate-300 transition-colors">
                                                    chevron_right
                                                </span>
                                            )}
                                        </Link>
                                    );
                                })}
                            </nav>
                        </div>

                        {/* Drawer Footer: Install App + User Profile & Sign Out */}
                        <div className="space-y-3 pt-4 border-t border-white/10 mt-6">
                            <PwaInstallButton />

                            <div className="flex items-center justify-between p-3 rounded-xl bg-surface-container-high border border-white/10 shadow-inner">
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-teal-400 p-0.5 shrink-0 shadow-md">
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
                                    <div className="min-w-0">
                                        <div className="text-xs font-bold text-white truncate">{displayName}</div>
                                        <div className="text-[10px] text-slate-400 truncate">{user?.email || 'Logged in'}</div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        setMobileMenuOpen(false);
                                        logout();
                                    }}
                                    className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/20 transition-colors"
                                    title="Sign Out"
                                >
                                    <span className="material-symbols-outlined text-base">logout</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}
