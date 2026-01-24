import { UserProfile } from "@/types";
import { MapPin, Mail, Globe, Phone, Github } from "lucide-react";

export default function MinimalistTemplate({ data }: { data: UserProfile }) {
    if (!data) return null;

    return (
        <div className="w-full bg-white text-black p-12 min-h-[1100px] font-serif">
            {/* Header */}
            <div className="text-center border-b-2 border-black pb-8 mb-8">
                <h1 className="text-4xl font-bold uppercase tracking-widest mb-4">{data.fullName}</h1>
                <div className="flex flex-wrap justify-center gap-4 text-sm font-medium">
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
                <div className="mb-8 text-center max-w-2xl mx-auto">
                    <p className="italic text-gray-700 leading-relaxed">{data.summary}</p>
                </div>
            )}

            {/* Experience */}
            {data.experience && data.experience.length > 0 && (
                <div className="mb-8">
                    <h2 className="text-xl font-bold uppercase border-b border-gray-300 pb-2 mb-4 tracking-wider">Experience</h2>
                    <div className="space-y-6">
                        {data.experience.map((exp) => (
                            <div key={exp.id}>
                                <div className="flex justify-between items-baseline mb-1">
                                    <h3 className="font-bold text-lg">{exp.company}</h3>
                                    <span className="text-sm italic text-gray-600">{exp.startDate} – {exp.endDate}</span>
                                </div>
                                <div className="text-sm font-semibold mb-2">{exp.role}</div>
                                <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                                    {exp.description}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Education */}
            {data.education && data.education.length > 0 && (
                <div className="mb-8">
                    <h2 className="text-xl font-bold uppercase border-b border-gray-300 pb-2 mb-4 tracking-wider">Education</h2>
                    <div className="space-y-4">
                        {data.education.map((edu) => (
                            <div key={edu.id} className="flex justify-between items-baseline">
                                <div>
                                    <h3 className="font-bold">{edu.school}</h3>
                                    <div className="text-sm text-gray-700">{edu.degree}</div>
                                </div>
                                <span className="text-sm italic text-gray-600">{edu.year}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Skills */}
            {data.skills && (
                <div className="mb-8">
                    <h2 className="text-xl font-bold uppercase border-b border-gray-300 pb-2 mb-4 tracking-wider">Skills</h2>
                    <p className="text-sm leading-relaxed">{data.skills}</p>
                </div>
            )}
        </div>
    );
}
