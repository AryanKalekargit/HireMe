// Multi-Domain Technical & Personality Development Skill Dictionaries
// Comprehensive canonical alias mapping and fuzzy matching engine (>= 50% match threshold)

export const DOMAIN_ROLE_TITLES: Record<string, string> = {
    frontend: 'Frontend Engineer',
    backend: 'Backend Engineer',
    fullstack: 'Full Stack Engineer',
    database: 'Database & Data Engineer',
    cloud_devops: 'Cloud & DevOps / SRE',
    mobile: 'Mobile App Developer',
    ai_ml_data: 'AI / Machine Learning Engineer',
    cybersecurity: 'Cybersecurity Engineer',
    qa_testing: 'QA & Test Engineer',
    embedded_iot: 'Embedded Systems & IoT Engineer',
};

// 1. Technical Skill Dictionaries by Specialized Profile Domain
export const DOMAIN_TECH_SKILLS: Record<string, string[]> = {
    frontend: [
        'react', 'react.js', 'reactjs', 'next.js', 'nextjs', 'typescript', 'javascript',
        'vue', 'vue.js', 'vuejs', 'angular', 'angularjs', 'svelte', 'solid.js',
        'html', 'html5', 'css', 'css3', 'tailwind', 'tailwind css', 'sass', 'scss',
        'redux', 'redux toolkit', 'zustand', 'mobx', 'recoil',
        'graphql', 'apollo client', 'tanstack query', 'react query',
        'webpack', 'vite', 'rollup', 'babel', 'parcel',
        'responsive design', 'web accessibility', 'a11y', 'wcag',
        'jest', 'cypress', 'playwright', 'storybook', 'pwa', 'progressive web apps',
        'webassembly', 'wasm', 'material ui', 'mui', 'shadcn', 'chakra ui', 'radix ui'
    ],
    backend: [
        'node.js', 'nodejs', 'express', 'express.js', 'nest.js', 'nestjs',
        'python', 'django', 'fastapi', 'flask',
        'java', 'spring boot', 'spring', 'hibernate',
        'c#', '.net', 'asp.net', 'asp.net core', 'entity framework',
        'golang', 'go', 'ruby', 'ruby on rails', 'php', 'laravel', 'symfony',
        'rust', 'scala', 'elixir',
        'microservices', 'rest api', 'restful api', 'rest', 'grpc', 'graphql',
        'websocket', 'socket.io', 'serverless', 'aws lambda',
        'kafka', 'rabbitmq', 'redis pubsub', 'celery',
        'jwt', 'oauth', 'oauth2', 'sso', 'middleware', 'nginx', 'apache'
    ],
    fullstack: [
        'react', 'next.js', 'node.js', 'express', 'typescript', 'javascript',
        'mern stack', 'mean stack', 'full stack development', 'rest api',
        'graphql', 'postgresql', 'mongodb', 'docker', 'tailwind css',
        'prisma', 'trpc', 'authentication', 'ci/cd', 'git', 'github'
    ],
    database: [
        'mongodb', 'postgresql', 'postgres', 'mysql', 'mariadb', 'sqlite',
        'redis', 'dynamodb', 'cassandra', 'couchdb', 'neo4j',
        'elasticsearch', 'opensearch', 'supabase', 'firebase', 'firestore',
        'prisma', 'mongoose', 'typeorm', 'sqlalchemy',
        'snowflake', 'bigquery', 'clickhouse', 'redshift', 'amazon rds',
        'sql', 'nosql', 'database indexing', 'query optimization',
        'database migrations', 'acid transactions', 'data warehousing', 'etl'
    ],
    cloud_devops: [
        'aws', 'amazon web services', 'azure', 'microsoft azure', 'gcp', 'google cloud',
        'docker', 'containerization', 'kubernetes', 'k8s', 'helm',
        'terraform', 'infrastructure as code', 'iac', 'ansible', 'pulumi',
        'ci/cd', 'github actions', 'gitlab ci', 'jenkins', 'circleci', 'argocd',
        'nginx', 'cloudflare', 'vercel', 'netlify',
        'prometheus', 'grafana', 'datadog', 'elk stack', 'logstash', 'kibana',
        'linux', 'ubuntu', 'bash', 'shell scripting',
        'site reliability engineering', 'sre', 'devops'
    ],
    mobile: [
        'react native', 'flutter', 'dart', 'swift', 'swiftui', 'objective-c',
        'ios', 'ios development', 'kotlin', 'android', 'android development',
        'jetpack compose', 'xcode', 'android studio', 'expo',
        'mobile app development', 'cross platform development',
        'app store deployment', 'google play deployment', 'mobile ui'
    ],
    ai_ml_data: [
        'python', 'r', 'machine learning', 'ml', 'deep learning', 'dl',
        'artificial intelligence', 'ai', 'data science', 'neural networks',
        'cnn', 'rnn', 'transformers', 'llm', 'large language models', 'generative ai', 'genai',
        'openai', 'chatgpt', 'langchain', 'llamaindex', 'rag', 'retrieval augmented generation',
        'hugging face', 'pytorch', 'tensorflow', 'keras',
        'scikit-learn', 'pandas', 'numpy', 'scipy', 'matplotlib', 'seaborn',
        'opencv', 'computer vision', 'cv', 'nlp', 'natural language processing', 'bert',
        'vector databases', 'pinecone', 'chromadb', 'weaviate', 'milvus',
        'mlops', 'mlflow', 'spark', 'pyspark', 'hadoop', 'airflow', 'data analysis', 'data engineering'
    ],
    cybersecurity: [
        'cybersecurity', 'information security', 'infosec', 'ethical hacking',
        'penetration testing', 'pen testing', 'vulnerability assessment',
        'owasp', 'owasp top 10', 'network security', 'cryptography', 'pki', 'ssl/tls',
        'identity and access management', 'iam', 'zero trust',
        'siem', 'soc', 'splunk', 'wireshark', 'metasploit', 'burp suite',
        'firewall', 'ids/ips', 'incident response', 'cloud security',
        'compliance', 'gdpr', 'hipaa', 'soc 2', 'iso 27001'
    ],
    qa_testing: [
        'quality assurance', 'qa', 'software testing', 'test automation',
        'manual testing', 'unit testing', 'integration testing', 'end to end testing',
        'e2e testing', 'tdd', 'test driven development', 'bdd', 'behavior driven development',
        'jest', 'mocha', 'chai', 'cypress', 'selenium', 'selenium webdriver',
        'playwright', 'puppeteer', 'postman', 'soapui', 'jmeter',
        'performance testing', 'load testing', 'regression testing', 'testrail'
    ],
    embedded_iot: [
        'c', 'c++', 'embedded c', 'embedded systems', 'rust',
        'rtos', 'real time operating systems', 'freertos',
        'arm', 'arm cortex', 'firmware', 'firmware development',
        'microcontrollers', 'arduino', 'raspberry pi', 'esp32', 'stm32',
        'i2c', 'spi', 'uart', 'can bus', 'ble', 'bluetooth low energy',
        'zigbee', 'mqtt', 'iot', 'internet of things', 'pcb design'
    ],
};

