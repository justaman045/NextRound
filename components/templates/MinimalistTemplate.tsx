import { UserProfile } from "@/types";
import { MapPin, Mail, Globe, Phone, Github } from "lucide-react";
import { useRef } from "react";
import { useDynamicPagination } from "@/hooks/useDynamicPagination";

interface Props {
    data: UserProfile;
    isCompact?: boolean;
    scale?: number;
    enablePagination?: boolean;
}

export default function MinimalistTemplate({ data, isCompact = false, scale = 1, enablePagination = true }: Props) {
    const containerRef = useRef<HTMLDivElement>(null);
    useDynamicPagination(containerRef, data, scale, enablePagination);

    if (!data) return null;

    return (
        <div ref={containerRef} className={`w-[210mm] bg-white text-black mx-auto min-h-[297mm] overflow-visible font-serif leading-tight shadow-none print:shadow-none print:w-[210mm] relative ${isCompact ? 'p-5 max-w-[210mm]' : 'p-8 max-w-[210mm]'}`}>
            <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width: `calc(100% / ${scale})`, height: `calc(100% / ${scale})` }}>
                {/* Header */}
                <div className="text-center border-b-2 border-black pb-5 mb-6">
                    <h1 className={`${isCompact ? 'text-[20pt]' : 'text-[24pt]'} font-bold uppercase tracking-widest mb-3`}>{data.fullName}</h1>
                    <div className="flex flex-wrap justify-center gap-3 text-[10pt] font-medium">
                        {data.location && (
                            <div className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" /> {data.location}
                            </div>
                        )}
                        {data.email && (
                            <div className="flex items-center gap-1">
                                <Mail className="w-3 h-3" /> {data.email}
                            </div>
                        )}
                        {data.phone && (
                            <div className="flex items-center gap-1">
                                <Phone className="w-3 h-3" /> {data.phone}
                            </div>
                        )}
                        {data.website && (
                            <a href={data.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:underline">
                                <Globe className="w-3 h-3" /> Website
                            </a>
                        )}
                    </div>
                </div>

                {/* Summary */}
                {data.summary && (
                    <div className="mb-6 text-center max-w-2xl mx-auto">
                        <p className={`italic text-gray-700 leading-snug ${isCompact ? 'text-[10pt]' : 'text-[11pt]'}`}>{data.summary}</p>
                    </div>
                )}

                {/* Experience */}
                {data.experience && data.experience.length > 0 && (
                    <div className="mb-6">
                        <h2 className={`font-bold uppercase border-b border-gray-300 pb-1 mb-3 tracking-wider page-break-inside-avoid ${isCompact ? 'text-[14pt]' : 'text-[16pt]'}`} style={{ breakAfter: 'avoid' }}>Experience</h2>
                        <div className="space-y-4">
                            {data.experience.map((exp, idx) => (
                                <div key={exp.id || idx} className="break-inside-avoid page-break-inside-avoid">
                                    <div className="flex justify-between items-baseline mb-0.5">
                                        <h3 className={`font-bold ${isCompact ? 'text-[11pt]' : 'text-[12pt]'}`}>{exp.company}</h3>
                                        <span className={`text-[10pt] italic text-gray-600 ${isCompact ? 'text-[9pt]' : ''}`}>{exp.startDate} – {exp.endDate}</span>
                                    </div>
                                    <div className={`font-semibold mb-1 ${isCompact ? 'text-[10pt]' : 'text-[11pt]'}`}>{exp.role}</div>
                                    <ul className="list-disc list-outside ml-3.5 space-y-1">
                                        {exp.description.split('\n').filter(line => line.trim()).map((line, i) => (
                                            <li key={i} className={`text-gray-700 leading-snug pl-1 ${isCompact ? 'text-[10pt]' : 'text-[11pt]'}`}>
                                                {line}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Education */}
                {data.education && data.education.length > 0 && (
                    <div className="mb-6">
                        <h2 className={`font-bold uppercase border-b border-gray-300 pb-1 mb-3 tracking-wider page-break-inside-avoid ${isCompact ? 'text-[14pt]' : 'text-[16pt]'}`} style={{ breakAfter: 'avoid' }}>Education</h2>
                        <div className="space-y-2">
                            {data.education.map((edu, idx) => (
                                <div key={edu.id || idx} className="flex justify-between items-baseline break-inside-avoid page-break-inside-avoid">
                                    <div>
                                        <h3 className={`font-bold ${isCompact ? 'text-[11pt]' : 'text-[12pt]'}`}>{edu.school}</h3>
                                        <div className={`text-gray-700 ${isCompact ? 'text-[10pt]' : 'text-[11pt]'}`}>{edu.degree}</div>
                                    </div>
                                    <span className={`text-[10pt] italic text-gray-600 ${isCompact ? 'text-[9pt]' : ''}`}>{edu.year}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Projects */}
                {data.projects && data.projects.filter(p => p.imported !== false).length > 0 && (
                    <div className="mb-2">
                        <h2 className={`font-bold uppercase border-b border-gray-300 pb-1 mb-2 tracking-wider page-break-inside-avoid ${isCompact ? 'text-[14pt]' : 'text-[16pt]'}`} style={{ breakAfter: 'avoid' }}>Projects</h2>
                        <div className="space-y-2">
                            {data.projects.filter(p => p.imported !== false).map((proj, idx) => (
                                <div key={proj.id || idx} className="break-inside-avoid page-break-inside-avoid">
                                    <h3 className={`font-bold mb-0.5 ${isCompact ? 'text-[11pt]' : 'text-[12pt]'}`}>{proj.name}</h3>
                                    <div className={`text-gray-700 leading-snug whitespace-pre-wrap ${isCompact ? 'text-[10pt]' : 'text-[11pt]'}`}>
                                        {proj.description}
                                    </div>
                                    {proj.technologies && (
                                        <div className={`text-gray-500 mt-0.5 italic ${isCompact ? 'text-[9pt]' : 'text-[10pt]'}`}>
                                            Stack: {proj.technologies}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Skills */}
                {data.skills && (
                    <div className="mb-0">
                        <h2 className={`font-bold uppercase border-b border-gray-300 pb-1 mb-2 tracking-wider page-break-inside-avoid ${isCompact ? 'text-[14pt]' : 'text-[16pt]'}`} style={{ breakAfter: 'avoid' }}>Skills</h2>
                        <p className={`leading-relaxed ${isCompact ? 'text-[10pt]' : 'text-[11pt]'}`}>{data.skills.split(',').map(s => s.trim()).join(' • ')}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
