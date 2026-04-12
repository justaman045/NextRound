import { UserProfile } from "@/types";
import { Mail, MapPin, Phone, Globe } from "lucide-react";
import { useRef } from "react";
import { useDynamicPagination } from "@/hooks/useDynamicPagination";

interface Props {
    data: UserProfile;
    isCompact?: boolean;
    scale?: number;
    enablePagination?: boolean;
}

export default function ModernTemplate({ data, isCompact = false, scale = 1, enablePagination = true }: Props) {
    const containerRef = useRef<HTMLDivElement>(null);
    useDynamicPagination(containerRef, data, scale, enablePagination);

    // Helper to process bullets
    const getBullets = (text: string) => {
        if (!text) return [];
        return text.split("\n").map(line => line.replace(/^[\s-•*]+/, "").trim()).filter(line => line.length > 0);
    };

    // Helper to process skills
    const getSkills = (text: string) => {
        if (!text) return [];
        return text.split(",").map(s => s.trim()).filter(s => s.length > 0);
    };

    return (
        <div ref={containerRef} className={`bg-white text-gray-800 mx-auto min-h-[297mm] w-[210mm] overflow-visible shadow-none print:shadow-none print:w-[210mm] relative ${isCompact ? 'p-5 max-w-[210mm]' : 'p-10 max-w-[210mm]'}`}>
            <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width: `calc(100% / ${scale})`, height: `calc(100% / ${scale})` }}>

                {/* Header */}
                <header className={`border-b-2 border-gray-800 ${isCompact ? 'pb-1 mb-2' : 'pb-4 mb-5'}`}>
                    <h1 className={`${isCompact ? 'text-[18pt] mb-0.5' : 'text-[22pt] mb-2'} font-bold uppercase tracking-wider`}>{data.fullName}</h1>
                    <div className={`flex flex-wrap gap-3 ${isCompact ? 'text-[10pt] gap-2' : 'text-[10pt]'} text-gray-600`}>
                        {data.email && (
                            <div className="flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                <span>{data.email}</span>
                            </div>
                        )}
                        {data.phone && (
                            <div className="flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                <span>{data.phone}</span>
                            </div>
                        )}
                        {data.location && (
                            <div className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                <span>{data.location}</span>
                            </div>
                        )}
                        {data.website && (
                            <div className="flex items-center gap-1">
                                <Globe className="w-3 h-3" />
                                <span>{data.website}</span>
                            </div>
                        )}
                    </div>
                </header>

                {/* Summary */}
                {data.summary && (
                    <section className={`${isCompact ? 'mb-2' : 'mb-4'}`}>
                        <h2 className={`font-bold uppercase tracking-widest border-b border-gray-300 page-break-inside-avoid ${isCompact ? 'text-[14pt] pb-0.5 mb-1' : 'text-[16pt] pb-1 mb-2'}`} style={{ breakAfter: 'avoid' }}>Professional Summary</h2>
                        <p className={`leading-snug text-gray-700 ${isCompact ? 'text-[10pt] leading-tight' : 'text-[11pt]'}`}>{data.summary}</p>
                    </section>
                )}

                {/* Experience */}
                {data.experience.length > 0 && (
                    <section className={`${isCompact ? 'mb-2' : 'mb-4'}`}>
                        <h2 className={`font-bold uppercase tracking-widest border-b border-gray-300 page-break-inside-avoid ${isCompact ? 'text-[14pt] pb-0.5 mb-1' : 'text-[16pt] pb-1 mb-3'}`} style={{ breakAfter: 'avoid' }}>experience</h2>
                        <div className={`${isCompact ? 'space-y-1' : 'space-y-3'}`}>
                            {data.experience.map((exp, idx) => (
                                <div key={exp.id || idx} className="break-inside-avoid page-break-inside-avoid">
                                    <div className="flex justify-between items-baseline mb-0.5">
                                        <h3 className={`font-bold ${isCompact ? 'text-[11pt]' : 'text-[12pt]'}`}>{exp.role}</h3>
                                        <span className={`text-[10pt] text-gray-500 font-medium whitespace-nowrap ${isCompact ? 'text-[9pt]' : ''}`}>
                                            {exp.startDate} – {exp.endDate}
                                        </span>
                                    </div>
                                    <div className={`text-[10pt] font-semibold text-gray-700 ${isCompact ? 'text-[9pt] mb-0.5' : 'mb-1'}`}>{exp.company}</div>
                                    <ul className="list-disc list-outside ml-3 space-y-0.5">
                                        {getBullets(exp.description).map((bullet, idx) => (
                                            <li key={idx} className={`text-gray-600 leading-snug pl-1 ${isCompact ? 'text-[10pt] leading-[1.1] tracking-tight' : 'text-[11pt]'}`}>
                                                {bullet}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Education */}
                {data.education.length > 0 && (
                    <section className={`${isCompact ? 'mb-2' : 'mb-4'}`}>
                        <h2 className={`font-bold uppercase tracking-widest border-b border-gray-300 page-break-inside-avoid ${isCompact ? 'text-[14pt] pb-0.5 mb-1' : 'text-[16pt] pb-1 mb-3'}`} style={{ breakAfter: 'avoid' }}>Education</h2>
                        <div className={`${isCompact ? 'space-y-1' : 'space-y-2'}`}>
                            {data.education.map((edu, idx) => (
                                <div key={edu.id || idx} className="break-inside-avoid page-break-inside-avoid">
                                    <div className="flex justify-between items-baseline">
                                        <h3 className={`font-bold text-gray-800 ${isCompact ? 'text-[11pt]' : 'text-[12pt]'}`}>{edu.school}</h3>
                                        <span className={`text-[10pt] text-gray-500 ${isCompact ? 'text-[9pt]' : ''}`}>{edu.year}</span>
                                    </div>
                                    <div className={`text-[10pt] text-gray-600 ${isCompact ? 'text-[9pt]' : ''}`}>{edu.degree}</div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Projects */}
                {data.projects && data.projects.filter(p => p.imported !== false).length > 0 && (
                    <section className={`${isCompact ? 'mb-2' : 'mb-4'}`}>
                        <h2 className={`font-bold uppercase tracking-widest border-b border-gray-300 page-break-inside-avoid ${isCompact ? 'text-[14pt] pb-0.5 mb-1' : 'text-[16pt] pb-1 mb-2'}`} style={{ breakAfter: 'avoid' }}>Projects</h2>
                        <div className={`${isCompact ? 'space-y-1' : 'space-y-2'}`}>
                            {data.projects.filter(p => p.imported !== false).map((proj, idx) => (
                                <div key={proj.id || idx} className="break-inside-avoid page-break-inside-avoid">
                                    <div className="flex justify-between items-baseline mb-0.5">
                                        <h3 className={`font-bold text-gray-800 ${isCompact ? 'text-[11pt]' : 'text-[12pt]'}`}>{proj.name}</h3>
                                    </div>
                                    <p className={`text-gray-700 leading-snug ${isCompact ? 'text-[10pt] leading-[1.1] mb-0.5 tracking-tight' : 'text-[11pt] mb-0.5'}`}>{proj.description}</p>
                                    {proj.technologies && (
                                        <div className={`text-[10pt] text-gray-500 italic ${isCompact ? 'text-[9pt]' : ''}`}>
                                            Tech: {proj.technologies}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Skills - Adjusted Margin Top to 0 to prevent double spacing */}
                {data.skills && (
                    <section className={`${isCompact ? 'mb-0' : 'mb-0'}`}>
                        <h2 className={`font-bold uppercase tracking-widest border-b border-gray-300 page-break-inside-avoid ${isCompact ? 'text-[14pt] pb-0.5 mb-1' : 'text-[16pt] pb-1 mb-2'}`} style={{ breakAfter: 'avoid' }}>Skills</h2>
                        <div className="flex flex-wrap gap-1.5 align-baseline">
                            {getSkills(data.skills).map((skill, idx) => (
                                <span key={idx} className={`bg-gray-100 px-2 py-0.5 rounded text-gray-700 font-medium ${isCompact ? 'text-[10pt] px-1.5 py-0' : 'text-[10pt]'}`}>
                                    {skill}
                                </span>
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
}