// 2. Universal Personality Development & Soft Skills Dictionary
// Applied across ALL candidate profiles & job specifications
export const UNIVERSAL_SOFT_SKILLS: string[] = [
    'communication',
    'verbal communication',
    'written communication',
    'active listening',
    'presentation skills',
    'public speaking',
    'interpersonal skills',
    'team leadership',
    'leadership',
    'people management',
    'mentorship',
    'coaching',
    'collaboration',
    'teamwork',
    'cross-functional collaboration',
    'cross-functional team',
    'problem solving',
    'critical thinking',
    'analytical thinking',
    'decision making',
    'strategic thinking',
    'adaptability',
    'flexibility',
    'resilience',
    'growth mindset',
    'emotional intelligence',
    'empathy',
    'conflict resolution',
    'negotiation',
    'diplomacy',
    'time management',
    'prioritization',
    'multitasking',
    'organization',
    'ownership',
    'accountability',
    'work ethic',
    'self-motivation',
    'attention to detail',
    'creativity',
    'innovation',
    'stakeholder management',
    'client interaction',
    'agile mindset',
    'scrum',
    'stress management',
    'continuous learning',
];

// Flat lists for rapid lookups
export const ALL_TECH_SKILLS_FLAT = Array.from(
    new Set(Object.values(DOMAIN_TECH_SKILLS).flat())
);

export const ALL_SKILLS_FLAT = Array.from(
    new Set([...ALL_TECH_SKILLS_FLAT, ...UNIVERSAL_SOFT_SKILLS])
);

