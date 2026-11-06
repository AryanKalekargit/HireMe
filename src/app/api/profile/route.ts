import { NextResponse } from 'next/server';
import { connectToDatabase, isMongoConnected } from '@/lib/mongodb';
import { Profile, User, Resume } from '@/lib/models';
import { getCurrentUserSession } from '@/lib/auth-server';
import { memoryStore } from '@/lib/memory-store';
import { classifySkillsList, detectRoleDomain } from '@/lib/skill-dictionary';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const session = await getCurrentUserSession();
        const { userId, name: sessionName, email: sessionEmail } = session;
        await connectToDatabase();

        let profile: any = null;
        let dbUser: any = null;

        if (isMongoConnected()) {
            try {
                profile = await Profile.findOne({ userId });
                dbUser = await User.findOne({
                    $or: [{ clerkId: userId }, { email: sessionEmail.toLowerCase() }],
                });
            } catch (err) {
                console.warn('[HireMe] Profile query failed on MongoDB:', err);
            }
        }

        if (!profile) {
            profile = memoryStore.profiles.get(userId);
            if (!profile) {
                profile = memoryStore.getOrCreateProfile(userId, dbUser?.name || sessionName, dbUser?.email || sessionEmail);
            }
        }

        const profileObj = profile ? (typeof profile.toObject === 'function' ? profile.toObject() : { ...profile }) : {};
        const headlineName = profileObj.headline && profileObj.headline.includes(' - ')
            ? profileObj.headline.split(' - ')[0].trim()
            : '';

        const resolvedName = dbUser?.name || profileObj.name || headlineName || (sessionName !== 'Guest User' && sessionName !== 'Candidate' ? sessionName : '') || '';
        const resolvedEmail = dbUser?.email || profileObj.email || (sessionEmail !== 'guest@hireme.ai' ? sessionEmail : '') || '';

        // Ensure technicalSkills and softSkills are segregated and populated
        let technicalSkills: string[] = Array.isArray(profileObj.technicalSkills) ? profileObj.technicalSkills : [];
        let softSkills: string[] = Array.isArray(profileObj.softSkills) ? profileObj.softSkills : [];
        const rawSkills: string[] = Array.isArray(profileObj.skills) ? profileObj.skills : [];

        if (technicalSkills.length === 0 && softSkills.length === 0 && rawSkills.length > 0) {
            const classified = classifySkillsList(rawSkills);
            technicalSkills = classified.technicalSkills;
            softSkills = classified.softSkills;
        }

        const allCombinedSkills = Array.from(new Set([...technicalSkills, ...softSkills, ...rawSkills]));

        return NextResponse.json({
            success: true,
            profile: {
                ...profileObj,
                name: resolvedName,
                email: resolvedEmail,
                technicalSkills,
                softSkills,
                skills: allCombinedSkills,
                targetDomain: profileObj.targetDomain || detectRoleDomain(profileObj.targetRole || '').domain,
            },
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getCurrentUserSession();
        const { userId, name: sessionName, email: sessionEmail } = session;
        const body = await req.json();
        await connectToDatabase();

        const inputName = body.name || (body.headline && body.headline.includes(' - ') ? body.headline.split(' - ')[0].trim() : '') || sessionName;
        const targetRole = body.targetRole || body.targetJobTitle || 'Software Engineer';
        const userEmail = body.email || sessionEmail;

        // Process incoming skills
        let technicalSkills: string[] = Array.isArray(body.technicalSkills) ? body.technicalSkills : [];
        let softSkills: string[] = Array.isArray(body.softSkills) ? body.softSkills : [];

        // If client sent flat skills array, classify automatically
        if (technicalSkills.length === 0 && softSkills.length === 0 && Array.isArray(body.skills)) {
            const classified = classifySkillsList(body.skills);
            technicalSkills = classified.technicalSkills;
            softSkills = classified.softSkills;
        }

        const allSkills = Array.from(new Set([...technicalSkills, ...softSkills, ...(Array.isArray(body.skills) ? body.skills : [])]));
        const targetDomain = body.targetDomain || detectRoleDomain(`${targetRole} ${technicalSkills.join(' ')}`).domain;

        const updateData = {
            userId,
            name: inputName,
            email: userEmail,
            headline: `${inputName} - ${targetRole}`,
            targetRole,
            desiredSalary: body.desiredSalary || '₹18,00,000 - ₹28,00,000',
            bio: body.bio || 'Experienced software professional.',
            skills: allSkills,
            technicalSkills,
            softSkills,
            targetDomain,
            experienceLevel: body.experienceLevel || 'Mid Level',
            location: body.location || 'Bengaluru, India (Remote)',
            updatedAt: new Date().toISOString(),
        };

        let profile: any = null;

        if (isMongoConnected()) {
            try {
                // 1. Update Profile in MongoDB Atlas
                profile = await Profile.findOneAndUpdate(
                    { userId },
                    { $set: updateData },
                    { new: true, upsert: true }
                );

                // 2. Update User name in MongoDB Atlas
                if (inputName) {
                    await User.findOneAndUpdate(
                        { clerkId: userId },
                        { $set: { name: inputName } }
                    );
                }

                // 3. Silently keep user's active resume updated in MongoDB Atlas without them knowingly
                await Resume.findOneAndUpdate(
                    { userId, isPrimary: true },
                    {
                        $set: {
                            parsedSkills: allSkills,
                            parsedTechnicalSkills: technicalSkills,
                            parsedSoftSkills: softSkills,
                            updatedAt: new Date(),
                        },
                        $setOnInsert: {
                            userId,
                            fileName: `${inputName ? inputName.replace(/\s+/g, '_') : 'Candidate'}_Resume.pdf`,
                            rawText: `${inputName} - ${targetRole}. Technical Skills: ${technicalSkills.join(', ')}. Personality Skills: ${softSkills.join(', ')}`,
                            parsedSkills: allSkills,
                            parsedTechnicalSkills: technicalSkills,
                            parsedSoftSkills: softSkills,
                            isPrimary: true,
                        },
                    },
                    { upsert: true, new: true }
                );
            } catch (err) {
                console.warn('[HireMe] Profile update failed on MongoDB:', err);
            }
        }

        // Keep memory store in sync
        const existing = memoryStore.profiles.get(userId);
        const updatedMock = {
            _id: existing?._id || `prof_${Date.now()}`,
            ...updateData,
            createdAt: existing?.createdAt || new Date().toISOString(),
        };
        memoryStore.profiles.set(userId, updatedMock);

        return NextResponse.json({
            success: true,
            profile: {
                ...(profile ? (typeof profile.toObject === 'function' ? profile.toObject() : profile) : updatedMock),
                name: inputName,
                email: userEmail,
                technicalSkills,
                softSkills,
                skills: allSkills,
            },
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
