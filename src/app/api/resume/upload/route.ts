import { NextResponse } from 'next/server';
import { connectToDatabase, isMongoConnected } from '@/lib/mongodb';
import { Resume, Profile } from '@/lib/models';
import { getCurrentUserSession } from '@/lib/auth-server';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { parseResumeBuffer } from '@/lib/resume-parser';
import { memoryStore, MockResume } from '@/lib/memory-store';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const { userId } = await getCurrentUserSession();
        const formData = await req.formData();
        const file = (formData.get('file') || formData.get('resume')) as File | null;

        if (!file) {
            return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // 1. Upload to Cloudinary (or local fallback in public/uploads/)
        const uploadRes = await uploadToCloudinary(buffer, file.name, 'hireme_resumes');

        // 2. Extract text & parse skills
        const parsedData = await parseResumeBuffer(buffer);

        await connectToDatabase();

        let resume: any = null;

        if (isMongoConnected()) {
            try {
                // Deactivate old primary resumes
                await Resume.updateMany({ userId }, { $set: { isPrimary: false } });

                // Save new resume permanently in MongoDB Atlas
                resume = await Resume.create({
                    userId,
                    fileName: file.name,
                    fileUrl: uploadRes.url || '',
                    fileBase64: buffer.toString('base64'),
                    fileSize: buffer.length,
                    fileType: file.type || 'application/pdf',
                    cloudinaryPublicId: uploadRes.publicId,
                    rawText: parsedData.rawText,
                    parsedSkills: parsedData.skills,
                    parsedTechnicalSkills: parsedData.technicalSkills,
                    parsedSoftSkills: parsedData.softSkills,
                    experience: parsedData.experience,
                    education: parsedData.education,
                    isPrimary: true,
                });

                // Auto-sync technical and personality development skills to Profile
                const existingProfile = await Profile.findOne({ userId });
                const existingTech = existingProfile?.technicalSkills || [];
                const existingSoft = existingProfile?.softSkills || [];
                const existingAll = existingProfile?.skills || [];

                const combinedTech = Array.from(new Set([...existingTech, ...parsedData.technicalSkills]));
                const combinedSoft = Array.from(new Set([...existingSoft, ...parsedData.softSkills]));
                const combinedAll = Array.from(new Set([...existingAll, ...combinedTech, ...combinedSoft, ...parsedData.skills]));

                await Profile.findOneAndUpdate(
                    { userId },
                    {
                        $set: {
                            skills: combinedAll,
                            technicalSkills: combinedTech,
                            softSkills: combinedSoft,
                        },
                    },
                    { upsert: true }
                );
            } catch (err) {
                console.warn('[HireMe] MongoDB resume write failed:', err);
            }
        }

        // Always update memory store
        const newMockResume: MockResume = {
            _id: `res_${Date.now()}`,
            userId,
            fileName: file.name,
            fileUrl: uploadRes.url,
            cloudinaryPublicId: uploadRes.publicId,
            rawText: parsedData.rawText,
            parsedSkills: parsedData.skills,
            parsedTechnicalSkills: parsedData.technicalSkills,
            parsedSoftSkills: parsedData.softSkills,
            experience: parsedData.experience,
            education: parsedData.education,
            isPrimary: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        memoryStore.resumes.forEach((r) => {
            if (r.userId === userId) r.isPrimary = false;
        });
        memoryStore.resumes.unshift(newMockResume);

        // Sync to mock profile
        const mockProfile = memoryStore.profiles.get(userId);
        if (mockProfile) {
            mockProfile.technicalSkills = Array.from(new Set([...(mockProfile.technicalSkills || []), ...parsedData.technicalSkills]));
            mockProfile.softSkills = Array.from(new Set([...(mockProfile.softSkills || []), ...parsedData.softSkills]));
            mockProfile.skills = Array.from(new Set([...(mockProfile.skills || []), ...mockProfile.technicalSkills, ...mockProfile.softSkills]));
            mockProfile.updatedAt = new Date().toISOString();
        }

        return NextResponse.json({
            success: true,
            resume: resume || newMockResume,
            parsedSkills: parsedData.skills,
            technicalSkills: parsedData.technicalSkills,
            softSkills: parsedData.softSkills,
            rawText: parsedData.rawText,
            message: 'Resume uploaded and parsed successfully!',
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Upload failed';
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}

export async function GET() {
    try {
        const { userId } = await getCurrentUserSession();
        await connectToDatabase();

        let resume: any = null;

        if (isMongoConnected()) {
            try {
                resume = await Resume.findOne({ userId, isPrimary: true }).sort({ createdAt: -1 });
            } catch (err) {
                console.warn('[HireMe] MongoDB resume fetch failed:', err);
            }
        }

        if (!resume) {
            resume = memoryStore.resumes.find((r) => r.userId === userId && r.isPrimary);
        }

        return NextResponse.json({ success: true, resume: resume || null });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Fetch failed';
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
