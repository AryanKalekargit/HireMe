'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HireMeLogo } from '@/components/common/HireMeLogo';

const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: 'dashboard' },
    { name: 'Profile & Resume', path: '/profile', icon: 'account_circle' },
    { name: 'Opportunity Tracker', path: '/tracker', icon: 'table_chart' },
    { name: 'Analytics & Insights', path: '/analytics', icon: 'insights' },
    { name: 'Settings', path: '/settings', icon: 'settings' },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="w-64 bg-surface-container-low border-r border-white/5 min-h-screen flex flex-col justify-between p-4 sticky top-0 shrink-0">
            <div>
                {/* Brand Logo */}
                <Link href="/dashboard" className="flex items-center px-3 py-4 mb-6 hover:opacity-90 transition-opacity">
                    <HireMeLogo size={38} subtitle="AI Job Assistant" />
                </Link>

                {/* Navigation Section */}
                <nav className="space-y-1">
                    <div className="px-3 pb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        Main Menu
                    </div>
                    {navItems.map((item) => {
                        const isActive = pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                href={item.path}
                                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${isActive
                                        ? 'bg-primary-container text-white shadow-md shadow-indigo-500/25'
                                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                <span
                                    className="material-symbols-outlined text-xl"
                                    style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
                                >
                                    {item.icon}
                                </span>
                                <span>{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>
            </div>

            {/* Extension Promo Badge */}
            <div className="glass-panel rounded-xl p-4 border border-white/10 mt-6 bg-gradient-to-br from-indigo-900/40 to-slate-900/60">
                <div className="flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-secondary text-xl">extension</span>
                    <span className="text-xs font-semibold text-white">LinkedIn Extension</span>
                </div>
                <p className="text-xs text-slate-400 mb-3">
                    Get real-time Hire Scores directly inside your LinkedIn job feed.
                </p>
                <Link
                    href="/settings"
                    className="w-full inline-flex items-center justify-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-medium py-2 rounded-lg transition-colors border border-white/10"
                >
                    <span className="material-symbols-outlined text-sm">settings_ethernet</span>
                    Extension Setup
                </Link>
            </div>
        </aside>
    );
}
