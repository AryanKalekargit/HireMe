import mongoose, { Schema, model, models } from 'mongoose';
import { IUser, IProfile, IResume, IJob, IJobAnalysis, ISavedJob, IActivityLog } from '@/types';

// User Schema
const UserSchema = new Schema<any>(
    {
        clerkId: { type: String, required: true, unique: true, index: true },
        email: { type: String, required: true, unique: true },
        name: { type: String, required: true },
        passwordHash: { type: String },
        targetRole: { type: String },
        imageUrl: { type: String },
        role: { type: String, enum: ['job_seeker', 'recruiter', 'admin'], default: 'job_seeker' },
    },
    { timestamps: true }
);

// Profile Schema
const ProfileSchema = new Schema<any>(
    {
        userId: { type: String, required: true, index: true },
        name: { type: String },
        email: { type: String },
        headline: { type: String, default: 'Software Engineer & Tech Professional' },
        targetRole: { type: String, default: 'Full Stack Engineer' },
        desiredSalary: { type: String, default: '₹18,00,000 - ₹28,00,000' },
        bio: { type: String, default: 'Passionate developer building scalable web applications.' },
        skills: { type: [String], default: [] },
        technicalSkills: { type: [String], default: [] },
        softSkills: { type: [String], default: [] },
        targetDomain: { type: String, default: 'fullstack' },
        experienceLevel: {
            type: String,
            enum: ['Entry Level', 'Mid Level', 'Senior Level', 'Lead / Management'],
            default: 'Mid Level',
        },
        location: { type: String, default: 'Bengaluru, India (Remote)' },
    },
    { timestamps: true }
);

// Resume Schema
const ResumeSchema = new Schema<any>(
    {
        userId: { type: String, required: true, index: true },
        fileName: { type: String, required: true },
        fileUrl: { type: String, required: false },
        fileBase64: { type: String },
        fileSize: { type: Number },
        fileType: { type: String, default: 'application/pdf' },
        cloudinaryPublicId: { type: String },
        rawText: { type: String, required: true },
        parsedSkills: { type: [String], default: [] },
        parsedTechnicalSkills: { type: [String], default: [] },
        parsedSoftSkills: { type: [String], default: [] },
        experience: [
            {
                title: String,
                company: String,
                duration: String,
                description: String,
            },
        ],
        education: [
            {
                degree: String,
                institution: String,
                year: String,
            },
        ],
        isPrimary: { type: Boolean, default: true },
    },
    { timestamps: true }
);

// Job Schema
const JobSchema = new Schema<IJob>(
    {
        title: { type: String, required: true },
        company: { type: String, required: true },
        location: { type: String, default: 'Remote / United States' },
        description: { type: String, required: true },
        url: { type: String },
        salaryRange: { type: String },
        companyLogo: { type: String },
    },
    { timestamps: true }
);

// JobAnalysis Schema
const JobAnalysisSchema = new Schema<IJobAnalysis>(
    {
        userId: { type: String, required: true, index: true },
        jobId: { type: String, required: true, index: true },
        jobTitle: { type: String, required: true },
        company: { type: String, required: true },
        hireScore: { type: Number, required: true },
        technicalScore: { type: Number, default: 0 },
        softScore: { type: Number, default: 0 },
        matchedSkills: { type: [String], default: [] },
        missingSkills: { type: [String], default: [] },
        matchedTechnicalSkills: { type: [String], default: [] },
        missingTechnicalSkills: { type: [String], default: [] },
        matchedSoftSkills: { type: [String], default: [] },
        missingSoftSkills: { type: [String], default: [] },
        bonusSkills: { type: [String], default: [] },
        detectedDomain: { type: String },
        contactEmail: { type: String },
        contactPhone: { type: String },
        contactDisplay: { type: String },
        requiredExperience: { type: String },
        experienceMatchStatus: { type: String },
        experienceMatchMessage: { type: String },
        employmentType: { type: String },
        compensationType: { type: String },
        compensation: { type: String },
        strengths: { type: [String], default: [] },
        recommendations: { type: [String], default: [] },
        url: { type: String },
        source: { type: String, default: 'direct' },
    },
    { timestamps: true }
);

// SavedJob Schema
const SavedJobSchema = new Schema<ISavedJob>(
    {
        userId: { type: String, required: true, index: true },
        jobId: { type: String, required: true },
        jobTitle: { type: String, required: true },
        company: { type: String, required: true },
        location: { type: String },
        hireScore: { type: Number, required: true },
        status: {
            type: String,
            enum: ['MATCHED', 'SAVED', 'APPLIED', 'INTERVIEWING', 'OFFERED', 'REJECTED'],
            default: 'MATCHED',
        },
        notes: { type: String },
        description: { type: String },
        url: { type: String },
        source: { type: String, default: 'direct' },
        contactEmail: { type: String },
        contactPhone: { type: String },
        contactDisplay: { type: String },
        requiredExperience: { type: String },
        experienceMatchStatus: { type: String },
        experienceMatchMessage: { type: String },
        employmentType: { type: String },
        compensationType: { type: String },
        compensation: { type: String },
        salaryRange: { type: String },
        appliedDate: { type: String },
    },
    { timestamps: true }
);

// ActivityLog Schema
const ActivityLogSchema = new Schema<IActivityLog>(
    {
        userId: { type: String, required: true, index: true },
        action: { type: String, required: true },
        details: { type: Schema.Types.Mixed },
    },
    { timestamps: true }
);

export const User = models.User || model<IUser>('User', UserSchema);
export const Profile = models.Profile || model<IProfile>('Profile', ProfileSchema);
export const Resume = models.Resume || model<IResume>('Resume', ResumeSchema);
export const Job = models.Job || model<IJob>('Job', JobSchema);
export const JobAnalysis = models.JobAnalysis || model<IJobAnalysis>('JobAnalysis', JobAnalysisSchema);
export const SavedJob = models.SavedJob || model<ISavedJob>('SavedJob', SavedJobSchema);
export const ActivityLog = models.ActivityLog || model<IActivityLog>('ActivityLog', ActivityLogSchema);
