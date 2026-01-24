import { UserProfile } from "@/types";
import { MapPin, Mail, Globe, Phone } from "lucide-react";

export default function CreativeTemplate({ data }: { data: UserProfile }) {
    if (!data) return null;

    return (
        <div className="w-full bg-white text-black min-h-[1100px] flex font-sans">
            {/* Sidebar (Left) */}
            <div className="w-1/3 bg-slate-900 text-white p-8 flex flex-col gap-8">
                <div>
                    <h1 className="text-3xl font-bold leading-tight mb-4">{data.fullName}</h1>
                    <p className="text-slate-400 text-sm leading-relaxed">{data.summary}</p>
                </div>

                <div className="space-y-3 text-sm">
                    {data.location && (
                        <div className="flex items-center gap-2 text-slate-300">
                            <MapPin className="w-4 h-4 text-emerald-400" /> {data.location}
                        </div>
                    )}
                    {data.email && (
                        <div className="flex items-center gap-2 text-slate-300">
                            <Mail className="w-4 h-4 text-emerald-400" /> {data.email}
                        </div>
                    )}
                    {data.phone && (
                        <div className="flex items-center gap-2 text-slate-300">
                            <Phone className="w-4 h-4 text-emerald-400" /> {data.phone}
                        </div>
                    )}
                    {data.website && (
                        <a href={data.website} className="flex items-center gap-2 text-slate-300 hover:text-white">
                            <Globe className="w-4 h-4 text-emerald-400" /> Website
                        </a>
                    )}
                </div>

                {data.education && data.education.length > 0 && (
                    <div>
                        <h2 className="text-lg font-bold border-b border-slate-700 pb-2 mb-4 text-emerald-400">Education</h2>
                        <div className="space-y-6">
                            {data.education.map((edu) => (
                                <div key={edu.id}>
                                    <div className="font-bold">{edu.school}</div>
                                    <div className="text-sm text-slate-400">{edu.degree}</div>
                                    <div className="text-xs text-slate-500 mt-1">{edu.year}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {data.skills && (
                    <div>
                        <h2 className="text-lg font-bold border-b border-slate-700 pb-2 mb-4 text-emerald-400">Skills</h2>
                        <div className="flex flex-wrap gap-2">
                            {data.skills.split(',').map((skill, i) => (
                                <span key={i} className="bg-slate-800 text-slate-200 px-2 py-1 rounded text-xs">{skill.trim()}</span>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Main Content (Right) */}
            <div className="w-2/3 p-10 bg-white">
                {data.experience && data.experience.length > 0 && (
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 border-b-2 border-emerald-500 pb-2 mb-8 inline-block">Experience</h2>
                        <div className="space-y-10">
                            {data.experience.map((exp) => (
                                <div key={exp.id} className="relative pl-6 border-l-2 border-slate-200">
                                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-emerald-500 border-4 border-white" />
                                    <div className="mb-2">
                                        <h3 className="text-xl font-bold text-slate-800">{exp.role}</h3>
                                        <div className="text-emerald-600 font-medium">{exp.company}</div>
                                        <div className="text-xs text-slate-400 uppercase tracking-wide mt-1">{exp.startDate} – {exp.endDate}</div>
                                    </div>
                                    <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                                        {exp.description}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Projects Section if available */}
                {data.projects && data.projects.length > 0 && (
                    <div className="mt-10">
                        <h2 className="text-2xl font-bold text-slate-900 border-b-2 border-emerald-500 pb-2 mb-8 inline-block">Projects</h2>
                        <div className="grid grid-cols-1 gap-6">
                            {data.projects.map((proj) => (
                                <div key={proj.id} className="bg-slate-50 p-4 rounded-lg">
                                    <h3 className="font-bold text-lg mb-1">{proj.name}</h3>
                                    <p className="text-sm text-slate-600">{proj.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
