import { NextResponse } from 'next/server';
import { memoryStore } from '@/lib/memory-store';
import { connectToDatabase, isMongoConnected } from '@/lib/mongodb';
import { User, Profile } from '@/lib/models';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const email = (body.email || '').trim().toLowerCase();
        const name = (body.name || '').trim();
        const password = body.password || '';
        const targetRole = (body.targetRole || 'Full Stack Engineer').trim();

        if (!name) {
            return NextResponse.json({ success: false, error: 'Full name is required.' }, { status: 400 });
        }

        if (!email || !email.includes('@')) {
            return NextResponse.json({ success: false, error: 'A valid email address is required.' }, { status: 400 });
        }

        if (!password || password.length < 6) {
            return NextResponse.json({ success: false, error: 'Password must be at least 6 characters.' }, { status: 400 });
        }

        await connectToDatabase();

        // 1. Check if user already exists in MongoDB Atlas
        if (isMongoConnected()) {
            const existingInMongo = await User.findOne({ email });
            if (existingInMongo) {
                return NextResponse.json(
                    { success: false, error: 'An account with this email already exists. Please sign in.' },
                    { status: 409 }
                );
            }
        }

        // 2. Check if user exists in memoryStore
        const existingInMemory = Array.from(memoryStore.users.values()).find((u) => u.email.toLowerCase() === email);
        if (existingInMemory) {
            return NextResponse.json(
                { success: false, error: 'An account with this email already exists. Please sign in.' },
                { status: 409 }
            );
        }

        const userId = `user_${email.replace(/[^a-z0-9]/g, '_')}`;
        const imageUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=4f46e5&color=fff`;

        // 3. Save User directly in MongoDB Atlas
        if (isMongoConnected()) {
            try {
                await User.findOneAndUpdate(
                    { email },
                    {
                        $set: {
                            clerkId: userId,
                            email,
                            name,
                            passwordHash: password,
                            targetRole,
                            imageUrl,
                            role: 'job_seeker',
                        },
                    },
                    { upsert: true, new: true }
                );

                await Profile.findOneAndUpdate(
                    { userId },
                    {
                        $set: {
                            userId,
                            name,
                            email,
                            headline: `${name} - ${targetRole}`,
                            targetRole,
                            desiredSalary: '₹18,00,000 - ₹28,00,000',
                            bio: `Hello, I'm ${name}, targeting roles in ${targetRole}.`,
                            skills: [],
                            experienceLevel: 'Mid Level',
                            location: 'Bengaluru, India (Remote)',
                        },
                    },
                    { upsert: true, new: true }
                );
            } catch (mongoErr) {
                console.warn('[HireMe] MongoDB signup save warning:', mongoErr);
            }
        }

        // 4. Sync in memoryStore
        const newUser = {
            userId,
            email,
            name,
            passwordHash: password,
            targetRole,
            role: 'job_seeker',
            imageUrl,
            createdAt: new Date().toISOString(),
        };
        memoryStore.users.set(userId, newUser);

        memoryStore.profiles.set(userId, {
            _id: `prof_${Date.now()}`,
            userId,
            headline: `${name} - ${targetRole}`,
            targetRole,
            desiredSalary: '₹18,00,000 - ₹28,00,000',
            bio: `Hello, I'm ${name}, targeting roles in ${targetRole}.`,
            skills: [],
            experienceLevel: 'Mid Level',
            location: 'Bengaluru, India (Remote)',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        });

        const sessionUser = {
            userId,
            email,
            name,
            role: 'job_seeker',
            imageUrl,
        };

        const res = NextResponse.json({ success: true, user: sessionUser });
        res.cookies.set('hireme_session', encodeURIComponent(JSON.stringify(sessionUser)), {
            httpOnly: false,
            path: '/',
            sameSite: 'lax',
        });

        return res;
    } catch (error: unknown) {
        console.error('[HireMe Signup Error]:', error);
        const message = error instanceof Error ? error.message : 'Signup failed';
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
