'use client';

import React from 'react';

interface HireMeLogoProps {
    size?: number;
    showText?: boolean;
    subtitle?: string;
    className?: string;
}

export function HireMeLogo({
    size = 36,
    showText = true,
    subtitle,
    className = '',
}: HireMeLogoProps) {
    return (
        <div className={`flex items-center gap-2.5 ${className}`}>
            <div
                style={{ width: size, height: size }}
                className="shrink-0 flex items-center justify-center transition-transform hover:scale-105"
            >
                <svg
                    viewBox="0 0 100 100"
                    width={size}
                    height={size}
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="drop-shadow-md"
                >
                    <defs>
                        <linearGradient id={`hm-grad-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#4F46E5" />
                            <stop offset="100%" stopColor="#8B5CF6" />
                        </linearGradient>
                    </defs>

                    {/* Gradient Squircle with Translucent Border */}
                    <rect
                        x="2"
                        y="2"
                        width="96"
                        height="96"
                        rx="24"
                        fill={`url(#hm-grad-${size})`}
                        stroke="rgba(255, 255, 255, 0.35)"
                        strokeWidth="2.5"
                    />

                    {/* Bold White 'H' Glyph */}
                    <rect x="23" y="24" width="15" height="52" rx="3.5" fill="#FFFFFF" />
                    <rect x="62" y="24" width="15" height="52" rx="3.5" fill="#FFFFFF" />
                    <rect x="36" y="43" width="28" height="14" rx="2.5" fill="#FFFFFF" />

                    {/* Glowing Cyan AI Sparkle with White Core */}
                    <path
                        d="M 78 9 Q 78 21 90 21 Q 78 21 78 33 Q 78 21 66 21 Q 78 21 78 9 Z"
                        fill="#38BDF8"
                    />
                    <circle cx="78" cy="21" r="2.8" fill="#FFFFFF" />
                </svg>
            </div>

            {showText && (
                <div className="flex flex-col justify-center leading-none select-none">
                    <span
                        className="font-extrabold text-white tracking-tight"
                        style={{ fontSize: Math.max(14, Math.round(size * 0.46)) }}
                    >
                        HireMe
                    </span>
                    {subtitle && (
                        <span className="text-[10px] text-primary font-semibold tracking-wide mt-0.5">
                            {subtitle}
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}

export default HireMeLogo;
