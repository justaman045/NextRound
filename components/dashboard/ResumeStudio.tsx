"use client";

import { useAuth } from "@/context/AuthContext";
import { getUserResumes, saveUserResume } from "@/lib/firestore";
import { UserResume, UserProfile, Template } from "@/types";
import { ArrowLeft, Loader2, Save, PenTool, Layout, Download, Trash2, Plus, RefreshCw, Sparkles, FileCode } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import { collection, getDocs, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useRouter, useSearchParams } from "next/navigation";
import TemplateSelector from "@/components/tailor/TemplateSelector";
import { useReactToPrint } from "react-to-print";
import { getUserProfile } from "@/lib/firestore";

import PageBreaks from "./PageBreaks";

// Templates
import ModernTemplate from "@/components/templates/ModernTemplate";
import MinimalistTemplate from "@/components/templates/MinimalistTemplate";
import CreativeTemplate from "@/components/templates/CreativeTemplate";
import FaangPathTemplate from "@/components/templates/FaangPathTemplate";

// Map component keys (from Firestore) to actual React Components
const TEMPLATE_MAP: Record<string, React.FC<{ data: UserProfile }>> = {
    "modern": ModernTemplate,
    "minimalist": MinimalistTemplate,
    "creative": CreativeTemplate,
    "faangpath": FaangPathTemplate
};

