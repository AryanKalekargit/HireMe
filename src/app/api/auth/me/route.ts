import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { connectToDatabase, isMongoConnected } from '@/lib/mongodb';
import { User, Profile } from '@/lib/models';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const cookieStore = cookies();
        const sessionCookie = cookieStore.get('hireme_session');

        if (!sessionCookie?.value) {
            return NextResponse.json({ success: false, authenticated: false, user: null }, { status: 401 });
        }

        let parsed: any = null;
        try {
            parsed = JSON.parse(decodeURIComponent(sessionCookie.value));
        } catch {
            // invalid cookie format
        }

        if (!parsed || !parsed.userId || !parsed.email) {
            const res = NextResponse.json({ success: false, authenticated: false, user: null }, { status: 401 });
            res.cookies.set('hireme_session', '', { maxAge: 0, path: '/' });
            return res;
        }

        // Fetch latest details from MongoDB Atlas
        await connectToDatabase();
        let dbUser = null;
        if (isMongoConnected()) {
            try {
                dbUser = await User.findOne({
                    $or: [{ email: parsed.email.toLowerCase() }, { clerkId: parsed.userId }],
                });
            } catch (err) {
                console.warn('[HireMe] MongoDB user lookup warning:', err);
            }
        }

        const activeUser = {
            userId: dbUser?.clerkId || parsed.userId,
            email: dbUser?.email || parsed.email,
            name: dbUser?.name || parsed.name || 'Candidate',
            role: dbUser?.role || parsed.role || 'job_seeker',
            imageUrl: dbUser?.imageUrl || parsed.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(dbUser?.name || parsed.name || 'User')}&background=4f46e5&color=fff`,
        };

        return NextResponse.json({
            success: true,
            authenticated: true,
            user: activeUser,
        });
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'Auth check failed';
        return NextResponse.json({ success: false, authenticated: false, error: msg }, { status: 500 });
    }
}
