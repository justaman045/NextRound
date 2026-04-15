"use client";

import { Template, UserProfile } from "@/types";
import { Check, Layout, Sparkles } from "lucide-react";
import ModernTemplate from "@/components/templates/ModernTemplate";
import MinimalistTemplate from "@/components/templates/MinimalistTemplate";
import CreativeTemplate from "@/components/templates/CreativeTemplate";
import FaangPathTemplate from "@/components/templates/FaangPathTemplate";

interface Props {
    templates: Template[];
    selectedId: string | null;
    onSelect: (id: string) => void;
    previewData?: UserProfile; // Pass the actual resume data for rich previews
}

// Fallback sample data (used when no real data is available, e.g. pre-generation)
const fallbackData: UserProfile = {
    fullName: "Alex Johnson",
    email: "alex@example.com",
    phone: "555-0199",
    location: "San Francisco, CA",
    website: "alexj.dev",
    summary: "Full-stack engineer with 5+ years of experience building scalable web applications using React, Node.js, and cloud infrastructure. Passionate about clean architecture and developer experience.",
    experience: [
        {
            id: "1",
            role: "Senior Software Engineer",
            company: "TechCorp Inc.",
            startDate: "Jan 2022",
            endDate: "Present",
            description: "Led migration of monolith to microservices architecture\nReduced API latency by 45% through caching strategies\nMentored team of 4 junior developers",
        },
        {
            id: "2",
            role: "Software Engineer",
            company: "StartupXYZ",
            startDate: "Jun 2019",
            endDate: "Dec 2021",
            description: "Built real-time dashboard serving 10K daily users\nImplemented CI/CD pipelines reducing deploy time by 60%\nDesigned RESTful APIs consumed by mobile and web clients",
        },
    ],
    education: [
        { id: "1", degree: "B.S. Computer Science", school: "Stanford University", year: "2019" },
    ],
    skills: "JavaScript, TypeScript, Python, React, Next.js, Node.js, PostgreSQL, AWS, Docker, Git",
    projects: [
        {
            id: "1",
            name: "CloudDeploy CLI",
            description: "Open-source deployment tool for serverless apps\nSupports AWS Lambda and Google Cloud Functions",
            technologies: "Go, AWS SDK, Cobra",
            link: "",
        },
        {
            id: "2",
            name: "DevMetrics Dashboard",
            description: "Analytics platform tracking developer productivity\nReal-time charts with WebSocket data streaming",
            technologies: "React, D3.js, Express",
            link: "",
        },
    ],
};

const templateComponents: Record<string, React.FC<{ data: UserProfile; isCompact?: boolean; scale?: number; enablePagination?: boolean }>> = {
    modern: ModernTemplate,
    minimalist: MinimalistTemplate,
    creative: CreativeTemplate,
    faangpath: FaangPathTemplate,
};

export default function TemplateSelector({ templates, selectedId, onSelect, previewData }: Props) {
    const dataToUse = previewData || fallbackData;

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" /> Choose Your Style
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {templates.map((template) => {
                    const isSelected = selectedId === template.id;
                    const PreviewComponent = template.componentKey ? templateComponents[template.componentKey] : null;

                    return (
                        <button
                            key={template.id}
                            onClick={() => onSelect(template.id!)}
                            className={`group relative aspect-[3/4] rounded-xl overflow-hidden transition-all duration-300 bg-white ${isSelected
                                    ? 'ring-4 ring-purple-500 scale-105 shadow-2xl shadow-purple-500/20'
                                    : 'ring-1 ring-white/10 hover:ring-white/30 hover:scale-[1.02]'
                                }`}
                        >
                            {/* Live Preview */}
                            {template.type === 'react' && PreviewComponent ? (
                                <div className="absolute inset-0 overflow-hidden pointer-events-none flex justify-center">
                                    <div style={{
                                        transform: 'scale(0.22)',
                                        transformOrigin: 'top',
                                        width: '210mm',
                                        minHeight: '297mm',
                                    }}>
                                        <PreviewComponent data={dataToUse} isCompact={true} scale={1} enablePagination={false} />
                                    </div>
                                </div>
                            ) : template.imageUrl ? (
                                <img
                                    src={template.imageUrl}
                                    alt={template.name}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                />
                            ) : (
                                <div className="w-full h-full bg-gray-900 flex flex-col items-center justify-center text-gray-600 gap-2">
                                    <Layout className="w-8 h-8 opacity-50" />
                                    <span className="text-xs uppercase tracking-widest opacity-50">No Preview</span>
                                </div>
                            )}

                            {/* Badge */}
                            <div className="absolute top-2 left-2 flex gap-1 z-10">
                                {template.type === 'latex' ? (
                                    <span className="bg-orange-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm backdrop-blur-md">
                                        LaTeX
                                    </span>
                                ) : (
                                    <span className="bg-blue-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm backdrop-blur-md">
                                        React
                                    </span>
                                )}
                            </div>

                            {/* Overlay Info - Always visible with template name */}
                            <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/90 via-black/60 to-transparent z-10">
                                <h4 className="text-white text-sm font-bold truncate">{template.name}</h4>
                                <p className="text-gray-300 text-[10px] line-clamp-1">{template.description}</p>
                            </div>

                            {/* Selected Indicator */}
                            {isSelected && (
                                <div className="absolute top-2 right-2 bg-purple-500 text-white p-1 rounded-full shadow-lg animate-fade-in-up z-10">
                                    <Check className="w-3 h-3" />
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>
            {templates.length === 0 && (
                <div className="text-center py-8 text-gray-500 text-sm">
                    No templates available.
                </div>
            )}
        </div>
    );
}
