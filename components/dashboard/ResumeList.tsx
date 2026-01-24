"use client";

import { useEffect, useState } from "react";
import { UserResume, Template } from "@/types";
import { FileText, MoreVertical, Download, Trash2, Calendar, Loader2 } from "lucide-react";
import { getUserResumes, deleteUserResume } from "@/lib/firestore";
import { useAuth } from "@/context/AuthContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function ResumeList() {
    const { user } = useAuth();
    const [resumes, setResumes] = useState<UserResume[]>([]);
    const [loading, setLoading] = useState(true);
    const [downloadingId, setDownloadingId] = useState<string | null>(null);

    const fetchResumes = async () => {
        if (!user) return;
        try {
            const data = await getUserResumes(user.uid);
            setResumes(data as UserResume[]);
        } catch (error) {
            console.error("Error fetching resumes:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchResumes();
    }, [user]);

    const handleDelete = async (resumeId: string) => {
        if (!user || !confirm("Are you sure you want to delete this resume?")) return;
        try {
            await deleteUserResume(user.uid, resumeId);
            setResumes(prev => prev.filter(r => r.id !== resumeId));
        } catch (error) {
            console.error("Error deleting resume:", error);
            alert("Failed to delete resume.");
        }
    };

    const handleDownload = async (resume: UserResume) => {
        if (!resume.data) {
            alert("This resume was generated with an older version. Please delete and regenerate it to enable PDF downloading.");
            return;
        }
        setDownloadingId(resume.id);

        try {
            // 1. Fetch Template to get files
            const templateRef = doc(db, "templates", resume.templateId);
            const templateSnap = await getDoc(templateRef);

            if (!templateSnap.exists()) {
                throw new Error("Template not found");
            }

            const template = templateSnap.data() as Template;

            if (template.type !== 'latex' || !template.files) {
                alert("Only LaTeX templates support PDF download currently.");
                return;
            }

            // 2. Call API
            const response = await fetch('/api/compile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    files: template.files,
                    data: resume.data
                })
            });

            if (!response.ok) throw new Error("Compilation failed");

            // 3. Download
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${resume.title.replace(/\s+/g, '_')}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

        } catch (error) {
            console.error("Download error:", error);
            alert("Failed to generate PDF. Please try again.");
        } finally {
            setDownloadingId(null);
        }
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-white">My Resumes</h2>
                    <p className="text-gray-400 text-sm">Manage your AI-tailored resumes.</p>
                </div>
            </div>

            {resumes.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 border border-dashed border-white/10 rounded-2xl bg-white/5">
                    <FileText className="w-12 h-12 text-gray-600 mb-4" />
                    <p className="text-gray-400">No resumes generated yet.</p>
                    <p className="text-gray-600 text-sm mt-1">Go to the "Master Profile" or "Tailor" page to create one!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {resumes.map((resume) => (
                        <div key={resume.id} className="group relative bg-white/5 border border-white/10 hover:border-purple-500/50 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:bg-white/[0.07]">
                            {/* Preview / Thumbnail Placeholder */}
                            <div className="aspect-[3/4] bg-gradient-to-br from-gray-800 to-gray-900 border-b border-white/5 relative p-4 flex flex-col items-center justify-center group-hover:scale-[1.02] transition-transform duration-500">
                                {/* Mini Doc Preview */}
                                <div className="w-3/4 h-3/4 bg-white/90 shadow-xl rounded-sm p-4 text-[6px] text-gray-800 overflow-hidden opacity-80 group-hover:opacity-100 transition-opacity">
                                    <div className="w-12 h-12 bg-gray-200 rounded-full mb-2"></div>
                                    <div className="h-2 w-24 bg-gray-800 mb-1 rounded"></div>
                                    <div className="h-1.5 w-16 bg-gray-400 mb-4 rounded"></div>
                                    <div className="space-y-1">
                                        {[1, 2, 3, 4, 5, 6, 7].map(i => <div key={i} className="h-1 w-full bg-gray-300 rounded"></div>)}
                                    </div>
                                </div>

                                {/* Overlay Actions */}
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3 backdrop-blur-sm">
                                    <button
                                        onClick={() => handleDownload(resume)}
                                        disabled={downloadingId === resume.id}
                                        className="bg-white text-black px-4 py-2 rounded-full font-bold text-xs flex items-center gap-2 hover:bg-purple-50 transition-colors transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {downloadingId === resume.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                                        {downloadingId === resume.id ? "Generating..." : "Download PDF"}
                                    </button>
                                    <button
                                        onClick={() => handleDelete(resume.id)}
                                        className="bg-red-500/20 text-red-200 border border-red-500/30 px-4 py-2 rounded-full font-medium text-xs flex items-center gap-2 hover:bg-red-500/30 transition-colors"
                                    >
                                        <Trash2 className="w-3 h-3" /> Delete
                                    </button>
                                </div>
                            </div>

                            {/* Card Info */}
                            <div className="p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-semibold text-white truncate pr-2" title={resume.title}>{resume.title}</h3>
                                    {resume.score && (
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${resume.score >= 90 ? "bg-green-500/10 text-green-400 border-green-500/20" :
                                            resume.score >= 70 ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" :
                                                "bg-red-500/10 text-red-400 border-red-500/20"
                                            }`}>
                                            {resume.score}%
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <Calendar className="w-3 h-3" />
                                    {new Date(resume.createdAt).toLocaleDateString()}
                                </div>
                            </div>

                            {/* Three dot menu (optional) */}
                            <button className="absolute top-3 right-3 text-gray-400 hover:text-white p-1 rounded-md hover:bg-black/40">
                                <MoreVertical className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
