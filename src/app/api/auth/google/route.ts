import { NextResponse } from 'next/server';
import { memoryStore } from '@/lib/memory-store';
import { PRESET_USERS } from '@/lib/auth-server';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const email = (body.email || '').trim().toLowerCase();
        const name = (body.name || 'Google User').trim();
        const imageUrl = body.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=4f46e5&color=fff`;
        const targetRole = body.targetRole || 'Software Engineer';

        if (!email || !email.includes('@')) {
            return NextResponse.json({ success: false, error: 'Valid email required' }, { status: 400 });
        }

        // Check if preset user matches by email
        let matchedUserId = Object.keys(PRESET_USERS).find((k) => PRESET_USERS[k].email.toLowerCase() === email);
        if (!matchedUserId) {
            matchedUserId = `user_${email.replace(/[^a-z0-9]/g, '_')}`;
        }

        const session = {
            userId: matchedUserId,
            email,
            name,
            role: 'job_seeker',
            imageUrl,
        };

        // Ensure profile exists in memory store
        memoryStore.getOrCreateProfile(matchedUserId, name, email, targetRole);

        // Try to sync with MongoDB if connected
        try {
            const { connectToDatabase, isMongoConnected } = await import('@/lib/mongodb');
            await connectToDatabase();
            if (isMongoConnected()) {
                const { User, Profile } = await import('@/lib/models');
                await User.findOneAndUpdate(
                    { email },
                    { $set: { clerkId: matchedUserId, email, name, imageUrl } },
                    { upsert: true, new: true }
                );
                await Profile.findOneAndUpdate(
                    { userId: matchedUserId },
                    {
                        $setOnInsert: {
                            userId: matchedUserId,
                            name,
                            email,
                            headline: `${name} - ${targetRole}`,
                            targetRole,
                            desiredSalary: '₹18,00,000 - ₹28,00,000',
                            skills: [],
                            experienceLevel: 'Mid Level',
                            location: 'Bengaluru, India (Remote)',
                        },
                    },
                    { upsert: true }
                );
            }
        } catch {
            // MongoDB fallback
        }

        // Set session cookie
        const isSecure = process.env.NODE_ENV === 'production' || (req.headers.get('x-forwarded-proto') === 'https');
        const res = NextResponse.json({ success: true, user: session });
        res.cookies.set('hireme_session', encodeURIComponent(JSON.stringify(session)), {
            httpOnly: false,
            path: '/',
            sameSite: isSecure ? 'none' : 'lax',
            secure: isSecure,
            maxAge: 60 * 60 * 24 * 30,
        });

        return res;
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Google authentication failed';
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
