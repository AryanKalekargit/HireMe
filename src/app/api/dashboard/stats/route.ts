import { NextResponse } from 'next/server';
import { connectToDatabase, isMongoConnected } from '@/lib/mongodb';
import { JobAnalysis, SavedJob, Resume, Profile } from '@/lib/models';
import { getCurrentUserSession } from '@/lib/auth-server';
import { memoryStore } from '@/lib/memory-store';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const { userId } = await getCurrentUserSession();
        await connectToDatabase();

        let analyses: any[] = [];
        let savedJobs: any[] = [];
        let resume: any = null;
        let profile: any = null;

        if (isMongoConnected()) {
            try {
                analyses = await JobAnalysis.find({ userId }).sort({ createdAt: -1 }).limit(30);
                savedJobs = await SavedJob.find({ userId }).sort({ updatedAt: -1, createdAt: -1 });
                resume = await Resume.findOne({ userId, isPrimary: true });
                profile = await Profile.findOne({ userId });
            } catch (err) {
                console.warn('[HireMe] MongoDB query failed, falling back to memoryStore:', err);
            }
        }

        // Fallback to memory store if Mongo is not connected or returned empty demo setup
        if (!isMongoConnected() || (!profile && analyses.length === 0)) {
            analyses = memoryStore.analyses.filter((a) => a.userId === userId);
            savedJobs = memoryStore.savedJobs.filter((j) => j.userId === userId);
            resume = memoryStore.resumes.find((r) => r.userId === userId && r.isPrimary);
            profile = memoryStore.profiles.get(userId);
        }

        const totalAnalyzed = analyses.length;

        const avgHireScore =
            totalAnalyzed > 0
                ? Math.round(analyses.reduce((acc: number, curr: any) => acc + (curr.hireScore || 0), 0) / totalAnalyzed)
                : (savedJobs.length > 0 ? Math.round(savedJobs.reduce((acc: number, curr: any) => acc + (curr.hireScore || 80), 0) / savedJobs.length) : 0);

        // Partition LinkedIn evaluations vs Direct JD evaluations
        const linkedinAnalyses = analyses.filter(
            (a: any) => a.source === 'linkedin' || (typeof a.url === 'string' && a.url.includes('linkedin.com'))
        );
        const directAnalyses = analyses.filter(
            (a: any) => !(a.source === 'linkedin' || (typeof a.url === 'string' && a.url.includes('linkedin.com')))
        );

        const linkedinAnalyzedCount = linkedinAnalyses.length;
        const directAnalyzedCount = directAnalyses.length;

        const linkedinAvgScore =
            linkedinAnalyzedCount > 0
                ? Math.round(linkedinAnalyses.reduce((acc: number, curr: any) => acc + (curr.hireScore || 0), 0) / linkedinAnalyzedCount)
                : 0;

        const directAvgScore =
            directAnalyzedCount > 0
                ? Math.round(directAnalyses.reduce((acc: number, curr: any) => acc + (curr.hireScore || 0), 0) / directAnalyzedCount)
                : 0;

        const savedJobsCount = savedJobs.filter((j: any) => ['SAVED', 'MATCHED'].includes((j.status || '').toUpperCase())).length;
        const appliedJobsCount = savedJobs.filter((j: any) => ['APPLIED', 'INTERVIEWING', 'OFFERED', 'OFFER'].includes((j.status || '').toUpperCase())).length;
        const interviewingCount = savedJobs.filter((j: any) => (j.status || '').toUpperCase() === 'INTERVIEWING').length;
        const highMatchCount = analyses.filter((a: any) => (a.hireScore || 0) >= 75).length;

        // Calculate top missing skills frequency
        const missingFreqMap: Record<string, number> = {};
        analyses.forEach((a: any) => {
            (a.missingSkills || []).forEach((skill: string) => {
                missingFreqMap[skill] = (missingFreqMap[skill] || 0) + 1;
            });
        });

        const missingSkillsFreq = Object.entries(missingFreqMap)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 8);

        // Profile top skills
        const userSkills: string[] = profile?.skills || resume?.parsedSkills || [];
        const topSkills = userSkills.slice(0, 8).map((name: string) => ({ name, count: 1 }));

        return NextResponse.json({
            success: true,
            stats: {
                totalAnalyzed,
                avgHireScore,
                highMatchCount,
                savedJobsCount,
                appliedJobsCount,
                interviewingCount,
                linkedinAnalyzedCount,
                directAnalyzedCount,
                linkedinAvgScore,
                directAvgScore,
                linkedinAnalyses,
                directAnalyses,
                topSkills,
                missingSkillsFreq,
                recentAnalyses: analyses,
                resumeStatus: {
                    uploaded: !!resume,
                    fileName: resume?.fileName || '',
                    skillsCount: userSkills.length,
                    lastUpdated: resume?.updatedAt || new Date().toISOString(),
                },
            },
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Stats failed';
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