export default function ResumeStudio() {
    const { user } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [resumes, setResumes] = useState<UserResume[]>([]);
    const [selectedResume, setSelectedResume] = useState<UserResume | null>(null);

    // Editor State
    const [editorData, setEditorData] = useState<UserProfile | null>(null);
    const [resumeTitle, setResumeTitle] = useState("");
    const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
    const [totalPages, setTotalPages] = useState(1);

    const [saving, setSaving] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [enhancingField, setEnhancingField] = useState<string | null>(null);
    const [templates, setTemplates] = useState<Template[]>([]);

    const contentRef = useRef<HTMLDivElement>(null);
    const reactToPrintFn = useReactToPrint({ contentRef });

    // Fetch Resumes & Templates
    const searchParams = useSearchParams();

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;
            try {
                const [resumeList, templateSnapshot] = await Promise.all([
                    getUserResumes(user.uid),
                    getDocs(query(collection(db, "templates")))
                ]);

                setResumes(resumeList);

                const tmpls = templateSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Template)).filter(t => t.isActive);
                setTemplates(tmpls);

            } catch (error) {
                console.error("Failed to fetch data", error);
                toast.error("Failed to load studio data");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user]);

    // Separate effect to handle auto-selection reactively
    useEffect(() => {
        if (loading || resumes.length === 0) return;

        const resumeId = searchParams.get('resumeId');
        if (resumeId) {
            const targetResume = resumes.find(r => r.id === resumeId);
            if (targetResume) {
                // Check if we already have this resume selected to prevent infinite loops/resets
                if (selectedResume?.id !== targetResume.id) {
                    setSelectedResume(targetResume);
                    setEditorData(JSON.parse(JSON.stringify(targetResume.data)));
                    setResumeTitle(targetResume.title || "Untitled Resume");
                    // Ensure templates are loaded before setting
                    const defaultTemplateId = targetResume.templateId || (templates.length > 0 ? templates[0].id || null : "modern");
                    setSelectedTemplateId(defaultTemplateId);
                }
            }
        }
    }, [resumes, templates, loading, searchParams, selectedResume?.id]);

    // Enter Editor Mode
    const handleEditResume = (resume: UserResume) => {
        setSelectedResume(resume);
        setEditorData(JSON.parse(JSON.stringify(resume.data))); // Deep copy
        setResumeTitle(resume.title || "Untitled Resume");
        // Default to existing template or first available
        setSelectedTemplateId(resume.templateId || (templates.length > 0 ? templates[0].id || null : "modern"));
    };

    // Save Handler
    const handleSave = async () => {
        if (!user || !selectedResume || !editorData) return;
        setSaving(true);
        try {
            const updatedResume = {
                ...selectedResume,
                title: resumeTitle,
                templateId: selectedTemplateId || "modern",
                data: editorData,
                updatedAt: new Date().toISOString()
            };

            await saveUserResume(user.uid, updatedResume);

            // Update local list
            setResumes(prev => prev.map(r => r.id === updatedResume.id ? updatedResume : r));
            toast.success("Resume saved successfully");
        } catch (error) {
            console.error("Save failed", error);
            toast.error("Failed to save resume");
        } finally {
            setSaving(false);
        }
    };

    // Sync with Master Profile Handler
    const handleSyncWithMaster = async () => {
        if (!user) return;

        if (!window.confirm("This will overwrite your current resume changes with data from your Master Profile. Are you sure?")) return;

        setSyncing(true);
        try {
            const masterProfile = await getUserProfile(user.uid);
            if (!masterProfile) {
                toast.error("Could not fetch Master Profile");
                return;
            }

            // Deep copy to ensure no reference issues
            setEditorData(JSON.parse(JSON.stringify(masterProfile)));

            toast.success("Reset to Master Profile data!");
        } catch (error) {
            console.error("Sync failed", error);
            toast.error("Failed to sync with Master Profile.");
        } finally {
            setSyncing(false);
        }
    };

    // AI Enhance Handler
    const handleEnhance = async (type: "summary" | "experience" | "skills", text: string, context?: string, fieldPath?: string) => {
        if (!text) return toast.error("Please enter some text to enhance");

        setEnhancingField(fieldPath || type);
        try {
            const response = await fetch("/api/ai/enhance-text", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    text,
                    type,
                    context,
                    model: "gemini-2.5-flash"
                })
            });

            const data = await response.json();

            if (data.error) throw new Error(data.error);

            // Apply changes
            if (type === "summary") {
                setEditorData(prev => prev ? ({ ...prev, summary: data.enhancedText }) : null);
                toast.success("Summary enhanced!");
            } else if (type === "skills") {
                setEditorData(prev => prev ? ({ ...prev, skills: data.enhancedText }) : null);
                toast.success("Skills enhanced!");
            } else if (type === "experience" && fieldPath) {
                const index = parseInt(fieldPath.split("[")[1].replace("]", ""));
                if (!isNaN(index) && editorData && editorData.experience) {
                    const newExp = [...editorData.experience];
                    newExp[index] = {
                        ...newExp[index],
                        role: data.role || newExp[index].role,
                        description: data.description || newExp[index].description
                    };
                    setEditorData({ ...editorData, experience: newExp });
                    toast.success("Experience block enhanced!");
                }
            }

        } catch (error) {
            console.error("Enhance failed", error);
            toast.error("AI Enhancement failed. Please try again.");
        } finally {
            setEnhancingField(null);
        }
    };

    const [compiling, setCompiling] = useState(false);
    const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);

    const handleCompilePreview = async () => {
        if (!selectedTemplateId || !editorData) return;
        setCompiling(true);
        try {
            const template = templates.find(t => t.id === selectedTemplateId);
            if (!template || !template.files) {
                toast.error("Template definition missing");
                return;
            }

            const response = await fetch("/api/compile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    files: template.files,
                    data: editorData
                })
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.details ? `latex: ${err.details.substring(0, 100)}` : (err.error || "Compilation failed"));
            }

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            setPdfPreviewUrl(url);
            toast.success("PDF Compiled Successfully!");
        } catch (error: any) {
            console.error("Compile error", error);
            toast.error(error.message || "Failed to compile PDF");
        } finally {
            setCompiling(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col justify-center items-center h-96 gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-purple-500" />
                <p className="text-gray-400">Loading your resumes...</p>
            </div>
        );
    }

    // LIST VIEW - REPLACED WITH EMPTY STATE / REDIRECT

    if (!selectedResume) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4 animate-fade-in">
                <div className="p-4 bg-white/5 rounded-full">
                    <PenTool className="w-8 h-8 text-gray-400" />
                </div>
                <div className="text-center">
                    <h2 className="text-xl font-bold text-white">No Resume Selected</h2>
                    <p className="text-gray-400 max-w-md mt-2 mb-6">
                        Please go to "My Resumes" and click "Edit" on the resume you wish to modify.
                    </p>
                    <button
                        onClick={() => router.push('/profile?tab=resumes')}
                        className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold transition-colors"
                    >
                        Go to My Resumes
                    </button>
                </div>
            </div>
        );
    }

    // EDITOR VIEW (SPLIT SCREEN)
    const selectedTemplate = templates.find(t => t.id === selectedTemplateId);
    const SelectedComponent = selectedTemplate?.componentKey
        ? TEMPLATE_MAP[selectedTemplate.componentKey] || ModernTemplate
        : ModernTemplate;

    if (!editorData) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black flex flex-col animate-fade-in">
            {/* Use absolute positioning to break out of the dashboard layout constraints for fullscreen feel */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-white/10 bg-black/90 backdrop-blur-md z-20">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.push('/profile?tab=resumes')}
                        className="text-gray-400 hover:text-white transition-colors flex items-center gap-2 text-sm"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back to Library
                    </button>
                    <div className="h-6 w-px bg-white/10 mx-2" />
                    <input
                        type="text"
                        value={resumeTitle}
                        onChange={(e) => setResumeTitle(e.target.value)}
                        className="bg-transparent text-lg font-bold text-white focus:outline-none focus:border-b border-purple-500 w-64"
                    />
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleSyncWithMaster}
                        disabled={syncing}
                        className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-lg font-medium text-xs transition-all border border-white/5"
                        title="Reset to Master Profile"
                    >
                        {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                        Reset to Master
                    </button>
                    <button
                        onClick={() => reactToPrintFn()}
                        className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg font-bold text-xs transition-all"
                    >
                        <Download className="w-4 h-4" />
                        PDF
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-bold shadow-lg shadow-purple-900/20 disabled:opacity-50 transition-all text-xs"
                    >
                        {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                        Save Changes
                    </button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* LEFT: EDITING PANEL */}
                <div className="w-[400px] lg:w-[480px] bg-[#0A0A0A] border-r border-white/10 overflow-y-auto p-6 space-y-8 pb-32">

                    {/* Template Selection */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                <Layout className="w-4 h-4" /> Template Style
                            </h3>
                        </div>
                        <TemplateSelector
                            templates={templates}
                            selectedId={selectedTemplateId}
                            onSelect={setSelectedTemplateId}
                        />
                    </div>

                    <div className="h-px bg-white/10 w-full" />

                    {/* Forms */}
                    <div className="space-y-6">
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Personal Info</h3>
                            <div className="grid grid-cols-2 gap-3">
                                <input
                                    className="bg-white/5 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:border-purple-500 outline-none"
                                    placeholder="Full Name"
                                    value={editorData.fullName}
                                    onChange={(e) => setEditorData({ ...editorData, fullName: e.target.value })}
                                />
                                <input
                                    className="bg-white/5 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:border-purple-500 outline-none"
                                    placeholder="Email"
                                    value={editorData.email}
                                    onChange={(e) => setEditorData({ ...editorData, email: e.target.value })}
                                />
                                <input
                                    className="bg-white/5 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:border-purple-500 outline-none"
                                    placeholder="Phone"
                                    value={editorData.phone}
                                    onChange={(e) => setEditorData({ ...editorData, phone: e.target.value })}
                                />
                                <input
                                    className="bg-white/5 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:border-purple-500 outline-none"
                                    placeholder="Location"
                                    value={editorData.location}
                                    onChange={(e) => setEditorData({ ...editorData, location: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Summary</h3>
                                <button
                                    onClick={() => handleEnhance("summary", editorData.summary)}
                                    disabled={enhancingField === "summary"}
                                    className="text-xs font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1"
                                >
                                    {enhancingField === "summary" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                                    AI Rewrite
                                </button>
                            </div>
                            <textarea
                                className="w-full h-32 bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white focus:border-purple-500 outline-none resize-y leading-relaxed"
                                value={editorData.summary}
                                onChange={(e) => setEditorData({ ...editorData, summary: e.target.value })}
                            />
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Experience</h3>
                                <button
                                    onClick={() => {
                                        setEditorData({
                                            ...editorData,
                                            experience: [
                                                { id: Date.now().toString(), role: "New Role", company: "Company", startDate: "", endDate: "", description: "" },
                                                ...editorData.experience
                                            ]
                                        })
                                    }}
                                    className="p-1 hover:bg-white/10 rounded-full text-purple-400 transition-colors"
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>
                            {editorData.experience.map((exp, idx) => (
                                <div key={idx} className="bg-white/5 border border-white/10 p-4 rounded-xl space-y-3 group hover:border-white/20 transition-colors relative">
                                    <button
                                        onClick={() => {
                                            const newExp = editorData.experience.filter((_, i) => i !== idx);
                                            setEditorData({ ...editorData, experience: newExp });
                                        }}
                                        className="absolute -top-2 -right-2 bg-red-500/20 text-red-400 p-1.5 rounded-full hover:bg-red-500 hover:text-white opacity-0 group-hover:opacity-100 transition-all"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                    <div className="grid grid-cols-2 gap-2">
                                        <input
                                            className="bg-transparent border-b border-white/10 text-white font-bold text-sm py-1 focus:border-purple-500 outline-none"
                                            value={exp.role}
                                            onChange={(e) => {
                                                const newExp = [...editorData.experience];
                                                newExp[idx].role = e.target.value;
                                                setEditorData({ ...editorData, experience: newExp });
                                            }}
                                            placeholder="Role"
                                        />
                                        <input
                                            className="bg-transparent border-b border-white/10 text-gray-300 text-sm py-1 focus:border-purple-500 outline-none text-right"
                                            value={exp.company}
                                            onChange={(e) => {
                                                const newExp = [...editorData.experience];
                                                newExp[idx].company = e.target.value;
                                                setEditorData({ ...editorData, experience: newExp });
                                            }}
                                            placeholder="Company"
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <input
                                            className="bg-transparent border-b border-white/10 text-gray-500 text-xs py-1 focus:border-purple-500 outline-none w-20"
                                            value={exp.startDate}
                                            onChange={(e) => {
                                                const newExp = [...editorData.experience];
                                                newExp[idx].startDate = e.target.value;
                                                setEditorData({ ...editorData, experience: newExp });
                                            }}
                                            placeholder="Start"
                                        />
                                        <span className="text-gray-600 self-center">-</span>
                                        <input
                                            className="bg-transparent border-b border-white/10 text-gray-500 text-xs py-1 focus:border-purple-500 outline-none w-20"
                                            value={exp.endDate}
                                            onChange={(e) => {
                                                const newExp = [...editorData.experience];
                                                newExp[idx].endDate = e.target.value;
                                                setEditorData({ ...editorData, experience: newExp });
                                            }}
                                            placeholder="End"
                                        />
                                    </div>
                                    <div>
                                        <div className="flex justify-end mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleEnhance("experience", exp.description, `${exp.role} at ${exp.company}`, `experience[${idx}]`)}
                                                className="text-[10px] bg-purple-500/10 text-purple-300 px-2 py-0.5 rounded border border-purple-500/20 hover:bg-purple-500/20 flex items-center gap-1"
                                            >
                                                <Sparkles className="w-3 h-3" /> Enhance
                                            </button>
                                        </div>
                                        <textarea
                                            className="w-full h-40 bg-black/20 border border-white/10 rounded p-2 text-xs text-gray-300 focus:border-purple-500 outline-none resize-y"
                                            value={exp.description}
                                            onChange={(e) => {
                                                const newExp = [...editorData.experience];
                                                newExp[idx].description = e.target.value;
                                                setEditorData({ ...editorData, experience: newExp });
                                            }}
                                            placeholder="Description..."
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Education</h3>
                                <button
                                    onClick={() => {
                                        const newEdu = [{ id: Date.now().toString(), school: "University", degree: "Degree", year: "Year" }, ...(editorData.education || [])];
                                        setEditorData({ ...editorData, education: newEdu });
                                    }}
                                    className="p-1 hover:bg-white/10 rounded-full text-purple-400 transition-colors"
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>
                            {(editorData.education || []).map((edu, idx) => (
                                <div key={idx} className="bg-white/5 border border-white/10 p-4 rounded-xl space-y-2 group hover:border-white/20 transition-colors relative">
                                    <button
                                        onClick={() => {
                                            const newEdu = editorData.education.filter((_, i) => i !== idx);
                                            setEditorData({ ...editorData, education: newEdu });
                                        }}
                                        className="absolute -top-2 -right-2 bg-red-500/20 text-red-400 p-1.5 rounded-full hover:bg-red-500 hover:text-white opacity-0 group-hover:opacity-100 transition-all"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                    <input
                                        className="w-full bg-transparent border-b border-white/10 text-white font-bold text-sm py-1 focus:border-purple-500 outline-none"
                                        value={edu.school}
                                        onChange={(e) => {
                                            const newEdu = [...editorData.education];
                                            newEdu[idx].school = e.target.value;
                                            setEditorData({ ...editorData, education: newEdu });
                                        }}
                                        placeholder="School / University"
                                    />
                                    <div className="grid grid-cols-3 gap-2">
                                        <input
                                            className="col-span-2 bg-transparent border-b border-white/10 text-gray-300 text-xs py-1 focus:border-purple-500 outline-none"
                                            value={edu.degree}
                                            onChange={(e) => {
                                                const newEdu = [...editorData.education];
                                                newEdu[idx].degree = e.target.value;
                                                setEditorData({ ...editorData, education: newEdu });
                                            }}
                                            placeholder="Degree"
                                        />
                                        <input
                                            className="bg-transparent border-b border-white/10 text-gray-500 text-xs py-1 focus:border-purple-500 outline-none text-right"
                                            value={edu.year}
                                            onChange={(e) => {
                                                const newEdu = [...editorData.education];
                                                newEdu[idx].year = e.target.value;
                                                setEditorData({ ...editorData, education: newEdu });
                                            }}
                                            placeholder="Year"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Projects</h3>
                                <button
                                    onClick={() => {
                                        const newProj = [{ id: Date.now().toString(), name: "Project Name", description: "Description", technologies: "" }, ...(editorData.projects || [])];
                                        setEditorData({ ...editorData, projects: newProj });
                                    }}
                                    className="p-1 hover:bg-white/10 rounded-full text-purple-400 transition-colors"
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>
                            {(editorData.projects || []).map((proj, idx) => (
                                <div key={idx} className="bg-white/5 border border-white/10 p-4 rounded-xl space-y-2 group hover:border-white/20 transition-colors relative">
                                    <button
                                        onClick={() => {
                                            const newProj = editorData.projects ? editorData.projects.filter((_, i) => i !== idx) : [];
                                            setEditorData({ ...editorData, projects: newProj });
                                        }}
                                        className="absolute -top-2 -right-2 bg-red-500/20 text-red-400 p-1.5 rounded-full hover:bg-red-500 hover:text-white opacity-0 group-hover:opacity-100 transition-all"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                    <input
                                        className="w-full bg-transparent border-b border-white/10 text-white font-bold text-sm py-1 focus:border-purple-500 outline-none"
                                        value={proj.name}
                                        onChange={(e) => {
                                            const newProj = editorData.projects ? [...editorData.projects] : [];
                                            newProj[idx].name = e.target.value;
                                            setEditorData({ ...editorData, projects: newProj });
                                        }}
                                        placeholder="Project Name"
                                    />
                                    <textarea
                                        className="w-full h-24 bg-black/20 border border-white/10 rounded p-2 text-xs text-gray-300 focus:border-purple-500 outline-none resize-y"
                                        value={proj.description}
                                        onChange={(e) => {
                                            const newProj = editorData.projects ? [...editorData.projects] : [];
                                            newProj[idx].description = e.target.value;
                                            setEditorData({ ...editorData, projects: newProj });
                                        }}
                                        placeholder="Project Description..."
                                    />
                                    <input
                                        className="w-full bg-transparent border-b border-white/10 text-gray-500 text-xs py-1 focus:border-purple-500 outline-none"
                                        value={proj.technologies || ""}
                                        onChange={(e) => {
                                            const newProj = editorData.projects ? [...editorData.projects] : [];
                                            newProj[idx].technologies = e.target.value;
                                            setEditorData({ ...editorData, projects: newProj });
                                        }}
                                        placeholder="Technologies (comma separated)"
                                    />
                                </div>
                            ))}
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Skills</h3>
                                <button
                                    onClick={() => handleEnhance("skills", editorData.skills)}
                                    disabled={enhancingField === "skills"}
                                    className="text-xs font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1"
                                >
                                    {enhancingField === "skills" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                                    Optimize
                                </button>
                            </div>
                            <textarea
                                className="w-full h-24 bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white focus:border-purple-500 outline-none resize-y leading-relaxed"
                                value={editorData.skills}
                                onChange={(e) => setEditorData({ ...editorData, skills: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

                {/* RIGHT: LIVE PREVIEW */}
                <div className="flex-1 bg-[#1a1a1a] p-8 lg:p-12 overflow-y-auto flex justify-center">
                    <div className="w-full max-w-[210mm] min-w-[210mm] transition-transform origin-top scale-[0.6] sm:scale-[0.7] md:scale-[0.8] lg:scale-[0.9] xl:scale-100">
                        <div className="bg-white shadow-2xl ring-1 ring-white/10 print:shadow-none print:ring-0 print:m-0 min-h-[297mm] relative group" ref={contentRef}>
                            {selectedTemplate?.type === 'latex' ? (
                                <div className="w-full h-[297mm] relative bg-gray-100 flex flex-col items-center justify-center">
                                    {pdfPreviewUrl ? (
                                        <iframe
                                            src={`${pdfPreviewUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                                            className="w-full h-full border-none"
                                            title="Resume Preview"
                                        />
                                    ) : (
                                        <>
                                            {selectedTemplate.imageUrl ? (
                                                <img
                                                    src={selectedTemplate.imageUrl}
                                                    alt="Preview"
                                                    className="w-full h-full object-contain opacity-90"
                                                />
                                            ) : (
                                                <div className="text-gray-400 text-center p-8">
                                                    <FileCode className="w-16 h-16 mx-auto mb-4 opacity-20" />
                                                    <p className="text-xl font-bold opacity-50">LaTeX Template</p>
                                                </div>
                                            )}

                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-4">
                                                <p className="text-white font-bold text-lg">LaTeX Template Selected</p>
                                                <p className="text-gray-300 text-sm max-w-md text-center px-4">
                                                    This template is generated using LaTeX. The editor on the left works the same, but you must click "Compile PDF" to see the final result.
                                                </p>
                                                <button
                                                    onClick={handleCompilePreview}
                                                    disabled={compiling}
                                                    className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold shadow-lg transition-transform hover:scale-105 flex items-center gap-2 disabled:opacity-50 disabled:scale-100"
                                                >
                                                    {compiling ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileCode className="w-5 h-5" />}
                                                    {compiling ? "Compiling..." : "Compile Preview"}
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ) : (
                                <>
                                    <PageBreaks contentRef={contentRef} scale={1} onPageCountChange={setTotalPages} />
                                    <SelectedComponent data={editorData} />
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
