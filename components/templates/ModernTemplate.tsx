import { UserProfile } from "@/types";
import { Mail, MapPin, Phone, Globe } from "lucide-react";

interface Props {
    data: UserProfile;
}

export default function ModernTemplate({ data }: Props) {
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
        <div className="bg-white text-gray-800 p-10 max-w-[210mm] mx-auto min-h-[297mm] shadow-none print:shadow-none print:w-full print:max-w-none">
            {/* Header */}
            <header className="border-b-2 border-gray-800 pb-6 mb-8">
                <h1 className="text-4xl font-bold uppercase tracking-wider mb-4">{data.fullName}</h1>
                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                    {data.email && (
                        <div className="flex items-center gap-1">
                            <Mail className="w-4 h-4" />
                            <span>{data.email}</span>
                        </div>
                    )}
                    {data.phone && (
                        <div className="flex items-center gap-1">
                            <Phone className="w-4 h-4" />
                            <span>{data.phone}</span>
                        </div>
                    )}
                    {data.location && (
                        <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            <span>{data.location}</span>
                        </div>
                    )}
                    {data.website && (
                        <div className="flex items-center gap-1">
                            <Globe className="w-4 h-4" />
                            <span>{data.website}</span>
                        </div>
                    )}
                </div>
            </header>

            {/* Summary */}
            {data.summary && (
                <section className="mb-8">
                    <h2 className="text-lg font-bold uppercase tracking-widest border-b border-gray-300 pb-1 mb-3">Professional Summary</h2>
                    <p className="text-sm leading-relaxed text-gray-700">{data.summary}</p>
                </section>
            )}

            {/* Experience */}
            {data.experience.length > 0 && (
                <section className="mb-8">
                    <h2 className="text-lg font-bold uppercase tracking-widest border-b border-gray-300 pb-1 mb-4">Experience</h2>
                    <div className="space-y-6">
                        {data.experience.map((exp) => (
                            <div key={exp.id}>
                                <div className="flex justify-between items-baseline mb-1">
                                    <h3 className="font-bold text-base">{exp.role}</h3>
                                    <span className="text-sm text-gray-500 font-medium whitespace-nowrap">
                                        {exp.startDate} – {exp.endDate}
                                    </span>
                                </div>
                                <div className="text-sm font-semibold text-gray-700 mb-2">{exp.company}</div>
                                <ul className="list-disc list-outside ml-4 space-y-1">
                                    {getBullets(exp.description).map((bullet, idx) => (
                                        <li key={idx} className="text-sm text-gray-600 leading-snug pl-1">
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
                <section className="mb-8">
                    <h2 className="text-lg font-bold uppercase tracking-widest border-b border-gray-300 pb-1 mb-4">Education</h2>
                    <div className="space-y-4">
                        {data.education.map((edu) => (
                            <div key={edu.id}>
                                <div className="flex justify-between items-baseline">
                                    <h3 className="font-bold text-gray-800">{edu.school}</h3>
                                    <span className="text-sm text-gray-500">{edu.year}</span>
                                </div>
                                <div className="text-sm text-gray-600">{edu.degree}</div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Skills */}
            {data.skills && (
                <section className="mb-8">
                    <h2 className="text-lg font-bold uppercase tracking-widest border-b border-gray-300 pb-1 mb-3">Skills</h2>
                    <div className="flex flex-wrap gap-2">
                        {getSkills(data.skills).map((skill, idx) => (
                            <span key={idx} className="text-sm bg-gray-100 px-2 py-1 rounded text-gray-700 font-medium">
                                {skill}
                            </span>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}