// 3. Comprehensive Canonical Aliases & Synonym Dictionary
// Solves: HTML5 <-> HTML, CSS3 <-> CSS, ML <-> Machine Learning, AI <-> Artificial Intelligence, etc.
export const CANONICAL_ALIASES: Record<string, string> = {
    // Frontend
    'html': 'html',
    'html5': 'html',
    'html 5': 'html',
    'xhtml': 'html',
    'css': 'css',
    'css3': 'css',
    'css 3': 'css',
    'js': 'javascript',
    'javascript': 'javascript',
    'ecmascript': 'javascript',
    'es6': 'javascript',
    'es2015': 'javascript',
    'ts': 'typescript',
    'typescript': 'typescript',
    'react': 'react',
    'reactjs': 'react',
    'react.js': 'react',
    'react js': 'react',
    'next': 'next.js',
    'nextjs': 'next.js',
    'next.js': 'next.js',
    'vue': 'vue',
    'vuejs': 'vue',
    'vue.js': 'vue',
    'angular': 'angular',
    'angularjs': 'angular',
    'angular.js': 'angular',
    'tailwind': 'tailwind css',
    'tailwindcss': 'tailwind css',
    'tailwind css': 'tailwind css',
    'sass': 'sass',
    'scss': 'sass',
    'redux toolkit': 'redux',
    'rtk': 'redux',
    'pwa': 'progressive web apps',
    'progressive web app': 'progressive web apps',
    'progressive web apps': 'progressive web apps',
    'a11y': 'web accessibility',
    'accessibility': 'web accessibility',
    'web accessibility': 'web accessibility',
    'wcag': 'web accessibility',
    'wasm': 'webassembly',
    'webassembly': 'webassembly',
    'mui': 'material ui',
    'material-ui': 'material ui',
    'material ui': 'material ui',

    // Backend & Languages
    'node': 'node.js',
    'nodejs': 'node.js',
    'node.js': 'node.js',
    'express': 'express',
    'expressjs': 'express',
    'express.js': 'express',
    'nest': 'nest.js',
    'nestjs': 'nest.js',
    'nest.js': 'nest.js',
    'py': 'python',
    'python': 'python',
    'python3': 'python',
    'fastapi': 'fastapi',
    'fast api': 'fastapi',
    'spring': 'spring boot',
    'spring boot': 'spring boot',
    'springboot': 'spring boot',
    'c#': 'c#',
    'csharp': 'c#',
    'c-sharp': 'c#',
    'c++': 'c++',
    'cpp': 'c++',
    'c plus plus': 'c++',
    '.net': '.net',
    'dotnet': '.net',
    'asp.net': '.net',
    'asp.net core': '.net',
    'go': 'go',
    'golang': 'go',
    'ruby on rails': 'ruby on rails',
    'rails': 'ruby on rails',
    'rest': 'rest api',
    'rest api': 'rest api',
    'restful': 'rest api',
    'restful api': 'rest api',
    'rest apis': 'rest api',
    'graphql': 'graphql',
    'gql': 'graphql',
    'grpc': 'grpc',
    'socket.io': 'websocket',
    'websockets': 'websocket',
    'websocket': 'websocket',

    // Databases
    'postgres': 'postgresql',
    'postgresql': 'postgresql',
    'psql': 'postgresql',
    'mongo': 'mongodb',
    'mongodb': 'mongodb',
    'mysql': 'mysql',
    'sqlite': 'sqlite',
    'redis': 'redis',
    'dynamo': 'dynamodb',
    'dynamodb': 'dynamodb',
    'elastic': 'elasticsearch',
    'elasticsearch': 'elasticsearch',

    // Cloud & DevOps
    'aws': 'aws',
    'amazon web services': 'aws',
    'amazon aws': 'aws',
    'gcp': 'gcp',
    'google cloud': 'gcp',
    'google cloud platform': 'gcp',
    'azure': 'azure',
    'microsoft azure': 'azure',
    'k8s': 'kubernetes',
    'kubernetes': 'kubernetes',
    'docker': 'docker',
    'containerization': 'docker',
    'terraform': 'terraform',
    'iac': 'infrastructure as code',
    'infrastructure as code': 'infrastructure as code',
    'ci/cd': 'ci/cd',
    'cicd': 'ci/cd',
    'continuous integration': 'ci/cd',
    'continuous deployment': 'ci/cd',
    'github actions': 'github actions',
    'sre': 'site reliability engineering',
    'site reliability engineering': 'site reliability engineering',
    'devops': 'devops',

    // Mobile
    'react-native': 'react native',
    'react native': 'react native',
    'flutter': 'flutter',
    'ios': 'ios',
    'android': 'android',

    // AI, ML & Data Science
    'ml': 'machine learning',
    'machine learning': 'machine learning',
    'machine-learning': 'machine learning',
    'ai': 'artificial intelligence',
    'artificial intelligence': 'artificial intelligence',
    'artificial-intelligence': 'artificial intelligence',
    'dl': 'deep learning',
    'deep learning': 'deep learning',
    'genai': 'generative ai',
    'generative ai': 'generative ai',
    'llm': 'large language models',
    'llms': 'large language models',
    'large language model': 'large language models',
    'large language models': 'large language models',
    'rag': 'retrieval augmented generation',
    'retrieval augmented generation': 'retrieval augmented generation',
    'nlp': 'natural language processing',
    'natural language processing': 'natural language processing',
    'cv': 'computer vision',
    'computer vision': 'computer vision',
    'pytorch': 'pytorch',
    'tensorflow': 'tensorflow',
    'tf': 'tensorflow',
    'scikit learn': 'scikit-learn',
    'scikit-learn': 'scikit-learn',
    'sklearn': 'scikit-learn',

    // QA & Testing
    'qa': 'quality assurance',
    'quality assurance': 'quality assurance',
    'unit test': 'unit testing',
    'unit tests': 'unit testing',
    'unit testing': 'unit testing',
    'integration test': 'integration testing',
    'integration tests': 'integration testing',
    'integration testing': 'integration testing',
    'e2e': 'end to end testing',
    'e2e testing': 'end to end testing',
    'end to end testing': 'end to end testing',
    'tdd': 'test driven development',
    'test driven development': 'test driven development',
    'bdd': 'behavior driven development',
    'behavior driven development': 'behavior driven development',

    // Universal Personality Development & Soft Skills
    'communication': 'communication',
    'written communication': 'communication',
    'verbal communication': 'communication',
    'comm skills': 'communication',
    'good communication': 'communication',
    'leadership': 'leadership',
    'team lead': 'leadership',
    'team leader': 'leadership',
    'team leadership': 'leadership',
    'people management': 'leadership',
    'collaboration': 'collaboration',
    'teamwork': 'collaboration',
    'team player': 'collaboration',
    'collaborative': 'collaboration',
    'cross functional collaboration': 'collaboration',
    'cross-functional collaboration': 'collaboration',
    'problem solving': 'problem solving',
    'problem-solving': 'problem solving',
    'problem solver': 'problem solving',
    'critical thinking': 'critical thinking',
    'critical thinker': 'critical thinking',
    'analytical thinking': 'critical thinking',
    'adaptability': 'adaptability',
    'adaptable': 'adaptability',
    'flexible': 'adaptability',
    'flexibility': 'adaptability',
    'emotional intelligence': 'emotional intelligence',
    'eq': 'emotional intelligence',
    'mentoring': 'mentorship',
    'mentorship': 'mentorship',
    'mentor': 'mentorship',
    'time management': 'time management',
    'time mgmt': 'time management',
    'prioritization': 'time management',
    'conflict resolution': 'conflict resolution',
    'ownership': 'ownership',
    'accountability': 'ownership',
    'agile': 'agile mindset',
    'scrum': 'agile mindset',
    'agile mindset': 'agile mindset',
    'agile methodologies': 'agile mindset',
};

