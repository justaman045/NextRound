export interface Experience {
    id: string;
    role: string;
    company: string;
    startDate: string;
    endDate: string;
    description: string;
    source?: string;
    location?: string;
}

export interface Education {
    id: string;
    degree: string;
    school: string;
    location?: string;
    year: string;
    source?: string;
}

export interface Project {
    id: string;
    name: string;
    description: string; // usually bullet points
    technologies?: string;
    link?: string;
    imported?: boolean;
}

export interface UserProfile {
    fullName: string;
    email: string;
    phone: string;
    location: string;
    website: string;
    summary: string;
    experience: Experience[];
    education: Education[];
    projects: Project[];
    customSections?: CustomSection[];
    skills: string;
    githubSkills?: string; // Skills imported specifically from GitHub
    integrations?: IntegrationStatus;
    githubProfile?: {
        username: string;
        displayName: string;
        bio: string;
        email: string;
        avatarUrl: string;
        publicRepos: number;
        followers: number;
        following: number;
        location: string;
        blog: string;
        aiAnalysis?: {
            role: string;
            seniority: string;
            yearsOfExperience: string;
            model: string;
            date?: string;
            projectInsight?: {
                role: string;
                seniority: string;
                justification: string;
            };
        };
    };
    linkedinProfile?: {
        url: string;
        username?: string;
        name?: string;
        headline?: string;
        connectedAt: string;
        aiAnalysis?: {
            role: string;
            seniority: string;
            yearsOfExperience: string;
            model: string;
            date?: string;
            projectInsight?: {
                role: string;
                seniority: string;
                justification: string;
            };
        };
    };
    masterProfileAnalysis?: {
        role: string;
        seniority: string;
        yearsOfExperience: string;
        summary: string;
        model: string;
        date?: string;
        projectInsight?: {
            role: string;
            seniority: string;
            justification: string;
        };
    };
}

export interface CustomSectionItem {
    id: string;
    name: string;
    subtitle?: string;
    date?: string;
    description?: string;
}

export interface CustomSection {
    id: string;
    title: string;
    items: CustomSectionItem[];
}

export interface TemplateFile {
    path: string;
    content: string;
}

export interface Template {
    id?: string;
    name: string;
    description?: string;
    imageUrl?: string;
    isActive: boolean;
    type: 'react' | 'latex';
    // For React Templates
    componentKey?: string;
    // For LaTeX Templates
    files?: TemplateFile[];
    engine?: 'pdflatex' | 'xelatex';
}

export interface UserResume {
    id: string;
    title: string;
    templateId: string;
    createdAt: string;
    thumbnailUrl?: string; // Preview image

    jobDescription?: string; // The JD used to tailor
    score?: number;       // AI Score (0-100)
    data?: UserProfile;   // The tailored profile data
    originalData?: UserProfile; // The immutable baseline AI generation snapshot
}

export interface ResumeHistory {
    id: string;
    data: UserProfile;
    timestamp: string;
    label?: string;
    templateId?: string;
}

export interface Subscription {
    id: string;
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    plan: 'free' | 'pro' | 'enterprise';
    status: 'active' | 'canceled' | 'past_due';
    currentPeriodEnd: string;
    usage: {
        resumesGenerated: number;
        limit: number;
    };
    billingCycle?: 'monthly' | 'semiannual';
}

export interface IntegrationStatus {
    linkedin: boolean;
    indeed: boolean;
    naukri: boolean;
    github?: boolean;
    portfolio?: boolean;
}
