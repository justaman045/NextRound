import { UserProfile } from "@/types";
import { useRef } from "react";


interface Props {
    data: UserProfile;
    isCompact?: boolean;
    scale?: number;
    enablePagination?: boolean;
}

export default function FaangPathTemplate({ data, isCompact = false, scale = 1, enablePagination = true }: Props) {
    const containerRef = useRef<HTMLDivElement>(null);


    // Helper to process bullets
    const getBullets = (text: string) => {
        if (!text) return [];
        return text.split("\n").map(line => line.replace(/^[\s-•*]+/, "").trim()).filter(line => line.length > 0);
    };

    // Helper to process skills (comma separated)
    const getSkills = (text: string) => {
        if (!text) return [];
        // Just return the raw text if it's already formatted, or split if needed.
        // FaangPath usually lists skills as "Category: A, B, C" in lines.
        // If the user input is just a blob, we'll render it as is or split by newlines.
        return text.split("\n").filter(s => s.trim().length > 0);
    };

    return (
        <div
            ref={containerRef}
            className={`bg-white text-black mx-auto min-h-[297mm] w-[210mm] overflow-visible shadow-none print:shadow-none print:w-[210mm] relative font-serif ${isCompact ? 'p-8 print:py-0 max-w-[210mm]' : 'p-10 print:py-0 max-w-[210mm]'}`}
            style={{ fontFamily: '"Times New Roman", Times, serif' }}
        >
            <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width: `calc(100% / ${scale})`, height: `calc(100% / ${scale})` }}>

                {/* Header */}
                <header className="text-center mb-4">
                    <h1 className="text-[24pt] font-bold uppercase mb-1">{data.fullName}</h1>
                    <div className="text-[11pt] flex flex-wrap justify-center items-center gap-1.5 leading-snug">
                        {data.email && <span>{data.email}</span>}
                        {data.email && data.phone && <span>{' '}&#9670;{' '}</span>}
                        {data.phone && <span>{data.phone}</span>}
                        {data.phone && data.location && <span>{' '}&#9670;{' '}</span>}
                        {data.location && <span>{data.location}</span>}
                        {data.location && data.website && <span>{' '}&#9670;{' '}</span>}
                        {data.website && (
                            <a href={`https://${data.website.replace(/^https?:\/\//, '')}`} className="text-black no-underline">
                                {data.website.replace(/^https?:\/\//, '')}
                            </a>
                        )}
                    </div>
                </header>

                {/* Education */}
                {data.education.length > 0 && (
                    <section className="mb-4">
                        <h2 className="font-bold uppercase tracking-wide border-b border-black text-[11pt] mb-2" style={{ breakAfter: 'avoid' }}>Education</h2>
                        <div className="space-y-2">
                            {data.education.map((edu, idx) => (
                                <div key={edu.id || idx} className="break-inside-avoid page-break-inside-avoid">
                                    <div className="flex justify-between items-baseline">
                                        <div className="font-bold text-[11pt]">{edu.school}</div>
                                        <div className="text-[11pt]">{edu.location}</div>
                                    </div>
                                    <div className="flex justify-between items-baseline">
                                        <div className="italic text-[11pt]">{edu.degree}</div>
                                        <div className="italic text-[11pt]">{edu.year}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Skills */}
                {data.skills && (
                    <section className="mb-4">
                        <h2 className="font-bold uppercase tracking-wide border-b border-black text-[11pt] mb-2" style={{ breakAfter: 'avoid' }}>Skills</h2>
                        <div className="text-[11pt] leading-snug">
                            {getSkills(data.skills).map((skillLine, idx) => (
                                <div key={idx}>{skillLine}</div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Experience */}
                {data.experience.length > 0 && (
                    <section className="mb-4">
                        <h2 className="font-bold uppercase tracking-wide border-b border-black text-[11pt] mb-2" style={{ breakAfter: 'avoid' }}>Experience</h2>
                        <div className="space-y-3">
                            {data.experience.map((exp, idx) => (
                                <div key={exp.id || idx} className="break-inside-avoid page-break-inside-avoid">
                                    <div className="flex justify-between items-baseline">
                                        <div className="font-bold text-[11pt]">{exp.role}</div>
                                        <div className="text-[11pt]">{exp.startDate} - {exp.endDate}</div>
                                    </div>
                                    <div className="flex justify-between items-baseline mb-1">
                                        <div className="text-[11pt] italic">{exp.company}</div>
                                        <div className="text-[11pt] italic">{exp.location}</div>
                                    </div>
                                    <ul className="list-disc list-outside ml-4 space-y-0.5">
                                        {getBullets(exp.description).map((bullet, idx) => (
                                            <li key={idx} className="text-[11pt] leading-snug pl-1">
                                                {bullet}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Projects */}
                {data.projects && data.projects.length > 0 && (
                    <section className="mb-4">
                        <h2 className="font-bold uppercase tracking-wide border-b border-black text-[11pt] mb-2" style={{ breakAfter: 'avoid' }}>Projects</h2>
                        <div className="space-y-2">
                            {data.projects.map((proj, idx) => (
                                <div key={proj.id || idx} className="break-inside-avoid page-break-inside-avoid">
                                    <div className="flex items-baseline mb-0.5">
                                        <span className="font-bold text-[11pt] mr-2">{proj.name}</span>
                                        {proj.technologies && <span className="italic text-[11pt]">| {proj.technologies}</span>}
                                    </div>
                                    <ul className="list-disc list-outside ml-4 mt-1 mb-1 space-y-0.5">
                                        {getBullets(proj.description).map((bullet, idx) => (
                                            <li key={idx} className="text-[11pt] leading-snug pl-1">
                                                {bullet}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

            </div>
        </div>
    );
}