// 4. Normalization and Canonical Form Resolution
export function normalizeSkillText(skill: string): string {
    return (skill || '')
        .toLowerCase()
        .trim()
        .replace(/[_\s]+/g, ' ')
        .replace(/[-]/g, ' ')
        .trim();
}

export function getCanonicalSkill(skill: string): string {
    if (!skill) return '';
    const clean = normalizeSkillText(skill);

    if (CANONICAL_ALIASES[clean]) {
        return CANONICAL_ALIASES[clean];
    }

    // Try without spaces/punctuation (e.g. 'reactjs' -> 'react', 'html5' -> 'html')
    const stripped = clean.replace(/[^a-z0-9#+.]/g, '');
    if (CANONICAL_ALIASES[stripped]) {
        return CANONICAL_ALIASES[stripped];
    }

    // Strip trailing version numbers (e.g., html5 -> html, css3 -> css, python3 -> python, angular14 -> angular)
    const versionMatch = clean.match(/^([a-z]+)\s*(\d+)$/);
    if (versionMatch) {
        const base = versionMatch[1];
        if (CANONICAL_ALIASES[base]) return CANONICAL_ALIASES[base];
    }

    return clean;
}

// 5. Fuzzy Match Engine with >= 50% Overlap Rule
// Solves: candidate written HTML5/CSS/ML/AI vs JD written HTML/CSS3/Machine Learning/Artificial Intelligence
export function isSkillFuzzyMatch(
    candidateSkill: string,
    jobSkill: string
): { matched: boolean; score: number } {
    if (!candidateSkill || !jobSkill) return { matched: false, score: 0 };

    const normCandidate = normalizeSkillText(candidateSkill);
    const normJob = normalizeSkillText(jobSkill);

    // Exact match
    if (normCandidate === normJob) {
        return { matched: true, score: 1.0 };
    }

    // 1. Canonical Alias Resolution (100% equivalence)
    const canonCandidate = getCanonicalSkill(candidateSkill);
    const canonJob = getCanonicalSkill(jobSkill);

    if (canonCandidate && canonJob && canonCandidate === canonJob) {
        return { matched: true, score: 1.0 };
    }

    // 2. Trailing Version Number Check (HTML5 vs HTML, CSS3 vs CSS)
    const stripVersion = (s: string) => s.replace(/\s*\d+(\.\d+)*$/, '').trim();
    if (stripVersion(normCandidate) === stripVersion(normJob)) {
        return { matched: true, score: 0.95 };
    }

    // 3. Word Token Overlap (50%+ Match Rule)
    const stopWords = new Set(['and', 'or', 'in', 'of', 'for', 'the', 'a', 'an', 'to', 'with']);
    const tokensA = normCandidate.split(/\s+/).filter((w) => w && !stopWords.has(w));
    const tokensB = normJob.split(/\s+/).filter((w) => w && !stopWords.has(w));

    if (tokensA.length > 0 && tokensB.length > 0) {
        const setB = new Set(tokensB);
        const commonTokens = tokensA.filter((token) => {
            if (setB.has(token)) return true;
            // Also check canonical token equality
            for (const b of tokensB) {
                if (getCanonicalSkill(token) === getCanonicalSkill(b)) return true;
            }
            return false;
        });

        // Similarity relative to the smaller skill token set
        const minTokenLen = Math.min(tokensA.length, tokensB.length);
        const overlapRatio = commonTokens.length / minTokenLen;

        // If at least 50% of the key words match, count as positive match!
        if (overlapRatio >= 0.5) {
            return { matched: true, score: Math.min(0.9, 0.5 + overlapRatio * 0.4) };
        }
    }

    // 4. Character Bigram / Dice Similarity (for typos or compound names like 'scikitlearn' vs 'scikit-learn')
    const diceScore = calculateDiceCoefficient(normCandidate, normJob);
    if (diceScore >= 0.65) {
        return { matched: true, score: diceScore };
    }

    return { matched: false, score: 0 };
}

function calculateDiceCoefficient(a: string, b: string): number {
    if (a.length < 2 || b.length < 2) return a === b ? 1 : 0;
    const bigramsA = new Map<string, number>();
    for (let i = 0; i < a.length - 1; i++) {
        const bigram = a.substring(i, i + 2);
        bigramsA.set(bigram, (bigramsA.get(bigram) || 0) + 1);
    }
    let intersection = 0;
    for (let i = 0; i < b.length - 1; i++) {
        const bigram = b.substring(i, i + 2);
        const count = bigramsA.get(bigram) || 0;
        if (count > 0) {
            bigramsA.set(bigram, count - 1);
            intersection++;
        }
    }
    return (2 * intersection) / (a.length + b.length - 2);
}

// 6. Extraction Helpers
export function extractSkillsByDictionary(
    text: string,
    dictionary: string[]
): string[] {
    if (!text) return [];
    const lower = text.toLowerCase();
    const found = new Set<string>();

    // Sort descending by length to catch compound phrases first
    const sorted = [...dictionary].sort((a, b) => b.length - a.length);

    for (const skill of sorted) {
        const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const startBoundary = /^\w/.test(skill) ? '(?:^|\\b)' : '(?:^|\\s|[.,;()!])';
        const endBoundary = /\w$/.test(skill) ? '(?:$|\\b)' : '(?:$|\\s|[.,;()!])';
        const regex = new RegExp(`${startBoundary}${escaped}${endBoundary}`, 'i');

        if (regex.test(lower)) {
            found.add(formatSkillTitle(getCanonicalSkill(skill)));
        }
    }

    return Array.from(found);
}

// Extract Technical Skills from text (optionally filtering by specific domain or surveying all)
export function extractTechnicalSkills(text: string, domain?: string): string[] {
    if (domain && DOMAIN_TECH_SKILLS[domain]) {
        return extractSkillsByDictionary(text, DOMAIN_TECH_SKILLS[domain]);
    }
    return extractSkillsByDictionary(text, ALL_TECH_SKILLS_FLAT);
}

// Extract Universal Personality Development / Soft Skills from text
export function extractSoftSkills(text: string): string[] {
    return extractSkillsByDictionary(text, UNIVERSAL_SOFT_SKILLS);
}

// Detect the target domain of a job description or candidate profile
export function detectRoleDomain(text: string): {
    domain: string;
    domainTitle: string;
    confidence: number;
} {
    if (!text) {
        return { domain: 'fullstack', domainTitle: DOMAIN_ROLE_TITLES.fullstack, confidence: 0 };
    }

    const lower = text.toLowerCase();
    let bestDomain = 'fullstack';
    let maxHits = 0;

    for (const [domain, skills] of Object.entries(DOMAIN_TECH_SKILLS)) {
        let hits = 0;
        for (const skill of skills) {
            if (lower.includes(skill.toLowerCase())) {
                hits++;
            }
        }
        if (hits > maxHits) {
            maxHits = hits;
            bestDomain = domain;
        }
    }

    return {
        domain: bestDomain,
        domainTitle: DOMAIN_ROLE_TITLES[bestDomain] || 'Software Engineer',
        confidence: maxHits,
    };
}

// Separate an arbitrary list of skills into Technical Skills vs Soft Skills
export function classifySkillsList(skills: string[]): {
    technicalSkills: string[];
    softSkills: string[];
} {
    const techSet = new Set<string>();
    const softSet = new Set<string>();

    const softLookup = new Set(
        UNIVERSAL_SOFT_SKILLS.map((s) => getCanonicalSkill(s).toLowerCase())
    );

    for (const skill of skills) {
        if (!skill || !skill.trim()) continue;
        const canonical = getCanonicalSkill(skill).toLowerCase();

        if (softLookup.has(canonical) || isSoftSkillHeuristic(canonical)) {
            softSet.add(formatSkillTitle(canonical));
        } else {
            techSet.add(formatSkillTitle(canonical));
        }
    }

    return {
        technicalSkills: Array.from(techSet),
        softSkills: Array.from(softSet),
    };
}

function isSoftSkillHeuristic(skill: string): boolean {
    const softKeywords = [
        'communication', 'leadership', 'collaboration', 'management', 'mentorship',
        'problem solving', 'thinking', 'adaptability', 'intelligence', 'listening',
        'negotiation', 'presentation', 'time management', 'ownership', 'teamwork'
    ];
    return softKeywords.some((kw) => skill.includes(kw));
}

export function formatSkillTitle(skill: string): string {
    const special: Record<string, string> = {
        'javascript': 'JavaScript',
        'typescript': 'TypeScript',
        'react': 'React',
        'next.js': 'Next.js',
        'node.js': 'Node.js',
        'vue': 'Vue.js',
        'express': 'Express.js',
        'nest.js': 'Nest.js',
        'aws': 'AWS',
        'gcp': 'GCP',
        'css': 'CSS',
        'html': 'HTML',
        'mongodb': 'MongoDB',
        'postgresql': 'PostgreSQL',
        'mysql': 'MySQL',
        'sqlite': 'SQLite',
        'graphql': 'GraphQL',
        'docker': 'Docker',
        'kubernetes': 'Kubernetes',
        'python': 'Python',
        'rest api': 'REST API',
        'ci/cd': 'CI/CD',
        'sql': 'SQL',
        'nosql': 'NoSQL',
        'java': 'Java',
        'c#': 'C#',
        'c++': 'C++',
        'php': 'PHP',
        'qa': 'QA',
        'sre': 'SRE',
        'ui': 'UI',
        'ux': 'UX',
        'api': 'API',
        'ai': 'Artificial Intelligence',
        'ml': 'Machine Learning',
        'dl': 'Deep Learning',
        'nlp': 'NLP',
        'cv': 'Computer Vision',
        'llm': 'Large Language Models',
        'rag': 'RAG',
        'pwa': 'Progressive Web Apps',
        'tailwind css': 'Tailwind CSS',
    };

    const lower = skill.toLowerCase().trim();
    if (special[lower]) return special[lower];

    return skill
        .split(' ')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
}
