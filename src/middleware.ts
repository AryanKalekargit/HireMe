import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const DASHBOARD_PREFIXES = ['/dashboard', '/profile', '/settings', '/analytics', '/tracker', '/coach', '/career-coach'];

function isProtectedRoute(pathname: string): boolean {
    return DASHBOARD_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(prefix + '/'));
}

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Always allow static files, Next.js internals, and API routes
    if (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/static') ||
        pathname.startsWith('/favicon') ||
        pathname.startsWith('/api/') ||
        pathname.includes('.')
    ) {
        return NextResponse.next();
    }

    const sessionCookie = request.cookies.get('hireme_session');
    let isLoggedIn = false;

    if (sessionCookie?.value) {
        try {
            const parsed = JSON.parse(decodeURIComponent(sessionCookie.value));
            if (parsed?.userId && parsed?.email) {
                isLoggedIn = true;
            }
        } catch {
            isLoggedIn = false;
        }
    }

    // Temporarily redirect Coach routes to Dashboard
    if (pathname === '/coach' || pathname.startsWith('/coach/') || pathname === '/career-coach' || pathname.startsWith('/career-coach/')) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // Protect dashboard routes — redirect unauthenticated users to /login
    if (isProtectedRoute(pathname) && !isLoggedIn) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
    }

    // DO NOT auto-redirect away from /login or /signup.
    // If the user visits or clicks "Sign In", always present the form so they can sign in or switch accounts.

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map)).*)',
    ],
};
