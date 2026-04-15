"use client";

import { useAuth } from "@/context/AuthContext";
import { getUserResumes, saveUserResume } from "@/lib/firestore";
import { UserResume, UserProfile, Template } from "@/types";
import { ArrowLeft, Loader2, Save, PenTool, Layout, Download, Trash2, Plus, RefreshCw, Sparkles, FileCode, ArchiveRestore, Target, CheckCircle2, AlertCircle, Info } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import { collection, getDocs, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useRouter, useSearchParams } from "next/navigation";
import TemplateSelector from "@/components/tailor/TemplateSelector";
import { useReactToPrint } from "react-to-print";
import { getUserProfile } from "@/lib/firestore";
import { useFreeModels } from "@/hooks/useFreeModels";

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
    const [selectedEnhanceModel, setSelectedEnhanceModel] = useState<string>("");

    const [saving, setSaving] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [enhancingField, setEnhancingField] = useState<string | null>(null);
    const [templates, setTemplates] = useState<Template[]>([]);
    const [evaluatingAts, setEvaluatingAts] = useState(false);
    const [atsSuggestions, setAtsSuggestions] = useState<string[]>([]);
    const [atsAnalysis, setAtsAnalysis] = useState("");
    const [showAtsModal, setShowAtsModal] = useState(false);
    const [tempJd, setTempJd] = useState("");

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

            // Update local list and active save-state
            setResumes(prev => prev.map(r => r.id === updatedResume.id ? updatedResume : r));
            setSelectedResume(updatedResume);
            toast.success("Resume saved successfully");
        } catch (error) {
            console.error("Save failed", error);
            toast.error("Failed to save resume");
        } finally {
            setSaving(false);
        }
    };

    // Revert Changes Handler
    const handleRevertChanges = () => {
        if (!selectedResume) return;

        if (!window.confirm("This will overwrite your current unsaved changes and revert to the last saved state. Are you sure?")) return;

        // Deep copy from the last saved state (which is the unmodified AI output if never saved before)
        setEditorData(JSON.parse(JSON.stringify(selectedResume.data)));
        setResumeTitle(selectedResume.title || "Untitled Resume");
        setSelectedTemplateId(selectedResume.templateId || (templates.length > 0 ? templates[0].id || null : "modern"));

        toast.success("Reverted to saved state!");
    };

    // Restore Original AI Handler
    const handleRestoreOriginal = () => {
        if (!selectedResume || !selectedResume.originalData) {
            toast.error("Original AI snapshot not found for this older generated resume.");
            return;
        }

        if (!window.confirm("WARNING: This will erase ALL manual edits and saves, completely restoring the resume to the exact original state the AI generated. Proceed?")) return;

        setEditorData(JSON.parse(JSON.stringify(selectedResume.originalData)));
        setResumeTitle(selectedResume.title || "Untitled Resume");
        setSelectedTemplateId(selectedResume.templateId || (templates.length > 0 ? templates[0].id || null : "modern"));

        toast.success("Restored to Original AI state!");
    };

    // AI Enhance Handler
    const handleEnhance = async (type: "summary" | "experience" | "skills" | "project", text: string, context?: string, fieldPath?: string) => {
        if (!selectedEnhanceModel) return toast.error("Please select an AI Model from the panel above first.");
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
                    model: selectedEnhanceModel
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
            } else if (type === "project" && fieldPath) {
                const index = parseInt(fieldPath.split("[")[1].replace("]", ""));
                if (!isNaN(index) && editorData && editorData.projects) {
                    const newProj = [...editorData.projects];
                    newProj[index] = {
                        ...newProj[index],
                        name: data.name || newProj[index].name,
                        description: data.description || newProj[index].description,
                        technologies: data.technologies || newProj[index].technologies
                    };
                    setEditorData({ ...editorData, projects: newProj });
                    toast.success("Project enhanced!");
                }
            }

        } catch (error) {
            console.error("Enhance failed", error);
            toast.error("AI Enhancement failed. Please try again.");
        } finally {
            setEnhancingField(null);
        }
    };

    const handleEvaluateAts = async () => {
        if (!editorData || !selectedResume) return;
        
        const jdToUse = tempJd || selectedResume.jobDescription;
        if (!jdToUse) {
            toast.error("No job description found. Please add one first.");
            setShowAtsModal(true);
            return;
        }

        setEvaluatingAts(true);
        try {
            const res = await fetch("/api/ai/evaluate-ats", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    resumeData: editorData,
                    jobDescription: jdToUse,
                    model: selectedEnhanceModel || "openrouter/free"
                })
            });

            const data = await res.json();
            if (data.error) throw new Error(data.error);

            // Update local state
            setSelectedResume(prev => prev ? ({ 
                ...prev, 
                score: data.score,
                jobDescription: jdToUse 
            }) : null);
            
            setAtsSuggestions(data.suggestions || []);
            setAtsAnalysis(data.analysis || "");
            
            // Auto-save to Firestore
            const updatedResume = {
                ...selectedResume,
                score: data.score,
                jobDescription: jdToUse,
                data: editorData,
                updatedAt: new Date().toISOString()
            };
            await saveUserResume(user!.uid, updatedResume);
            
            toast.success(`ATS Score Updated: ${data.score}%`);
            setShowAtsModal(true); // Show the detailed results
            
        } catch (error) {
            console.error("Evaluation failed", error);
            toast.error("Failed to re-evaluate ATS score");
        } finally {
            setEvaluatingAts(false);
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
                    <select
                        onChange={(e) => setSelectedEnhanceModel(e.target.value)}
                        value={selectedEnhanceModel}
                        className="bg-transparent border border-white/20 text-gray-300 text-xs rounded-lg px-2 py-1.5 outline-none focus:border-purple-500 w-40 text-ellipsis hover:bg-white/5 transition-colors cursor-pointer"
                    >
                        <option value="" disabled className="bg-[#1a1a1a]">Select AI Engine</option>
                        {availableModels.map(model => (
                            <option key={model.id} value={model.id} className="bg-[#1a1a1a]">{model.name}</option>
                        ))}
                    </select>
                    <div className="h-4 w-px bg-white/10 mx-1" />
                    <button
                        onClick={handleRestoreOriginal}
                        className="flex items-center gap-2 px-3 py-2 bg-red-500/5 hover:bg-red-500/10 text-red-400 hover:text-red-300 rounded-lg font-medium text-xs transition-all border border-red-500/10"
                        title="Erase all edits and restore original AI generation state"
                    >
                        <ArchiveRestore className="w-4 h-4" />
                        Original AI
                    </button>
                    <button
                        onClick={handleRevertChanges}
                        className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-lg font-medium text-xs transition-all border border-white/5"
                        title="Undo Unsaved Changes"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Undo Unsaved
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

            {/* ATS Score Floating Badge */}
            <div className="absolute top-20 right-8 z-30 animate-fade-in-left">
                <button 
                    onClick={() => {
                        setTempJd(selectedResume.jobDescription || "");
                        setShowAtsModal(true);
                    }}
                    className="glass-panel p-3 rounded-2xl border-white/10 hover:border-purple-500/50 transition-all group flex items-center gap-3 shadow-2xl"
                >
                    <div className={`p-2 rounded-xl ${
                        (selectedResume.score || 0) >= 90 ? "bg-green-500/20 text-green-400" :
                        (selectedResume.score || 0) >= 75 ? "bg-yellow-500/20 text-yellow-400" :
                        "bg-red-500/20 text-red-400"
                    }`}>
                        <Target className="w-5 h-5" />
                    </div>
                    <div className="text-left pr-2">
                        <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">ATS Match</p>
                        <p className="text-xl font-black text-white">{selectedResume.score || 0}%</p>
                    </div>
                </button>
            </div>

            {/* ATS Analysis Modal */}
            {showAtsModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-[#0f0f12] border border-white/10 rounded-2xl w-full max-w-2xl overflow-hidden flex flex-col shadow-2xl">
                        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <Target className="w-6 h-6 text-purple-400" />
                                ATS Score Re-evaluation
                            </h3>
                            <button onClick={() => setShowAtsModal(false)} className="text-gray-400 hover:text-white transition-colors">
                                <ArchiveRestore className="w-5 h-5 rotate-45" />
                            </button>
                        </div>
                        
                        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                            <div className="flex items-center gap-6">
                                <div className="relative w-24 h-24 flex items-center justify-center">
                                    <svg className="w-full h-full transform -rotate-90">
                                        <circle cx="48" cy="48" r="40" fill="none" stroke="currentColor" strokeWidth="8" className="text-white/5" />
                                        <circle cx="48" cy="48" r="40" fill="none" stroke="currentColor" strokeWidth="8" 
                                            strokeDasharray={`${(selectedResume.score || 0) * 2.51} 251`}
                                            className={`${
                                                (selectedResume.score || 0) >= 90 ? "text-green-500" :
                                                (selectedResume.score || 0) >= 75 ? "text-yellow-500" :
                                                "text-red-500"
                                            } transition-all duration-1000`}
                                        />
                                    </svg>
                                    <span className="absolute text-2xl font-black text-white">{selectedResume.score || 0}%</span>
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-white text-lg">Analysis Result</h4>
                                    <p className="text-gray-400 text-sm italic">{atsAnalysis || "Your resume has been analyzed against the target job description. Re-evaluate to see latest analysis."}</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                    <PenTool className="w-4 h-4" /> Target Job Description
                                </h4>
                                <textarea 
                                    className="w-full h-32 bg-white/5 border border-white/10 rounded-xl p-4 text-xs text-gray-300 focus:border-purple-500 outline-none resize-none scrollbar-hide"
                                    placeholder="Paste the Job Description here to re-evaluate..."
                                    value={tempJd}
                                    onChange={(e) => setTempJd(e.target.value)}
                                />
                                <p className="text-[10px] text-gray-500 italic">Changing the JD will update the context for subsequent AI enhancements.</p>
                            </div>

                            {atsSuggestions.length > 0 && (
                                <div className="space-y-3">
                                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                        <Sparkles className="w-4 h-4 text-purple-400" /> AI Suggestions
                                    </h4>
                                    <div className="grid grid-cols-1 gap-2">
                                        {atsSuggestions.map((s, i) => (
                                            <div key={i} className="flex gap-3 p-3 rounded-xl bg-purple-500/5 border border-purple-500/10 text-gray-300 text-sm">
                                                <div className="mt-1"><CheckCircle2 className="w-4 h-4 text-purple-400" /></div>
                                                {s}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {!tempJd && !selectedResume.jobDescription && (
                                <div className="flex gap-3 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-200/80 text-sm">
                                    <AlertCircle className="w-5 h-5 shrink-0" />
                                    <p>Please paste the job description above to enable AI-powered re-evaluation and personalized suggestions.</p>
                                </div>
                            )}
                        </div>

                        <div className="p-6 border-t border-white/10 bg-white/5 flex gap-3">
                            <button 
                                onClick={() => setShowAtsModal(false)}
                                className="flex-1 px-4 py-3 rounded-xl border border-white/10 text-gray-400 font-bold hover:bg-white/5 transition-all"
                            >
                                Close
                            </button>
                            <button 
                                onClick={handleEvaluateAts}
                                disabled={evaluatingAts || (!tempJd && !selectedResume.jobDescription)}
                                className="flex-[2] px-6 py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-xl font-bold shadow-lg shadow-purple-900/20 transition-all flex items-center justify-center gap-2"
                            >
                                {evaluatingAts ? <Loader2 className="w-4 h-4 animate-spin" /> : <Target className="w-4 h-4" />}
                                {evaluatingAts ? "Evaluating..." : "Update Score & Analyze"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
                            previewData={editorData}
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
                                    <div className="relative">
                                        <textarea
                                            className="w-full h-24 bg-black/20 border border-white/10 rounded p-2 text-xs text-gray-300 focus:border-purple-500 outline-none resize-y pr-20"
                                            value={proj.description}
                                            onChange={(e) => {
                                                const newProj = editorData.projects ? [...editorData.projects] : [];
                                                newProj[idx].description = e.target.value;
                                                setEditorData({ ...editorData, projects: newProj });
                                            }}
                                            placeholder="Project Description..."
                                        />
                                        <button
                                            onClick={() => handleEnhance("project", proj.description, proj.name, `project[${idx}]`)}
                                            disabled={enhancingField === `project[${idx}]`}
                                            className="absolute top-1 right-1 text-[10px] font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1 bg-black/60 px-2 py-1 rounded backdrop-blur-sm border border-purple-500/20 hover:border-purple-500/40 transition-all disabled:opacity-50"
                                        >
                                            {enhancingField === `project[${idx}]` ? (
                                                <Loader2 className="w-3 h-3 animate-spin" />
                                            ) : (
                                                <Sparkles className="w-3 h-3" />
                                            )}
                                            AI Rewrite
                                        </button>
                                    </div>
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
