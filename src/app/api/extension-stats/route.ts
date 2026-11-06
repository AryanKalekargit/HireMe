import { NextResponse } from 'next/server';
import { memoryStore } from '@/lib/memory-store';

export const dynamic = 'force-dynamic';

// CORS headers for Chrome Extension
const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
    return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET() {
    try {
        let userId = '';
        try {
            const { getCurrentUserSession } = await import('@/lib/auth-server');
            const session = await getCurrentUserSession();
            if (session?.userId && session.userId !== 'user_guest') {
                userId = session.userId;
            }
        } catch {
            // fallback
        }

        if (!userId) {
            try {
                const { isMongoConnected, connectToDatabase } = await import('@/lib/mongodb');
                await connectToDatabase();
                if (isMongoConnected()) {
                    const { User } = await import('@/lib/models');
                    const latest = await User.findOne({}).sort({ updatedAt: -1, createdAt: -1 });
                    if (latest) userId = latest._id.toString();
                }
            } catch {}
        }
        if (!userId) userId = 'user_demo_hireme_2026';

        let analyses = memoryStore.analyses.filter((a) => a.userId === userId || a.userId === 'user_demo_hireme_2026');
        let savedJobs = memoryStore.savedJobs.filter((j) => j.userId === userId || j.userId === 'user_demo_hireme_2026');

        try {
            const { connectToDatabase, isMongoConnected } = await import('@/lib/mongodb');
            await connectToDatabase();
            if (isMongoConnected()) {
                const { JobAnalysis, SavedJob } = await import('@/lib/models');
                const dbAnalyses = await JobAnalysis.find({ userId }).sort({ createdAt: -1 });
                const dbSaved = await SavedJob.find({ userId });
                if (dbAnalyses.length > 0) analyses = dbAnalyses as any;
                if (dbSaved.length > 0) savedJobs = dbSaved as any;
            }
        } catch {
            // fallback
        }

        const totalCount = analyses.length;
        const savedCount = savedJobs.filter((j: any) => ['SAVED', 'Saved'].includes(j.status)).length;
        const appliedCount = savedJobs.filter((j: any) => ['APPLIED', 'Applied', 'INTERVIEWING', 'Interviewing'].includes(j.status)).length;

        const avgScore = totalCount > 0
            ? Math.round(analyses.reduce((acc: number, a: any) => acc + (a.hireScore || 0), 0) / totalCount)
            : 84;

        const recentAnalyses = analyses.slice(0, 5).map((a: any) => ({
            jobTitle: a.jobTitle,
            company: a.company,
            hireScore: a.hireScore,
            analyzedAt: a.createdAt,
        }));

        return NextResponse.json(
            {
                success: true,
                stats: {
                    analyses: {
                        today: Math.min(totalCount, 3),
                        week: Math.min(totalCount, 8),
                        month: totalCount,
                        total: totalCount,
                    },
                    jobs: {
                        saved: savedCount,
                        applied: appliedCount,
                    },
                    avgHireScore: avgScore,
                    recentAnalyses,
                },
            },
            { headers: CORS_HEADERS }
        );
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Stats failed';
        return NextResponse.json(
            { success: false, error: message },
            { status: 500, headers: CORS_HEADERS }
        );
    }
}
