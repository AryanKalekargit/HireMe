import { cookies, headers } from 'next/headers';

export interface CurrentUserSession {
    userId: string;
    email: string;
    name: string;
    role: string;
    imageUrl?: string;
}

export const PRESET_USERS: Record<string, CurrentUserSession> = {
    user_alex_morgan: {
        userId: 'user_alex_morgan',
        email: 'alex.morgan@gmail.com',
        name: 'Alex Morgan',
        role: 'job_seeker',
        imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    },
    user_sarah_chen: {
        userId: 'user_sarah_chen',
        email: 'sarah.chen@gmail.com',
        name: 'Sarah Chen',
        role: 'job_seeker',
        imageUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&auto=format&fit=crop&q=80',
    },
    user_david_kim: {
        userId: 'user_david_kim',
        email: 'david.kim@gmail.com',
        name: 'David Kim',
        role: 'job_seeker',
        imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    },
};

export async function getCurrentUserSession(): Promise<CurrentUserSession> {
    try {
        // 1. Check for session cookie (Primary multi-user session mechanism)
        const cookieStore = cookies();
        const sessionCookie = cookieStore.get('hireme_session');

        if (sessionCookie?.value) {
            try {
                const parsed = JSON.parse(decodeURIComponent(sessionCookie.value));
                if (parsed && parsed.userId && parsed.email) {
                    return {
                        userId: parsed.userId,
                        email: parsed.email,
                        name: parsed.name || 'Candidate',
                        role: parsed.role || 'job_seeker',
                        imageUrl: parsed.imageUrl,
                    };
                }
            } catch {
                // not valid json, could be a simple userId
                if (PRESET_USERS[sessionCookie.value]) {
                    return PRESET_USERS[sessionCookie.value];
                }
            }
        }

        // 2. Check for Authorization or X-User-Id header (for extension or API calls)
        const headerList = headers();
        const customUserId = headerList.get('x-user-id');
        if (customUserId && PRESET_USERS[customUserId]) {
            return PRESET_USERS[customUserId];
        }

        // 3. Check Clerk keys if configured
        const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? '';
        const secretKey = process.env.CLERK_SECRET_KEY ?? '';
        const hasRealClerkKeys =
            publishableKey.startsWith('pk_') &&
            !publishableKey.includes('sample') &&
            secretKey.startsWith('sk_') &&
            !secretKey.includes('sample');

        if (hasRealClerkKeys) {
            try {
                const { auth } = await import('@clerk/nextjs/server');
                const { userId } = await auth();
                if (userId) {
                    return {
                        userId,
                        email: 'user@hireme.ai',
                        name: 'Candidate',
                        role: 'job_seeker',
                    };
                }
            } catch {
                // fall through
            }
        }
    } catch {
        // cookies() or headers() failed (e.g. outside request scope)
    }

    // Default fallback when session cookie is absent
    return {
        userId: 'user_guest',
        email: 'guest@hireme.ai',
        name: 'Guest User',
        role: 'job_seeker',
    };
}
