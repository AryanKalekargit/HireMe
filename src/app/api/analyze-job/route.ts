import { NextResponse } from 'next/server';
import { analyzeJobMatch } from '@/lib/matching-engine';
import { memoryStore, MockJobAnalysis, MockSavedJob } from '@/lib/memory-store';

// CORS headers – allows the Chrome Extension (LinkedIn origin) to call this API
const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-user-id',
};

// Handle CORS preflight request from Chrome Extension
export async function OPTIONS() {
    return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

// Check if a job posting has already been evaluated by the currently logged-in user
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const queryUrl = (searchParams.get('url') || '').trim();
        const queryTitle = (searchParams.get('title') || searchParams.get('jobTitle') || '').trim();
        const queryCompany = (searchParams.get('company') || '').trim();
        const queryJobId = (searchParams.get('jobId') || '').trim();

        let activeUserId = '';

        // Check session cookie
        const cookieHeader = req.headers.get('cookie') || '';
        const match = cookieHeader.match(/(?:^|;\s*)hireme_session=([^;]+)/);
        if (match) {
            try {
                const parsed = JSON.parse(decodeURIComponent(match[1]));
                if (parsed?.userId) activeUserId = parsed.userId;
            } catch {}
        }

        const authHeader = req.headers.get('x-user-id');
        if (!activeUserId && authHeader) {
            activeUserId = authHeader;
        }

        if (!activeUserId) {
            try {
                const { getCurrentUserSession } = await import('@/lib/auth-server');
                const session = await getCurrentUserSession();
                if (session?.userId && session.userId !== 'user_guest') {
                    activeUserId = session.userId;
                }
            } catch {}
        }

        if (!activeUserId) {
            return NextResponse.json(
                { success: true, alreadyEvaluated: false, message: 'Unauthenticated' },
                { headers: CORS_HEADERS }
            );
        }

        let existingJob: any = null;
        let existingAnalysis: any = null;

        // Extract jobId from URL if present
        let extractedJobId = queryJobId;
        if (!extractedJobId && queryUrl) {
            const m = queryUrl.match(/(?:currentJobId=|\/jobs\/view\/)(\d+)/);
            if (m) extractedJobId = m[1];
        }

        // 1. Search in MongoDB for THIS activeUserId only
        try {
            const { connectToDatabase, isMongoConnected } = await import('@/lib/mongodb');
            await connectToDatabase();
            if (isMongoConnected()) {
                const { SavedJob, JobAnalysis } = await import('@/lib/models');

                const conditions: any[] = [];
                if (extractedJobId) {
                    conditions.push({ url: { $regex: extractedJobId } });
                    conditions.push({ jobId: extractedJobId });
                }
                if (queryUrl) {
                    conditions.push({ url: queryUrl });
                }
                if (queryTitle && queryCompany) {
                    conditions.push({
                        jobTitle: { $regex: new RegExp(`^${queryTitle}$`, 'i') },
                        company: { $regex: new RegExp(`^${queryCompany}$`, 'i') },
                    });
                }

                if (conditions.length > 0) {
                    existingJob = await SavedJob.findOne({
                        userId: activeUserId,
                        $or: conditions,
                    });

                    existingAnalysis = await JobAnalysis.findOne({
                        userId: activeUserId,
                        $or: conditions,
                    }).sort({ createdAt: -1 });
                }
            }
        } catch (dbErr) {
            console.warn('[HireMe] Check already evaluated MongoDB error:', dbErr);
        }

        // 2. Search in memoryStore for THIS activeUserId only
        if (!existingJob) {
            existingJob = memoryStore.savedJobs.find((j) => {
                if (j.userId !== activeUserId) return false;
                if (extractedJobId && j.url && j.url.includes(extractedJobId)) return true;
                if (queryUrl && j.url && j.url === queryUrl) return true;
                if (
                    queryTitle &&
                    queryCompany &&
                    j.jobTitle.toLowerCase() === queryTitle.toLowerCase() &&
                    j.company.toLowerCase() === queryCompany.toLowerCase()
                ) {
                    return true;
                }
                return false;
            });

            existingAnalysis = memoryStore.analyses.find((a) => {
                if (a.userId !== activeUserId) return false;
                if (extractedJobId && a.url && a.url.includes(extractedJobId)) return true;
                if (queryUrl && a.url && a.url === queryUrl) return true;
                if (
                    queryTitle &&
                    queryCompany &&
                    a.jobTitle.toLowerCase() === queryTitle.toLowerCase() &&
                    a.company.toLowerCase() === queryCompany.toLowerCase()
                ) {
                    return true;
                }
                return false;
            });
        }

        if (existingJob || existingAnalysis) {
            const hireScore = existingJob?.hireScore ?? existingAnalysis?.hireScore ?? 80;
            return NextResponse.json(
                {
                    success: true,
                    alreadyEvaluated: true,
                    userId: activeUserId,
                    existingEvaluation: {
                        jobTitle: existingJob?.jobTitle || existingAnalysis?.jobTitle || queryTitle,
                        company: existingJob?.company || existingAnalysis?.company || queryCompany,
                        hireScore,
                        status: existingJob?.status || 'MATCHED',
                        url: existingJob?.url || existingAnalysis?.url || queryUrl,
                        jobType: (existingJob as any)?.jobType || 'Full-time',
                        compensationType: (existingJob as any)?.compensationType || 'CTC',
                        compensation: (existingJob as any)?.compensation || existingJob?.salaryRange || '',
                        contactInfo: (existingJob as any)?.contactInfo || '',
                        matchedSkills: existingAnalysis?.matchedSkills || [],
                        missingSkills: existingAnalysis?.missingSkills || [],
                        evaluatedAt: existingJob?.updatedAt || existingJob?.createdAt || new Date().toISOString(),
                        notes: existingJob?.notes || existingJob?.description || '',
                    },
                },
                { headers: CORS_HEADERS }
            );
        }

        return NextResponse.json(
            { success: true, alreadyEvaluated: false, userId: activeUserId },
            { headers: CORS_HEADERS }
        );
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Check failed';
        return NextResponse.json({ success: false, error: message }, { status: 500, headers: CORS_HEADERS });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const rawTitle = body.title || body.jobTitle || '';
        const rawCompany = body.company || '';
        const rawDescription = body.description || body.jobDescription || '';
        const url = body.url;
        const source = body.source;
        const location = body.location;
        const salaryRange = body.salaryRange;

        const isLinkedIn = source === 'linkedin' || (typeof url === 'string' && url.includes('linkedin.com'));
        const finalSource: 'linkedin' | 'direct' = isLinkedIn ? 'linkedin' : 'direct';
        const cleanJobTitle = (rawTitle || (isLinkedIn ? 'LinkedIn Position' : 'Software Engineer')).trim();
        const cleanCompany = (rawCompany || (isLinkedIn ? 'Company on LinkedIn' : 'Tech Employer')).trim();
        const cleanUrl = typeof url === 'string' ? url.trim() : '';

        // Fallback description if LinkedIn DOM was slow or brief
        const description = (rawDescription && rawDescription.length >= 10)
            ? rawDescription
            : `${cleanJobTitle} at ${cleanCompany}. Required skills: Web Development, Frontend, Backend, JavaScript, TypeScript, React, HTML, CSS.`;

        let userSkills: string[] = Array.isArray(body.skills) ? body.skills : [];
        let userSoftSkills: string[] = Array.isArray(body.softSkills) ? body.softSkills : [];
        let resumeText = typeof body.resumeText === 'string' ? body.resumeText.trim() : '';
        let activeUserId = '';

        // Check incoming cookie or header on req
        const cookieHeader = req.headers.get('cookie') || '';
        const match = cookieHeader.match(/(?:^|;\s*)hireme_session=([^;]+)/);
        if (match) {
            try {
                const parsed = JSON.parse(decodeURIComponent(match[1]));
                if (parsed?.userId) activeUserId = parsed.userId;
            } catch {
                // fall through
            }
        }

        const authHeader = req.headers.get('x-user-id');
        if (!activeUserId && authHeader) {
            activeUserId = authHeader;
        }

        let candidateExperienceLevel = 'Entry Level';

        try {
            const { connectToDatabase, isMongoConnected } = await import('@/lib/mongodb');
            const { Resume, Profile } = await import('@/lib/models');
            const { getCurrentUserSession } = await import('@/lib/auth-server');

            await connectToDatabase();
            if (!activeUserId) {
                const session = await getCurrentUserSession();
                if (session?.userId) {
                    activeUserId = session.userId;
                }
            }

            if (isMongoConnected() && activeUserId) {
                const profile = await Profile.findOne({ userId: activeUserId });
                const resume = await Resume.findOne({ userId: activeUserId, isPrimary: true }).sort({ createdAt: -1 });

                if (profile?.experienceLevel) {
                    candidateExperienceLevel = profile.experienceLevel;
                }
                if (userSkills.length === 0) {
                    userSkills = profile?.technicalSkills?.length ? profile.technicalSkills : (profile?.skills || []);
                }
                if (userSoftSkills.length === 0) {
                    userSoftSkills = profile?.softSkills || resume?.parsedSoftSkills || [];
                }
                if (!resumeText) {
                    resumeText = resume?.rawText || [...userSkills, ...userSoftSkills].join(' ');
                }
            }
        } catch {
            // MongoDB unavailable or offline
        }

        if (!activeUserId || activeUserId === 'user_guest') {
            const { getCurrentUserSession } = await import('@/lib/auth-server');
            const session = await getCurrentUserSession();
            if (session?.userId && session.userId !== 'user_guest') {
                activeUserId = session.userId;
            } else {
                try {
                    const { isMongoConnected } = await import('@/lib/mongodb');
                    const { User } = await import('@/lib/models');
                    if (isMongoConnected()) {
                        const latestUser = await User.findOne({}).sort({ updatedAt: -1, createdAt: -1 });
                        if (latestUser) {
                            activeUserId = latestUser._id.toString();
                        }
                    }
                } catch {}
            }
            if (!activeUserId) activeUserId = 'user_guest';
        }

        // If userSkills empty, retrieve from memoryStore
        if (userSkills.length === 0) {
            const mockProfile = memoryStore.profiles.get(activeUserId);
            const mockResume = memoryStore.resumes.find((r) => r.userId === activeUserId && r.isPrimary);
            if (mockProfile?.experienceLevel) {
                candidateExperienceLevel = mockProfile.experienceLevel;
            }
            userSkills = mockProfile?.technicalSkills?.length ? mockProfile.technicalSkills : (mockProfile?.skills || mockResume?.parsedSkills || []);
            userSoftSkills = mockProfile?.softSkills || mockResume?.parsedSoftSkills || [];
            if (!resumeText) {
                resumeText = mockResume?.rawText || [...userSkills, ...userSoftSkills].join(' ');
            }
        }

        // Run matching engine with Dual Skillsets + Contact Extraction + Experience Validity + Employment/Compensation
        const matchResult = analyzeJobMatch(description, resumeText, userSkills, userSoftSkills, candidateExperienceLevel, cleanJobTitle);

        const newAnalysisId = `ana_${Date.now()}`;
        const newJobId = `job_${Date.now()}`;

        const newAnalysisItem: MockJobAnalysis = {
            _id: newAnalysisId,
            userId: activeUserId,
            jobId: newJobId,
            jobTitle: cleanJobTitle,
            company: cleanCompany,
            hireScore: matchResult.hireScore,
            technicalScore: matchResult.technicalScore,
            softScore: matchResult.softScore,
            matchedSkills: matchResult.matchedSkills,
            missingSkills: matchResult.missingSkills,
            matchedTechnicalSkills: matchResult.matchedTechnicalSkills,
            missingTechnicalSkills: matchResult.missingTechnicalSkills,
            matchedSoftSkills: matchResult.matchedSoftSkills,
            missingSoftSkills: matchResult.missingSoftSkills,
            bonusSkills: matchResult.bonusSkills,
            detectedDomain: matchResult.detectedRoleDomain,
            contactEmail: matchResult.contact.email,
            contactPhone: matchResult.contact.phone,
            contactDisplay: matchResult.contact.displayString,
            requiredExperience: matchResult.experience.requiredExperience,
            experienceMatchStatus: matchResult.experience.status,
            experienceMatchMessage: matchResult.experience.message,
            employmentType: matchResult.employment.employmentType,
            compensationType: matchResult.employment.compensationType,
            compensation: matchResult.employment.compensation,
            strengths: matchResult.strengths,
            recommendations: matchResult.recommendations,
            url: cleanUrl,
            source: finalSource,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        // Always store in memoryStore analyses
        memoryStore.analyses.unshift(newAnalysisItem);

        // Auto-save to Opportunity Tracker with action "MATCHED", contact info, experience validity, employment type, and full JD
        const formattedNotes = `--- JOB DESCRIPTION ---\n${description}\n\n--- OPPORTUNITY TYPE & COMPENSATION ---\nRole Type: ${matchResult.employment.employmentType}\n${matchResult.employment.displayString}\n\n--- RECRUITER & COMPANY CONTACT ---\n${matchResult.contact.displayString}\n\n--- EXPERIENCE REQUIREMENT & VALIDITY ---\n${matchResult.experience.message}\n\n--- COMPATIBILITY ANALYSIS ---\nComposite Hire Score: ${matchResult.hireScore}%\nTechnical Competency Score: ${matchResult.technicalScore}%\nPersonality & Soft Skills Score: ${matchResult.softScore}%\nRole Track: ${matchResult.detectedRoleDomain}\n\n--- TECHNICAL SKILLS ---\nMatched: ${matchResult.matchedTechnicalSkills.join(', ') || 'None'}\nMissing: ${matchResult.missingTechnicalSkills.join(', ') || 'None'}\n\n--- PERSONALITY DEVELOPMENT SKILLS ---\nMatched: ${matchResult.matchedSoftSkills.join(', ') || 'None'}\nMissing: ${matchResult.missingSoftSkills.join(', ') || 'None'}`;

        const savedJobRecord: MockSavedJob = {
            _id: `saved_${Date.now()}`,
            userId: activeUserId,
            jobId: newJobId,
            jobTitle: cleanJobTitle,
            company: cleanCompany,
            location: location || (isLinkedIn ? 'LinkedIn Posting' : 'Remote / Hybrid'),
            hireScore: matchResult.hireScore,
            status: 'MATCHED',
            url: cleanUrl || (isLinkedIn ? 'https://www.linkedin.com/jobs' : ''),
            source: finalSource,
            contactEmail: matchResult.contact.email,
            contactPhone: matchResult.contact.phone,
            contactDisplay: matchResult.contact.displayString,
            requiredExperience: matchResult.experience.requiredExperience,
            experienceMatchStatus: matchResult.experience.status,
            experienceMatchMessage: matchResult.experience.message,
            employmentType: matchResult.employment.employmentType,
            compensationType: matchResult.employment.compensationType,
            compensation: matchResult.employment.compensation,
            salaryRange: matchResult.employment.displayString || salaryRange || 'Competitive',
            appliedDate: new Date().toISOString().split('T')[0],
            description: description,
            notes: formattedNotes,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        // Update memoryStore saved jobs
        const existingSavedIdx = memoryStore.savedJobs.findIndex(
            (j) => j.userId === activeUserId && j.jobTitle.toLowerCase() === cleanJobTitle.toLowerCase() && j.company.toLowerCase() === cleanCompany.toLowerCase()
        );
        if (existingSavedIdx >= 0) {
            memoryStore.savedJobs[existingSavedIdx] = {
                ...memoryStore.savedJobs[existingSavedIdx],
                hireScore: matchResult.hireScore,
                url: cleanUrl || memoryStore.savedJobs[existingSavedIdx].url,
                description: description || memoryStore.savedJobs[existingSavedIdx].description,
                notes: formattedNotes,
                source: finalSource,
                updatedAt: new Date().toISOString(),
            };
        } else {
            memoryStore.savedJobs.unshift(savedJobRecord);
        }

        // Try to persist to MongoDB if connected
        try {
            const { isMongoConnected } = await import('@/lib/mongodb');
            if (isMongoConnected()) {
                const { Job, JobAnalysis, SavedJob, ActivityLog } = await import('@/lib/models');
                let job = await Job.findOne({ title: cleanJobTitle, company: cleanCompany });
                if (!job) {
                    job = await Job.create({
                        title: cleanJobTitle,
                        company: cleanCompany,
                        location: location || (isLinkedIn ? 'LinkedIn' : 'Remote'),
                        description,
                        url: cleanUrl || (isLinkedIn ? 'https://www.linkedin.com/jobs' : ''),
                    });
                }

                await JobAnalysis.create({
                    userId: activeUserId,
                    jobId: job._id.toString(),
                    jobTitle: cleanJobTitle,
                    company: cleanCompany,
                    hireScore: matchResult.hireScore,
                    technicalScore: matchResult.technicalScore,
                    softScore: matchResult.softScore,
                    matchedSkills: matchResult.matchedSkills,
                    missingSkills: matchResult.missingSkills,
                    matchedTechnicalSkills: matchResult.matchedTechnicalSkills,
                    missingTechnicalSkills: matchResult.missingTechnicalSkills,
                    matchedSoftSkills: matchResult.matchedSoftSkills,
                    missingSoftSkills: matchResult.missingSoftSkills,
                    bonusSkills: matchResult.bonusSkills,
                    detectedDomain: matchResult.detectedRoleDomain,
                    contactEmail: matchResult.contact.email,
                    contactPhone: matchResult.contact.phone,
                    contactDisplay: matchResult.contact.displayString,
                    requiredExperience: matchResult.experience.requiredExperience,
                    experienceMatchStatus: matchResult.experience.status,
                    experienceMatchMessage: matchResult.experience.message,
                    employmentType: matchResult.employment.employmentType,
                    compensationType: matchResult.employment.compensationType,
                    compensation: matchResult.employment.compensation,
                    strengths: matchResult.strengths,
                    recommendations: matchResult.recommendations,
                    url: cleanUrl,
                    source: finalSource,
                });

                // Auto-upsert into SavedJob with MATCHED status, contact info, experience and full JD
                await SavedJob.findOneAndUpdate(
                    { userId: activeUserId, jobTitle: cleanJobTitle, company: cleanCompany },
                    {
                        $set: {
                            userId: activeUserId,
                            jobId: job._id.toString(),
                            jobTitle: cleanJobTitle,
                            company: cleanCompany,
                            location: location || (isLinkedIn ? 'LinkedIn' : 'Remote'),
                            hireScore: matchResult.hireScore,
                            status: 'MATCHED',
                            url: cleanUrl,
                            source: finalSource,
                            description: description,
                            notes: formattedNotes,
                            contactEmail: matchResult.contact.email,
                            contactPhone: matchResult.contact.phone,
                            contactDisplay: matchResult.contact.displayString,
                            requiredExperience: matchResult.experience.requiredExperience,
                            experienceMatchStatus: matchResult.experience.status,
                            experienceMatchMessage: matchResult.experience.message,
                            employmentType: matchResult.employment.employmentType,
                            compensationType: matchResult.employment.compensationType,
                            compensation: matchResult.employment.compensation,
                            salaryRange: savedJobRecord.salaryRange,
                            appliedDate: savedJobRecord.appliedDate,
                        },
                    },
                    { upsert: true, new: true }
                );

                await ActivityLog.create({
                    userId: activeUserId,
                    action: isLinkedIn ? 'LINKEDIN_JOB_EVALUATED' : 'JOB_MATCHED',
                    details: {
                        jobTitle: cleanJobTitle,
                        company: cleanCompany,
                        hireScore: matchResult.hireScore,
                        technicalScore: matchResult.technicalScore,
                        softScore: matchResult.softScore,
                        contact: matchResult.contact.displayString,
                        experienceRequirement: matchResult.experience.requiredExperience,
                        experienceStatus: matchResult.experience.status,
                        url: cleanUrl,
                        source: finalSource,
                    },
                });
            }
        } catch (dbErr) {
            console.warn('[HireMe] MongoDB auto-save error (continuing with memoryStore):', dbErr);
        }

        return NextResponse.json(
            {
                success: true,
                analysis: newAnalysisItem,
                savedJob: savedJobRecord,
                match: matchResult,
                contact: matchResult.contact,
                experience: matchResult.experience,
                employment: matchResult.employment,
                skillsBreakdown: {
                    matched: matchResult.matchedSkills,
                    missing: matchResult.missingSkills,
                    bonus: matchResult.bonusSkills,
                    technical: {
                        matched: matchResult.matchedTechnicalSkills,
                        missing: matchResult.missingTechnicalSkills,
                        score: matchResult.technicalScore,
                    },
                    soft: {
                        matched: matchResult.matchedSoftSkills,
                        missing: matchResult.missingSoftSkills,
                        score: matchResult.softScore,
                    },
                },
            },
            { headers: CORS_HEADERS }
        );
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Analysis failed';
        return NextResponse.json({ success: false, error: message }, { status: 500, headers: CORS_HEADERS });
    }
}
