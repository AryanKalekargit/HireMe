import { NextResponse } from 'next/server';
import { connectToDatabase, isMongoConnected } from '@/lib/mongodb';
import { SavedJob, JobAnalysis, ActivityLog } from '@/lib/models';
import { getCurrentUserSession } from '@/lib/auth-server';
import { memoryStore } from '@/lib/memory-store';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
    return handleUpdate(req, params.id);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    return handleUpdate(req, params.id);
}

async function handleUpdate(req: Request, id: string) {
    try {
        const { userId } = await getCurrentUserSession();
        const body = await req.json();
        const { status, notes, hireScore, description } = body;

        await connectToDatabase();

        let updatedJob: any = null;

        if (isMongoConnected()) {
            try {
                updatedJob = await SavedJob.findOneAndUpdate(
                    { $or: [{ _id: id }, { jobId: id }], userId },
                    {
                        $set: {
                            ...(status ? { status } : {}),
                            ...(notes !== undefined ? { notes } : {}),
                            ...(hireScore ? { hireScore } : {}),
                            ...(description ? { description } : {}),
                        },
                    },
                    { new: true }
                );
            } catch (err) {
                console.warn('[HireMe] SavedJob update failed on MongoDB:', err);
            }
        }

        // Always update memory store
        const memoryJob = memoryStore.savedJobs.find((j) => (j._id === id || j.jobId === id) && j.userId === userId);
        if (memoryJob) {
            if (status) memoryJob.status = status;
            if (notes !== undefined) memoryJob.notes = notes;
            if (hireScore) memoryJob.hireScore = hireScore;
            if (description) memoryJob.description = description;
            memoryJob.updatedAt = new Date().toISOString();
            updatedJob = updatedJob || memoryJob;
        }

        return NextResponse.json({ success: true, savedJob: updatedJob, job: updatedJob });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Update failed';
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    try {
        const { userId } = await getCurrentUserSession();
        await connectToDatabase();

        let jobTitle = '';
        let company = '';
        let jobId = params.id;

        if (isMongoConnected()) {
            try {
                // 1. Locate the saved job first to get title & company for full cleanup
                const existingJob = await SavedJob.findOne({
                    $or: [{ _id: params.id }, { jobId: params.id }],
                    userId,
                });

                if (existingJob) {
                    jobTitle = existingJob.jobTitle;
                    company = existingJob.company;
                    jobId = existingJob.jobId || jobId;

                    // 2. Delete the SavedJob document
                    await SavedJob.deleteOne({ _id: existingJob._id, userId });

                    // 3. Purge corresponding JobAnalysis evaluations for this user & job
                    await JobAnalysis.deleteMany({
                        userId,
                        $or: [
                            { jobId },
                            { jobTitle, company },
                        ],
                    });

                    // 4. Purge corresponding activity logs
                    await ActivityLog.deleteMany({
                        userId,
                        $or: [
                            { 'details.jobTitle': jobTitle, 'details.company': company },
                            { 'details.jobId': jobId },
                        ],
                    });
                } else {
                    // Direct deletion fallback
                    await SavedJob.deleteOne({ _id: params.id, userId });
                }
            } catch (err) {
                console.warn('[HireMe] SavedJob delete error on MongoDB:', err);
            }
        }

        // 5. Clean up memory store completely for this user
        const memIdx = memoryStore.savedJobs.findIndex(
            (j) => (j._id === params.id || j.jobId === params.id) && j.userId === userId
        );
        if (memIdx >= 0) {
            const memJob = memoryStore.savedJobs[memIdx];
            jobTitle = jobTitle || memJob.jobTitle;
            company = company || memJob.company;
            jobId = jobId || memJob.jobId;
            memoryStore.savedJobs.splice(memIdx, 1);
        }

        if (jobTitle && company) {
            memoryStore.analyses = memoryStore.analyses.filter(
                (a) =>
                    !(
                        a.userId === userId &&
                        (a.jobId === jobId ||
                            (a.jobTitle.toLowerCase() === jobTitle.toLowerCase() &&
                                a.company.toLowerCase() === company.toLowerCase()))
                    )
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Opportunity and associated analyses permanently removed from profile.',
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Delete failed';
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
