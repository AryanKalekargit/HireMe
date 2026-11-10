import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { memoryStore } from '@/lib/memory-store';
import { PRESET_USERS } from '@/lib/auth-server';
import { connectToDatabase, isMongoConnected } from '@/lib/mongodb';
import { User, Profile } from '@/lib/models';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const email = (body.email || '').trim().toLowerCase();
        const password = body.password || '';

        if (!email || !email.includes('@')) {
            return NextResponse.json({ success: false, error: 'Valid email required' }, { status: 400 });
        }

        const conn = await connectToDatabase();
        const mongoState = mongoose.connection.readyState;
        const mongoErr = (global as any).__lastMongoError || null;

        let matchedUser: any = null;

        // 1. Check MongoDB Atlas first
        if (isMongoConnected()) {
            try {
                const dbUser = await User.findOne({ email });
                if (dbUser) {
                    // Check password if set
                    if (dbUser.passwordHash && dbUser.passwordHash !== password) {
                        return NextResponse.json(
                            { success: false, error: 'Incorrect password. Please try again.' },
                            { status: 401 }
                        );
                    }

                    // If user had no password set previously, save this password for them
                    if (!dbUser.passwordHash && password) {
                        try {
                            dbUser.passwordHash = password;
                            await dbUser.save();
                        } catch {}
                    }

                    matchedUser = {
                        userId: dbUser.clerkId || `user_${email.replace(/[^a-z0-9]/g, '_')}`,
                        email: dbUser.email,
                        name: dbUser.name,
                        role: dbUser.role || 'job_seeker',
                        imageUrl: dbUser.imageUrl,
                    };
                }
            } catch (err) {
                console.warn('[HireMe] MongoDB query error on login:', err);
            }
        }

        // 2. Check in memoryStore registered users if MongoDB was unreachable or empty
        if (!matchedUser) {
            const memoryUser = Array.from(memoryStore.users.values()).find((u) => u.email.toLowerCase() === email);
            if (memoryUser) {
                matchedUser = {
                    userId: memoryUser.userId,
                    email: memoryUser.email,
                    name: memoryUser.name,
                    role: memoryUser.role || 'job_seeker',
                    imageUrl: memoryUser.imageUrl,
                };
            }
        }

        // 3. Check preset users as demo fallback
        if (!matchedUser) {
            const preset = Object.values(PRESET_USERS).find((u) => u.email.toLowerCase() === email);
            if (preset) {
                matchedUser = {
                    userId: preset.userId,
                    email: preset.email,
                    name: preset.name,
                    role: preset.role,
                    imageUrl: preset.imageUrl,
                };
            }
        }

        if (!matchedUser) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Account not found. Please click Create account first to sign up.',
                    dbConnected: isMongoConnected(),
                    dbState: mongoose.connection.readyState,
                    dbError: (global as any).__lastMongoError || null
                },
                { status: 404 }
            );
        }

        // Ensure Profile exists in MongoDB Atlas
        if (isMongoConnected()) {
            try {
                await Profile.findOneAndUpdate(
                    { userId: matchedUser.userId },
                    {
                        $setOnInsert: {
                            userId: matchedUser.userId,
                            name: matchedUser.name,
                            email: matchedUser.email,
                            headline: `${matchedUser.name} - Software Engineer`,
                            targetRole: 'Software Engineer',
                            desiredSalary: '₹18,00,000 - ₹28,00,000',
                            bio: 'Experienced software professional.',
                            skills: [],
                            experienceLevel: 'Mid Level',
                            location: 'Bengaluru, India (Remote)',
                        },
                    },
                    { upsert: true, new: true }
                );
            } catch (profileErr) {
                console.warn('[HireMe] MongoDB profile creation warning:', profileErr);
            }
        }

        // Keep memoryStore synchronized
        memoryStore.getOrCreateProfile(matchedUser.userId, matchedUser.name, matchedUser.email);

        const sessionUser = {
            userId: matchedUser.userId,
            email: matchedUser.email,
            name: matchedUser.name,
            role: matchedUser.role || 'job_seeker',
            imageUrl: matchedUser.imageUrl,
        };

        const isSecure = process.env.NODE_ENV === 'production' || (req.headers.get('x-forwarded-proto') === 'https');
        const res = NextResponse.json({ success: true, user: sessionUser });
        res.cookies.set('hireme_session', encodeURIComponent(JSON.stringify(sessionUser)), {
            httpOnly: false,
            path: '/',
            sameSite: isSecure ? 'none' : 'lax',
            secure: isSecure,
            maxAge: 60 * 60 * 24 * 30,
        });

        return res;
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Login failed';
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
