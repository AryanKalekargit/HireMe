import { NextResponse } from 'next/server';
import { connectToDatabase, isMongoConnected } from '@/lib/mongodb';
import { ActivityLog, JobAnalysis, SavedJob, Resume } from '@/lib/models';
import { getCurrentUserSession } from '@/lib/auth-server';
import { memoryStore } from '@/lib/memory-store';

export const dynamic = 'force-dynamic';

function formatTimeAgo(isoString?: string): string {
    if (!isoString) return 'Recent';
    const diffMs = Date.now() - new Date(isoString).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days === 1) return 'Yesterday';
    return `${days}d ago`;
}

export async function GET() {
    try {
        const { userId } = await getCurrentUserSession();
        await connectToDatabase();

        interface NotificationItem {
            id: string;
            title: string;
            description: string;
            type: 'match' | 'tracker' | 'resume' | 'info';
            timeAgo: string;
            url?: string;
        }

        const notifications: NotificationItem[] = [];

        if (isMongoConnected()) {
            try {
                // 1. Fetch recent activity logs
                const logs = await ActivityLog.find({ userId }).sort({ createdAt: -1 }).limit(10);
                logs.forEach((log) => {
                    const d = (log.details || {}) as any;
                    if (log.action === 'LINKEDIN_JOB_EVALUATED') {
                        notifications.push({
                            id: log._id.toString(),
                            title: 'LinkedIn Job Evaluated',
                            description: `${d.jobTitle || 'Job'} at ${d.company || 'Employer'} • ${d.hireScore || 0}% match`,
                            type: 'match',
                            timeAgo: formatTimeAgo(log.createdAt?.toISOString()),
                            url: '/tracker',
                        });
                    } else if (log.action === 'JOB_MATCHED' || log.action === 'JOB_ANALYZED') {
                        notifications.push({
                            id: log._id.toString(),
                            title: 'Job Match Computed',
                            description: `${d.jobTitle || 'Job'} at ${d.company || 'Employer'} • ${d.hireScore || 0}% match`,
                            type: 'match',
                            timeAgo: formatTimeAgo(log.createdAt?.toISOString()),
                            url: '/tracker',
                        });
                    } else if (log.action === 'JOB_SAVED') {
                        notifications.push({
                            id: log._id.toString(),
                            title: 'Job Added to Tracker',
                            description: `${d.jobTitle || 'Job'} at ${d.company || 'Employer'} marked as ${d.status || 'Saved'}`,
                            type: 'tracker',
                            timeAgo: formatTimeAgo(log.createdAt?.toISOString()),
                            url: '/tracker',
                        });
                    }
                });

                // 2. Fetch primary resume for resume notification
                const resume = await Resume.findOne({ userId, isPrimary: true }).sort({ createdAt: -1 });
                if (resume) {
                    notifications.push({
                        id: `res_${resume._id}`,
                        title: 'Resume Synced & Active',
                        description: `${resume.fileName} • ${resume.parsedSkills?.length || 0} skills indexed`,
                        type: 'resume',
                        timeAgo: formatTimeAgo(resume.createdAt?.toISOString() || resume.updatedAt?.toISOString()),
                        url: '/profile',
                    });
                }
            } catch (err) {
                console.warn('[HireMe] MongoDB notifications query failed:', err);
            }
        }

        // Memory store fallback or supplementation
        if (notifications.length === 0) {
            const userAnalyses = memoryStore.analyses.filter((a) => a.userId === userId).slice(0, 5);
            userAnalyses.forEach((a) => {
                notifications.push({
                    id: a._id,
                    title: a.source === 'linkedin' ? 'LinkedIn Job Evaluated' : 'Job Match Computed',
                    description: `${a.jobTitle} at ${a.company} • ${a.hireScore}% match`,
                    type: 'match',
                    timeAgo: formatTimeAgo(a.createdAt),
                    url: '/tracker',
                });
            });

            const userJobs = memoryStore.savedJobs.filter((j) => j.userId === userId).slice(0, 5);
            userJobs.forEach((j) => {
                notifications.push({
                    id: j._id,
                    title: 'Tracker Opportunity',
                    description: `${j.jobTitle} at ${j.company} [${j.status}]`,
                    type: 'tracker',
                    timeAgo: formatTimeAgo(j.updatedAt || j.createdAt),
                    url: '/tracker',
                });
            });

            const userResume = memoryStore.resumes.find((r) => r.userId === userId && r.isPrimary);
            if (userResume) {
                notifications.push({
                    id: userResume._id,
                    title: 'Resume Active',
                    description: `${userResume.fileName} • ${userResume.parsedSkills.length} skills active`,
                    type: 'resume',
                    timeAgo: formatTimeAgo(userResume.createdAt),
                    url: '/profile',
                });
            }
        }

        return NextResponse.json({
            success: true,
            notifications: notifications.slice(0, 8),
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Notifications failed';
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
