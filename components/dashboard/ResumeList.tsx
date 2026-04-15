import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { UserResume, Template, UserProfile } from "@/types";
import { FileText, MoreVertical, Download, Trash2, Calendar, Loader2, X, Sparkles, PenTool } from "lucide-react";
import { getUserResumes, deleteUserResume } from "@/lib/firestore";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useReactToPrint } from "react-to-print";
import TemplateSelector from "@/components/tailor/TemplateSelector";

// Templates
import ModernTemplate from "@/components/templates/ModernTemplate";
import MinimalistTemplate from "@/components/templates/MinimalistTemplate";
import CreativeTemplate from "@/components/templates/CreativeTemplate";
import FaangPathTemplate from "@/components/templates/FaangPathTemplate";

const TEMPLATE_MAP: Record<string, React.FC<{ data: UserProfile }>> = {
    "modern": ModernTemplate,
    "minimalist": MinimalistTemplate,
    "creative": CreativeTemplate,
    "faangpath": FaangPathTemplate
};

export default function ResumeList() {
    const { user } = useAuth();
    const router = useRouter();
    const [resumes, setResumes] = useState<UserResume[]>([]);
    const [loading, setLoading] = useState(true);

    // Resume to download (selected for the modal)
    const [resumeToDownload, setResumeToDownload] = useState<UserResume | null>(null);
    const [downloading, setDownloading] = useState(false);

    // Templates
    const [templates, setTemplates] = useState<Template[]>([]);
    const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

    // Printing State
    const [printingResume, setPrintingResume] = useState<UserResume | null>(null);
    const [printingTemplateKey, setPrintingTemplateKey] = useState<string | null>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    const reactToPrintFn = useReactToPrint({
        contentRef,
        onAfterPrint: () => {
            setPrintingResume(null);
            setPrintingTemplateKey(null);
            setDownloading(false);
            setResumeToDownload(null);
        }
    });

    // Trigger print when resume is ready in the DOM
    useEffect(() => {
        if (printingResume && printingTemplateKey && contentRef.current) {
            setTimeout(() => {
                reactToPrintFn();
            }, 500);
        }
    }, [printingResume, printingTemplateKey]);

    useEffect(() => {
        const loadData = async () => {
            if (!user) return;
            try {
                const [resumesData, templatesSnap] = await Promise.all([
                    getUserResumes(user.uid),
                    getDocs(collection(db, "templates"))
                ]);

                setResumes(resumesData as UserResume[]);

                const templateList = templatesSnap.docs
                    .map(d => ({ id: d.id, ...d.data() } as Template))
                    .filter(t => t.isActive);
                setTemplates(templateList);

            } catch (error) {
                console.error("Error loading data:", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
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

    const handleOpenDownloadModal = (resume: UserResume) => {
        if (!resume.data) {
            alert("This resume is missing data. Please regenerate it.");
            return;
        }
        // Set default template selection to the resume's original template if available, else first one
        setResumeToDownload(resume);
        setSelectedTemplateId(resume.templateId || templates[0]?.id || null);
    };

    const confirmDownload = async () => {
        if (!resumeToDownload || !selectedTemplateId) return;
        setDownloading(true);

        try {
            const template = templates.find(t => t.id === selectedTemplateId);
            if (!template) throw new Error("Template not found");

            if (template.type === 'latex' && template.files) {
                // LATEX DOWNLOAD
                const response = await fetch('/api/compile', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        files: template.files,
                        data: resumeToDownload.data
                    })
                });

                if (!response.ok) throw new Error("Compilation failed");

                const blob = await response.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${resumeToDownload.title.replace(/\s+/g, '_')}_${template.name.replace(/\s+/g, '_')}.pdf`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                setDownloading(false);
                setResumeToDownload(null);
            } else {
                // HTML PRINT
                const key = template.componentKey || 'modern';
                setPrintingTemplateKey(key);
                setPrintingResume(resumeToDownload);
                // Print triggered by effect, closes modal onAfterPrint
            }

        } catch (error) {
            console.error("Download error:", error);
            alert("Download failed. Please try again.");
            setDownloading(false);
        }
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
            </div>
        );
    }

    const PrintComponent = printingTemplateKey ? TEMPLATE_MAP[printingTemplateKey] : null;

    return (
        <div className="space-y-6 animate-fade-in-up relative">

            {/* Hidden Print Container */}
            <div style={{ position: "absolute", top: "-9999px", left: "-9999px" }}>
                <div ref={contentRef}>
                    {PrintComponent && printingResume && printingResume.data && (
                        <PrintComponent data={printingResume.data} />
                    )}
                </div>
            </div>

            {/* Download Selection Modal - Portaled to avoid transform clipping/positioning issues */}
            {resumeToDownload && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                    <div className="bg-[#0f0f12] border border-white/10 rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
                        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                            <div>
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-purple-400" />
                                    Download Resume
                                </h3>
                                <p className="text-sm text-gray-400">Select a style for <strong>{resumeToDownload.title}</strong></p>
                            </div>
                            <button
                                onClick={() => setResumeToDownload(null)}
                                className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                            {/* Left: Template Selector */}
                            <div className="w-full md:w-1/3 p-6 overflow-y-auto custom-scrollbar border-r border-white/10 bg-black/20">
                                <h4 className="text-sm font-bold text-gray-400 mb-4 uppercase tracking-wider">Select Template</h4>
                                <TemplateSelector
                                    templates={templates}
                                    selectedId={selectedTemplateId}
                                    onSelect={setSelectedTemplateId}
                                />
                            </div>

                            {/* Right: Live Preview */}
                            {/* Right: Live Preview */}
                            <div className="w-full md:w-2/3 bg-gray-900/50 relative overflow-hidden flex flex-col">
                                <div className="flex-1 bg-black/40 rounded-xl relative overflow-y-auto overflow-x-hidden border border-white/5 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
                                    <div className="min-h-full flex flex-col items-center justify-center py-4">
                                        {selectedTemplateId ? (() => {
                                            const selectedTemplate = templates.find(t => t.id === selectedTemplateId);
                                            const PreviewComponent = selectedTemplate?.componentKey ? TEMPLATE_MAP[selectedTemplate.componentKey] : null;

                                            if (selectedTemplate?.type === 'latex' && !PreviewComponent) {
                                                return (
                                                    <div className="w-full max-w-[500px] aspect-[1/1.414] bg-gray-100 flex flex-col items-center justify-center text-gray-500 p-8 text-center shadow-2xl rounded-sm">
                                                        <FileText className="w-16 h-16 mb-4 text-gray-400" />
                                                        <h4 className="font-bold text-gray-700">LaTeX Template</h4>
                                                        <p className="text-xs mt-2">Server-side rendered. Preview not available in client.</p>
                                                        <p className="text-xs mt-4 text-purple-600 font-bold">PDF will be generated with high-quality typesetting.</p>
                                                    </div>
                                                )
                                            }

                                            if (PreviewComponent && resumeToDownload.data) {
                                                return (
                                                    <div className="scale-[0.45] origin-top shadow-2xl rounded-sm overflow-hidden ring-1 ring-white/10 bg-white">
                                                        <div className="relative" style={{ width: '210mm' }}>
                                                            <PreviewComponent data={resumeToDownload.data} />
                                                        </div>
                                                    </div>
                                                );
                                            }

                                            return (
                                                <div className="flex items-center justify-center h-full text-gray-400">
                                                    Select a template to preview
                                                </div>
                                            )
                                        })() : (
                                            <div className="flex items-center justify-center h-full text-gray-400">
                                                Select a template to preview
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-white/10 bg-white/5 flex justify-end gap-3 z-20 relative">
                            <button
                                onClick={() => setResumeToDownload(null)}
                                className="px-6 py-3 rounded-xl border border-white/10 text-gray-300 font-medium hover:bg-white/5 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDownload}
                                disabled={downloading || !selectedTemplateId}
                                className="px-8 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold shadow-lg shadow-purple-900/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {downloading ? (
                                    <><Loader2 className="w-4 h-4 animate-spin" /> Preparing PDF...</>
                                ) : (
                                    <><Download className="w-4 h-4" /> Download PDF</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

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
                            {/* Preview / Thumbnail */}
                            <div className="aspect-[3/4] bg-white border-b border-white/5 relative flex flex-col items-center justify-start group-hover:scale-[1.02] transition-transform duration-500 overflow-hidden">
                                {resume.data ? (() => {
                                    const template = templates.find(t => t.id === resume.templateId);
                                    const ThumbnailComponent = template?.componentKey ? TEMPLATE_MAP[template.componentKey] : ModernTemplate;

                                    if (ThumbnailComponent) {
                                        return (
                                            <div className="w-full h-full scale-[0.25] origin-top border-none pointer-events-none">
                                                <div style={{ width: '210mm' }}>
                                                    <ThumbnailComponent data={resume.data} isCompact={true} />
                                                </div>
                                            </div>
                                        );
                                    }

                                    return (
                                        <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8 text-center">
                                            <FileText className="w-12 h-12 mb-4 opacity-20" />
                                            <p className="text-[10px] font-bold uppercase tracking-wider">Preview Available</p>
                                        </div>
                                    );
                                })() : (
                                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                        <FileText className="w-12 h-12 mb-4 opacity-20" />
                                        <p className="text-[10px] font-bold uppercase tracking-wider">No Data</p>
                                    </div>
                                )}

                                {/* Overlay Actions */}
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3 backdrop-blur-sm">
                                    <button
                                        onClick={() => router.push(`/profile?tab=studio&resumeId=${resume.id}`)}
                                        className="bg-purple-600 text-white px-4 py-2 rounded-full font-bold text-xs flex items-center gap-2 hover:bg-purple-500 transition-colors transform hover:-translate-y-1 shadow-lg shadow-purple-900/20"
                                    >
                                        <PenTool className="w-3 h-3" /> Edit in Studio
                                    </button>
                                    <button
                                        onClick={() => handleOpenDownloadModal(resume)}
                                        className="bg-white text-black px-4 py-2 rounded-full font-bold text-xs flex items-center gap-2 hover:bg-purple-50 transition-colors transform hover:-translate-y-1"
                                    >
                                        <Download className="w-3 h-3" /> Download PDF
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
                                            ATS Score: {resume.score}%
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
