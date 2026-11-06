import { NextResponse } from 'next/server';
import { getCurrentUserSession } from '@/lib/auth-server';
import { memoryStore } from '@/lib/memory-store';

export async function POST(req: Request) {
    try {
        const { userId } = await getCurrentUserSession();
        const body = await req.json();
        const message = body.message || body.prompt || '';
        const topic = (body.topic || body.mode || 'general').toLowerCase();
        const targetRole = body.targetRole || 'Senior Full Stack Engineer';

        let userSkills: string[] = [];

        try {
            const { connectToDatabase, isMongoConnected } = await import('@/lib/mongodb');
            await connectToDatabase();
            if (isMongoConnected()) {
                const { Profile, Resume } = await import('@/lib/models');
                const profile = await Profile.findOne({ userId });
                const resume = await Resume.findOne({ userId, isPrimary: true });
                userSkills = profile?.skills || resume?.parsedSkills || [];
            }
        } catch {
            // MongoDB fallback
        }

        if (userSkills.length === 0) {
            const mockProfile = memoryStore.profiles.get(userId) || memoryStore.profiles.get('user_demo_hireme_2026');
            userSkills = mockProfile?.skills || ['React', 'TypeScript', 'Next.js', 'Node.js', 'MongoDB', 'Docker', 'AWS', 'Tailwind CSS'];
        }

        const primarySkill = userSkills[0] || 'React';
        const secondarySkill = userSkills[1] || 'TypeScript';
        const thirdSkill = userSkills[2] || 'Next.js';
        const lower = message.toLowerCase();

        let reply = '';

        if (topic === 'interview' || lower.includes('interview') || lower.includes('question') || lower.includes('challenge')) {
            reply = `Here is an interview strategy tailored for **${targetRole}** specializing in **${primarySkill}**, **${secondarySkill}**, and **${thirdSkill}**:

### 🎯 Key Interview Challenge Breakdown
When answering behavioral or technical questions like *"Tell me about a complex technical challenge you solved"*, structure your story using the **STAR-L** framework:

1. **Situation**: Specify a high-traffic production system (e.g. 50,000+ daily active users) facing latency spikes or state desynchronization.
2. **Task**: You were tasked with optimizing API response times from 380ms down to sub-80ms while maintaining strict type safety across the stack.
3. **Action**:
   • Replaced waterfall data fetching with **Next.js Server Components** and edge caching.
   • Refactored database queries in **MongoDB**, adding compound indexes on \`userId\` and \`createdAt\`.
   • Implemented client-side optimistic UI updates using React query states.
4. **Result**: Latency dropped by **65%**, bundle size shrunk by **35%**, and API error rates fell to 0.02%.
5. **Learning**: Emphasize how you established automated regression benchmarks in CI/CD to prevent future regressions.

💡 *Would you like to practice a live mock Q&A for System Design or Coding next?*`;
        } else if (topic === 'resume' || topic === 'bullet' || lower.includes('bullet') || lower.includes('resume') || lower.includes('rewrite')) {
            reply = `Here are 3 optimized, high-impact resume bullet points tailored for **${targetRole}**:

• **Before:** *"Worked on React and Next.js frontend code and built API integrations."*
  **After:** *"Architected high-throughput frontend services with **${primarySkill}** and **${thirdSkill}**, reducing initial page load times by **42%** and boosting user engagement by 28% across 1.2M monthly sessions."*

• **Before:** *"Helped team with database performance and MongoDB queries."*
  **After:** *"Engineered scalable data access layers with **${secondarySkill}** and database connection pooling, slashing 99th-percentile query latency from **450ms to 65ms**."*

• **Before:** *"Maintained microservices and deployments."*
  **After:** *"Spearheaded CI/CD deployment pipelines using **Docker** and cloud microservices, cutting production release cycles from 3 days to under **15 minutes** with zero downtime."*

💡 *Tip: Put these in your primary experience section to immediately boost your ATS matching score!*`;
        } else if (topic === 'gap' || lower.includes('gap') || lower.includes('roadmap') || lower.includes('learn')) {
            reply = `Here is your **Accelerated 2-Week Skill Roadmap** to bridge requirements for top **${targetRole}** positions:

### 📅 Week 1: Cloud & Container Orchestration (Docker & Kubernetes)
• **Day 1-3:** Containerize full-stack apps with multi-stage Dockerfiles. Optimize image layers to under 120MB.
• **Day 4-7:** Deploy a local Kubernetes cluster using Minikube/k3s. Configure Deployments, Services, and Ingress routing with rolling zero-downtime updates.

### 📅 Week 2: Distributed Architecture & System Design
• **Day 8-10:** Implement asynchronous message queuing with Redis / Kafka to decouple write-heavy microservices.
• **Day 11-14:** Build an end-to-end telemetry pipeline (OpenTelemetry + structured logging) to monitor distributed traces.

🎯 *Completing these milestones will increase your HireMe match score across Tier-1 company postings by an estimated **+18%**.*`;
        } else if (topic === 'salary' || lower.includes('salary') || lower.includes('negotiat') || lower.includes('offer')) {
            reply = `Here is your **Salary Negotiation Playbook** for **${targetRole}**:

### 🗣️ Negotiation Script (Verbal / Email):
> *"Thank you so much for extending this offer. I am genuinely excited about the team's roadmap and the opportunity to lead initiatives in ${primarySkill} and architecture. Based on recent market data for senior engineering roles in this sector, as well as the specialized expertise I bring in high-scale systems, I was targeting a base compensation in the **₹28,00,000 - ₹35,00,000** range. If we can reach that figure, I would be thrilled to sign immediately."*

### 📌 Strategic Tips:
1. **Anchor with Market Benchmarks**: Cite Tier-1 Indian tech compensation for ${targetRole} roles.
2. **Expand the Whole Package**: If base salary has rigid bands, negotiate for an additional performance bonus or ₹3,00,000 joining bonus.
3. **Show Mutual Excitement**: Always reinforce that you want to close the deal and start contributing right away.`;
        } else {
            reply = `Hello! I've reviewed your profile and target role as **${targetRole}**.

${userSkills.length > 0 ? `You have strong foundations in **${userSkills.slice(0, 4).join(', ')}**.` : ''}

Here is how I can assist you right now:
1. 🎯 **Technical Preparation** – Tailored technical and system design practice questions.
2. 📝 **Resume Optimizer** – Turn generic duties into quantified achievements.
3. 📈 **Skill Strategy** – Step-by-step roadmap to qualify for top-tier Indian tech roles.
4. 💰 **Compensation Discussion** – Scripts and counter-offer strategies to maximize your total package.

What would you like to focus on?`;
        }

        return NextResponse.json({
            success: true,
            reply,
            suggestedPrompts: [
                'How can I improve my Hire Score for Senior roles?',
                'Give me top interview questions for Next.js and MongoDB.',
                'Which missing skills should I learn first?',
                'Help me negotiate a 15% higher base salary offer.',
            ],
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Chat failed';
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
