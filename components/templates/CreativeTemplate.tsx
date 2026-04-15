import { UserProfile } from "@/types";
import { MapPin, Mail, Globe, Phone } from "lucide-react";
import { useRef } from "react";


interface Props {
    data: UserProfile;
    isCompact?: boolean;
    scale?: number;
    enablePagination?: boolean;
}

export default function CreativeTemplate({ data, isCompact = false, scale = 1, enablePagination = true }: Props) {
    const containerRef = useRef<HTMLDivElement>(null);


    if (!data) return null;

    return (
        <div ref={containerRef} className={`w-[210mm] bg-white text-black min-h-[297mm] overflow-visible flex font-sans leading-tight shadow-none print:shadow-none print:w-[210mm] mx-auto relative ${isCompact ? 'p-5 print:p-5 max-w-[210mm]' : 'p-8 print:p-8 max-w-[210mm]'}`}>
            <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width: `calc(100% / ${scale})`, height: `calc(100% / ${scale})`, display: 'flex' }}>
                {/* Sidebar (Left) */}
                <div className={`w-1/3 bg-slate-900 text-white flex flex-col gap-6 ${isCompact ? 'p-4' : 'p-6'}`}>
                    <div>
                        <h1 className={`font-bold leading-tight mb-2 ${isCompact ? 'text-[18pt]' : 'text-[22pt]'}`}>{data.fullName}</h1>
                        <p className={`text-slate-400 leading-relaxed ${isCompact ? 'text-[10pt]' : 'text-[10pt]'}`}>{data.summary}</p>
                    </div>

                    <div className={`space-y-2 ${isCompact ? 'text-[9pt]' : 'text-[10pt]'}`}>
                        {data.location && (
                            <div className="flex items-center gap-2 text-slate-300">
                                <MapPin className="w-3 h-3 text-emerald-400" /> {data.location}
                            </div>
                        )}
                        {data.email && (
                            <div className="flex items-center gap-2 text-slate-300">
                                <Mail className="w-3 h-3 text-emerald-400" /> {data.email}
                            </div>
                        )}
                        {data.phone && (
                            <div className="flex items-center gap-2 text-slate-300">
                                <Phone className="w-3 h-3 text-emerald-400" /> {data.phone}
                            </div>
                        )}
                        {data.website && (
                            <a href={data.website} className="flex items-center gap-2 text-slate-300 hover:text-white">
                                <Globe className="w-3 h-3 text-emerald-400" /> Website
                            </a>
                        )}
                    </div>

                    {data.education && data.education.length > 0 && (
                        <div>
                            <h2 className={`font-bold border-b border-slate-700 pb-1 mb-2 text-emerald-400 page-break-inside-avoid ${isCompact ? 'text-[14pt]' : 'text-[16pt]'}`} style={{ breakAfter: 'avoid' }}>Education</h2>
                            <div className="space-y-4">
                                {data.education.map((edu, idx) => (
                                    <div key={edu.id || idx} className="break-inside-avoid page-break-inside-avoid">
                                        <div className={`font-bold ${isCompact ? 'text-[11pt]' : 'text-[12pt]'}`}>{edu.school}</div>
                                        <div className={`text-slate-400 ${isCompact ? 'text-[10pt]' : 'text-[10pt]'}`}>{edu.degree}</div>
                                        <div className={`text-slate-500 mt-0.5 ${isCompact ? 'text-[10pt]' : 'text-[10pt]'}`}>{edu.year}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {data.skills && (
                        <div>
                            <h2 className={`font-bold border-b border-slate-700 pb-1 mb-2 text-emerald-400 page-break-inside-avoid ${isCompact ? 'text-[14pt]' : 'text-[16pt]'}`} style={{ breakAfter: 'avoid' }}>Skills</h2>
                            <div className="flex flex-wrap gap-1.5">
                                {data.skills.split(',').map((skill, i) => (
                                    <span key={i} className={`bg-slate-800 text-slate-200 px-2 py-0.5 rounded ${isCompact ? 'text-[10pt]' : 'text-[10pt]'}`}>{skill.trim()}</span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Main Content (Right) */}
                <div className="w-2/3 p-6 bg-white">
                    {data.experience && data.experience.length > 0 && (
                        <div className="mb-6">
                            <h2 className={`font-bold text-slate-900 border-b-2 border-emerald-500 pb-1 mb-4 inline-block page-break-inside-avoid ${isCompact ? 'text-[14pt]' : 'text-[16pt]'}`} style={{ breakAfter: 'avoid' }}>Experience</h2>
                            <div className="space-y-6">
                                {data.experience.map((exp, idx) => (
                                    <div key={exp.id || idx} className="relative pl-5 border-l-2 border-slate-200 break-inside-avoid page-break-inside-avoid">
                                        <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-emerald-500 border-4 border-white" />
                                        <div className="mb-1">
                                            <h3 className={`font-bold text-slate-800 ${isCompact ? 'text-[11pt]' : 'text-[12pt]'}`}>{exp.role}</h3>
                                            <div className="text-emerald-600 font-medium text-[10pt]">{exp.company}</div>
                                            <div className="text-[10pt] text-slate-400 uppercase tracking-wide mt-0.5">{exp.startDate} – {exp.endDate}</div>
                                        </div>
                                        <ul className="list-disc list-outside ml-3.5 space-y-1">
                                            {exp.description.split('\n').filter(line => line.trim()).map((line, i) => (
                                                <li key={i} className={`text-slate-600 leading-snug pl-1 ${isCompact ? 'text-[10pt]' : 'text-[11pt]'}`}>
                                                    {line}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Projects Section if available */}
                    {data.projects && data.projects.filter(p => p.imported !== false).length > 0 && (
                        <div className="mt-2">
                            <h2 className={`font-bold text-slate-900 border-b-2 border-emerald-500 pb-1 mb-2 inline-block page-break-inside-avoid ${isCompact ? 'text-[14pt]' : 'text-[16pt]'}`} style={{ breakAfter: 'avoid' }}>Projects</h2>
                            <div className="flex flex-col gap-0.5">
                                {data.projects.filter(p => p.imported !== false).map((proj, idx) => (
                                    <div key={proj.id || idx} className="bg-slate-50 p-1 rounded-lg break-inside-avoid page-break-inside-avoid">
                                        <h3 className={`font-bold mb-0.5 ${isCompact ? 'text-[11pt]' : 'text-[12pt]'}`}>{proj.name}</h3>
                                        <ul className="list-disc list-outside ml-3.5 space-y-0.5">
                                            {proj.description.replace(/•/g, '\n').split('\n').map(l => l.trim()).filter(line => line).map((line, i) => (
                                                <li key={i} className={`text-slate-600 leading-snug pl-1 ${isCompact ? 'text-[10pt]' : 'text-[11pt]'}`}>
                                                    {line}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
