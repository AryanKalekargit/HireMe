'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

export interface SessionUser {
    userId: string;
    email: string;
    name: string;
    role: string;
    imageUrl?: string;
}

interface SessionContextValue {
    user: SessionUser | null;
    loading: boolean;
    refresh: () => void;
    logout: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue>({
    user: null,
    loading: true,
    refresh: () => {},
    logout: async () => {},
});

function parseSessionCookie(): SessionUser | null {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(/(?:^|;\s*)hireme_session=([^;]+)/);
    if (!match) return null;
    try {
        const decoded = decodeURIComponent(match[1]);
        const parsed = JSON.parse(decoded);
        if (parsed?.userId && parsed?.email) return parsed as SessionUser;
    } catch {
        // ignore malformed cookie
    }
    return null;
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<SessionUser | null>(() => parseSessionCookie());
    const [loading, setLoading] = useState(true);

    const refresh = useCallback(async () => {
        try {
            const res = await fetch('/api/auth/me', { cache: 'no-store' });
            if (res.ok) {
                const data = await res.json();
                if (data.success && data.authenticated && data.user) {
                    setUser(data.user);
                    setLoading(false);
                    return;
                }
            }

            // Server invalidated session (e.g. server restart) or unauthenticated
            const cookieUser = parseSessionCookie();
            if (!cookieUser) {
                setUser(null);
            }
        } catch {
            const fallback = parseSessionCookie();
            if (fallback) setUser(fallback);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refresh();
    }, [refresh]);

    const logout = useCallback(async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
        } catch {
            // ensure logout even if fetch fails
        }
        // Clear cookie client-side as fallback
        document.cookie = 'hireme_session=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        setUser(null);
        window.location.href = '/login';
    }, []);

    return (
        <SessionContext.Provider value={{ user, loading, refresh, logout }}>
            {children}
        </SessionContext.Provider>
    );
}

export function useSession() {
    return useContext(SessionContext);
}

/** Returns just the initials from a display name */
export function getInitials(name: string): string {
    if (!name) return '??';
    return name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0].toUpperCase())
        .join('');
}
