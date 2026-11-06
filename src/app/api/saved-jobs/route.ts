import { NextResponse } from 'next/server';
import { connectToDatabase, isMongoConnected } from '@/lib/mongodb';
import { SavedJob, ActivityLog, Profile } from '@/lib/models';
import { getCurrentUserSession } from '@/lib/auth-server';
import { memoryStore, MockSavedJob } from '@/lib/memory-store';
import { extractAllJobMetadata } from '@/lib/metadata-extractor';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const { userId } = await getCurrentUserSession();
        await connectToDatabase();

        let savedJobs: any[] = [];
        let candidateExperienceLevel = 'Entry Level';

        if (isMongoConnected()) {
            try {
                const profile = await Profile.findOne({ userId });
                if (profile?.experienceLevel) {
                    candidateExperienceLevel = profile.experienceLevel;
                }

                const { JobAnalysis } = await import('@/lib/models');
                savedJobs = await SavedJob.find({ userId }).sort({ updatedAt: -1, createdAt: -1 });

                // Auto-sync any evaluations from JobAnalysis that are missing from SavedJob
                const dbAnalyses = await JobAnalysis.find({ userId }).sort({ createdAt: -1 });
                for (const ana of dbAnalyses) {
                    const alreadyPresent = savedJobs.some(
                        (sj) =>
                            sj.jobTitle.toLowerCase() === ana.jobTitle.toLowerCase() &&
                            sj.company.toLowerCase() === ana.company.toLowerCase()
                    );
                    if (!alreadyPresent) {
                        const isLinkedIn = ana.source === 'linkedin' || (typeof ana.url === 'string' && ana.url.includes('linkedin.com'));
                        const meta = extractAllJobMetadata(`${ana.jobTitle} at ${ana.company}`, candidateExperienceLevel, ana.jobTitle);
                        const newSJ = await SavedJob.create({
                            userId,
                            jobId: ana.jobId || `job_${Date.now()}`,
                            jobTitle: ana.jobTitle,
                            company: ana.company,
                            location: isLinkedIn ? 'LinkedIn Posting' : 'Remote / Hybrid',
                            hireScore: ana.hireScore || 75,
                            status: 'MATCHED',
                            url: ana.url || (isLinkedIn ? 'https://www.linkedin.com/jobs' : ''),
                            source: isLinkedIn ? 'linkedin' : 'direct',
                            contactEmail: ana.contactEmail || meta.contact.email,
                            contactPhone: ana.contactPhone || meta.contact.phone,
                            contactDisplay: ana.contactDisplay || meta.contact.displayString,
                            requiredExperience: ana.requiredExperience || meta.experience.requiredExperience,
                            experienceMatchStatus: ana.experienceMatchStatus || meta.experience.status,
                            experienceMatchMessage: ana.experienceMatchMessage || meta.experience.message,
                            employmentType: ana.employmentType || meta.employment.employmentType,
                            compensationType: ana.compensationType || meta.employment.compensationType,
                            compensation: ana.compensation || meta.employment.compensation,
                            description: `${ana.jobTitle} at ${ana.company}`,
                            notes: `--- JOB EVALUATION ---\nJob Title: ${ana.jobTitle}\nCompany: ${ana.company}\nMatch Score: ${ana.hireScore}%\nRole Type: ${ana.employmentType || meta.employment.employmentType}\n${meta.employment.displayString}\nMatched Skills: ${(ana.matchedSkills || []).join(', ') || 'None'}\nMissing Skills: ${(ana.missingSkills || []).join(', ') || 'None'}`,
                            salaryRange: meta.employment.displayString || 'Competitive',
                            appliedDate: ana.createdAt ? new Date(ana.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                        });
                        savedJobs.push(newSJ);
                    }
                }
            } catch (err) {
                console.warn('[HireMe] Saved jobs query failed on MongoDB:', err);
            }
        }

        if (!isMongoConnected() || savedJobs.length === 0) {
            savedJobs = memoryStore.savedJobs.filter((j) => j.userId === userId);
            const mockProfile = memoryStore.profiles.get(userId);
            if (mockProfile?.experienceLevel) {
                candidateExperienceLevel = mockProfile.experienceLevel;
            }
        }

        // Ensure all jobs have contact, experience and employment metadata populated
        const enrichedSavedJobs = savedJobs.map((job) => {
            const rawObj = typeof job.toObject === 'function' ? job.toObject() : { ...job };
            if (!rawObj.contactDisplay || !rawObj.experienceMatchStatus || !rawObj.employmentType) {
                const meta = extractAllJobMetadata(rawObj.description || rawObj.notes || '', candidateExperienceLevel, rawObj.jobTitle);
                return {
                    ...rawObj,
                    contactEmail: rawObj.contactEmail || meta.contact.email,
                    contactPhone: rawObj.contactPhone || meta.contact.phone,
                    contactDisplay: rawObj.contactDisplay || meta.contact.displayString,
                    requiredExperience: rawObj.requiredExperience || meta.experience.requiredExperience,
                    experienceMatchStatus: rawObj.experienceMatchStatus || meta.experience.status,
                    experienceMatchMessage: rawObj.experienceMatchMessage || meta.experience.message,
                    employmentType: rawObj.employmentType || meta.employment.employmentType,
                    compensationType: rawObj.compensationType || meta.employment.compensationType,
                    compensation: rawObj.compensation || meta.employment.compensation,
                    salaryRange: rawObj.salaryRange && rawObj.salaryRange !== 'Competitive' ? rawObj.salaryRange : meta.employment.displayString,
                };
            }
            return rawObj;
        });

        return NextResponse.json({
            success: true,
            savedJobs: enrichedSavedJobs,
            jobs: enrichedSavedJobs,
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Fetch failed';
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const { userId } = await getCurrentUserSession();
        const body = await req.json();
        const { jobId, jobTitle, company, location, hireScore, status, notes, description, url, source, salaryRange } = body;

        await connectToDatabase();

        const cleanJobId = jobId || `job_${Date.now()}`;
        const finalStatus = (status || 'MATCHED').toUpperCase();
        const cleanUrl = typeof url === 'string' ? url.trim() : '';
        const finalSource = source || (cleanUrl.includes('linkedin.com') ? 'linkedin' : 'direct');
        const cleanDesc = description || '';
        const meta = extractAllJobMetadata(cleanDesc || notes || '', 'Entry Level', jobTitle);

        const newRecord: MockSavedJob = {
            _id: `saved_${Date.now()}`,
            userId,
            jobId: cleanJobId,
            jobTitle: jobTitle || 'Software Engineer',
            company: company || 'Employer',
            location: location || (finalSource === 'linkedin' ? 'LinkedIn' : 'Remote / Hybrid'),
            hireScore: Number(hireScore) || 85,
            status: finalStatus as any,
            notes: notes || cleanDesc || '',
            description: cleanDesc,
            url: cleanUrl,
            source: finalSource,
            contactEmail: meta.contact.email,
            contactPhone: meta.contact.phone,
            contactDisplay: meta.contact.displayString,
            requiredExperience: meta.experience.requiredExperience,
            experienceMatchStatus: meta.experience.status,
            experienceMatchMessage: meta.experience.message,
            employmentType: meta.employment.employmentType,
            compensationType: meta.employment.compensationType,
            compensation: meta.employment.compensation,
            salaryRange: salaryRange && salaryRange !== '₹18,00,000 - ₹28,00,000' ? salaryRange : meta.employment.displayString,
            appliedDate: ['APPLIED', 'INTERVIEWING', 'OFFERED', 'OFFER'].includes(finalStatus)
                ? new Date().toISOString().split('T')[0]
                : '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        let savedJob: any = null;

        if (isMongoConnected()) {
            try {
                savedJob = await SavedJob.findOneAndUpdate(
                    { userId, jobId: cleanJobId },
                    { $set: newRecord },
                    { upsert: true, new: true }
                );

                await ActivityLog.create({
                    userId,
                    action: 'JOB_SAVED',
                    details: { jobTitle, company, hireScore, status: finalStatus, url: cleanUrl },
                });
            } catch (err) {
                console.warn('[HireMe] SavedJob write failed on MongoDB:', err);
            }
        }

        // Always update memory store
        const existingIdx = memoryStore.savedJobs.findIndex((j) => j.userId === userId && j.jobId === cleanJobId);
        if (existingIdx >= 0) {
            memoryStore.savedJobs[existingIdx] = { ...memoryStore.savedJobs[existingIdx], ...newRecord };
            newRecord._id = memoryStore.savedJobs[existingIdx]._id;
        } else {
            memoryStore.savedJobs.unshift(newRecord);
        }

        return NextResponse.json({
            success: true,
            savedJob: savedJob || newRecord,
            job: savedJob || newRecord,
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Save failed';
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
