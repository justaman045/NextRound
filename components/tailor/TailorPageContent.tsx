"use client";

import posthog from "posthog-js";

import { useState, useEffect, useRef } from "react";
import { UserProfile, Template, UserResume } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { getUserProfile, saveUserResume, getUserResumes, incrementResumeUsage, getUserSubscription } from "@/lib/firestore";
import { tailorResume } from "@/actions/generateResume";
import ModernTemplate from "@/components/templates/ModernTemplate";
import MinimalistTemplate from "@/components/templates/MinimalistTemplate";
import CreativeTemplate from "@/components/templates/CreativeTemplate";
import FaangPathTemplate from "@/components/templates/FaangPathTemplate";
import TemplateSelector from "@/components/tailor/TemplateSelector";
import ModelSelector from "@/components/tailor/ModelSelector";
import { useReactToPrint } from "react-to-print";
import { Loader2, ArrowLeft, Download, Wand2, Sparkles, Layout, Menu, Save, FileText, Triangle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Sidebar from "@/components/dashboard/Sidebar";


// Map component keys (from Firestore) to actual React Components
const TEMPLATE_MAP: Record<string, React.FC<{ data: UserProfile }>> = {
    "modern": ModernTemplate,
    "minimalist": MinimalistTemplate,
    "creative": CreativeTemplate,
    "faangpath": FaangPathTemplate
};

export default function TailorPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const [masterProfile, setMasterProfile] = useState<UserProfile | null>(null);
    const [jobDescription, setJobDescription] = useState("");
    const [tailoredProfile, setTailoredProfile] = useState<UserProfile | null>(null);
    const [generating, setGenerating] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Resume Management
    const [resumeTitle, setResumeTitle] = useState("");
    const [userResumes, setUserResumes] = useState<UserResume[]>([]);

    // Page Length Control
    const [pageLength, setPageLength] = useState<"1" | "2">("1");
    // Density Control (Standard vs Compact)
    const [isCompact, setIsCompact] = useState(false);

    // Template State
    const [templates, setTemplates] = useState<Template[]>([]);
    const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
    const [loadingTemplates, setLoadingTemplates] = useState(true);

    // Dynamic Preview Scaling State
    const [previewScale, setPreviewScale] = useState(0.5);
    const previewContainerRef = useRef<HTMLDivElement>(null);

    // LaTeX State
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [generatingPdf, setGeneratingPdf] = useState(false);
    const [savedResumeId, setSavedResumeId] = useState<string | null>(null);

    // AI Model
    const [selectedModel, setSelectedModel] = useState("openrouter/free");

    const contentRef = useRef<HTMLDivElement>(null);
    const reactToPrintFn = useReactToPrint({ contentRef });

    // Subscription State
    const [subscription, setSubscription] = useState<any>(null);

    // Fluid Preview Resizing
    useEffect(() => {
        const updateScale = () => {
            if (previewContainerRef.current) {
                const containerWidth = previewContainerRef.current.clientWidth;
                // A4 is roughly 794px wide. Leave 40px safe margin (20px each side).
                const targetScale = Math.min(1.2, (containerWidth - 40) / 794);
                setPreviewScale(targetScale > 0.2 ? targetScale : 0.5);
            }
        };

        // Delay slight execution to ensure CSS Grid has settled
        const timer = setTimeout(updateScale, 100);
        window.addEventListener('resize', updateScale);
        
        return () => {
            clearTimeout(timer);
            window.removeEventListener('resize', updateScale);
        };
    }, []);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push("/");
        }
        const fetchMaster = async () => {
            if (user) {
                const data = await getUserProfile(user.uid);
                if (data) {
                    setMasterProfile(data);
                } else {
                    // Profile missing
                    // toast.error("Please set up your Master Profile first."); // We need to import toast
                    router.push("/profile");
                }
            }
        };

        const fetchUserResumes = async () => {
            if (user) {
                try {
                    const resumeList = await getUserResumes(user.uid);
                    setUserResumes(resumeList);
                } catch (err) {
                    console.error("Failed to fetch resumes", err);
                }
            }
        }

        const fetchTemplates = async () => {
            try {
                const q = query(collection(db, "templates"));
                const snapshot = await getDocs(q);
                const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Template)).filter(t => t.isActive);

                setTemplates(data);
                if (data.length > 0) {
                    setSelectedTemplateId(data[0].id!);
                }
            } catch (error) {
                console.error("Error fetching templates:", error);
            } finally {
                setLoadingTemplates(false);
            }
        };

        const fetchSub = async () => {
            if (user) {
                // Determine if PRO or FREE
                // We'll use the firestore helper but we need to import it or recreate logic? 
                // We have getUserSubscription in firestore.ts
                const sub = await getUserSubscription(user.uid);
                setSubscription(sub);
            }
        };

        if (user) {
            fetchMaster();
            fetchUserResumes();
            fetchTemplates();
            fetchSub();
        }
    }, [user, authLoading, router]);

    // Enforce Usage Limit
    useEffect(() => {
        if (!authLoading && subscription && userResumes.length > 0) {
            const isPro = subscription.plan === 'pro' || subscription.plan === 'enterprise';
            if (!isPro && userResumes.length >= 1) {
                // Block access
                router.push('/profile?tab=subscription');
            }
        }
    }, [subscription, userResumes, authLoading, router]);

    // Handle Template Change / PDF Generation
    useEffect(() => {
        const generatePdfPreview = async () => {
            if (!tailoredProfile || !selectedTemplateId) return;

            const template = templates.find(t => t.id === selectedTemplateId);
            if (!template) return;

            if (template.type === 'latex' && template.files) {
                setGeneratingPdf(true);
                try {
                    const response = await fetch('/api/compile', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            files: template.files,
                            data: tailoredProfile
                        })
                    });

                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({ details: response.statusText }));
                        console.error("PDF Gen Server Error:", errorData);
                        throw new Error(errorData.details || "Failed to compile PDF");
                    }

                    const blob = await response.blob();
                    const url = URL.createObjectURL(blob);
                    setPdfUrl(url);
                } catch (error) {
                    console.error("PDF Gen Error:", error);
                    // alert("Failed to generate PDF preview."); // Silent fail prefer
                } finally {
                    setGeneratingPdf(false);
                }
            } else {
                setPdfUrl(null); // Switch back to React view
            }
        };

        generatePdfPreview();

        return () => {
            if (pdfUrl) URL.revokeObjectURL(pdfUrl);
        }
    }, [selectedTemplateId, tailoredProfile, templates]);


    const handleGenerate = async () => {
        if (!masterProfile || !jobDescription || !user) return;

        // LIMIT CHECK
        // Free: Limit to 1 resume max.
        // Pro: Unlimited.
        const isPro = subscription?.plan === 'pro' || subscription?.plan === 'enterprise';

        if (!isPro && userResumes.length >= 1) {
            setErrorMessage("You have reached the limit of 1 resume for the Free plan. Please upgrade to create more.");
            return;
        }

        setGenerating(true);
        setErrorMessage(null);
        setSavedResumeId(null);


        try {
            posthog.capture('resume_generation_started', {
                model: selectedModel,
                template: selectedTemplateId,
                pageLength
            });

            const { data: tailoredData, score, pageCount } = await tailorResume(masterProfile, jobDescription, selectedModel, pageLength);

            if (pageCount) {
                setPageLength(pageCount);
            }

            const finalProfile = {
                ...masterProfile,
                ...tailoredData,
                fullName: masterProfile.fullName,
                email: masterProfile.email,
                phone: masterProfile.phone,
                location: masterProfile.location,
                website: masterProfile.website,
                education: masterProfile.education,
                skills: typeof tailoredData.skills === 'string' ? tailoredData.skills : masterProfile.skills
            };
            setTailoredProfile(finalProfile);

            // Save to Firestore logic
            const newResumeId = Date.now().toString();

            // Use custom title if provided, else generated one
            const titleToUse = resumeTitle.trim() || tailoredData.projects?.[0]?.name || `Tailored Resume ${new Date().toLocaleDateString()}`;

            const newResume: any = {
                id: newResumeId,
                title: titleToUse,
                templateId: selectedTemplateId || "modern",
                createdAt: new Date().toISOString(),
                score: score, // Real AI Score
                jobDescription: jobDescription,
                thumbnailUrl: "",

                data: finalProfile, // Save the full tailored profile
                originalData: finalProfile // Immutable snapshot for total resets
            };

            await saveUserResume(user.uid, newResume);

            // Increment usage count
            await incrementResumeUsage(user.uid);

            posthog.capture('resume_generated', {
                resume_id: newResumeId,
                template: selectedTemplateId,
                model: selectedModel,
                pageLength
            });

            // Update local list - always append since we blocked if over limit
            setUserResumes([...userResumes, newResume]);

            setSavedResumeId(newResumeId);

        } catch (error: any) {
            console.error("Error generating resume:", error);
            let msg = "Failed to generate resume. Please try again.";
            if (error.message?.includes("429") || error.message?.includes("Quota")) {
                msg = `Usage Limit Exceeded for ${selectedModel}. Please try a different model.`;
            }
            posthog.capture('resume_generation_failed', {
                error: msg,
                model: selectedModel
            });
            setErrorMessage(msg);
        } finally {
            setGenerating(false);
        }
    };

    const handleDownload = () => {
        if (pdfUrl) {
            const a = document.createElement('a');
            a.href = pdfUrl;
            a.download = `${tailoredProfile?.fullName.replace(/\s+/g, '_')}_Resume.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            posthog.capture('resume_downloaded', {
                type: 'pdf_url'
            });
        } else {
            posthog.capture('resume_downloaded', {
                type: 'print_dialog'
            });
            reactToPrintFn();
        }
    }

    const selectedTemplate = templates.find(t => t.id === selectedTemplateId);
    const SelectedComponent = selectedTemplate?.componentKey
        ? TEMPLATE_MAP[selectedTemplate.componentKey] || ModernTemplate
        : ModernTemplate;

    if (!mounted || authLoading || !masterProfile) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black text-white">
                <Loader2 className="animate-spin w-10 h-10 text-purple-600" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-black text-white flex flex-col md:flex-row overflow-hidden font-sans selection:bg-purple-500/30">

            <div className="md:hidden flex items-center justify-between p-4 border-b border-white/10 bg-black/80 backdrop-blur-md sticky top-0 z-50">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                        <Triangle className="w-3 h-3 text-black fill-current" />
                    </div>
                    <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">NextRound</span>
                </div>
                <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-gray-300">
                    <Menu className="w-6 h-6" />
                </button>
            </div>

            {/* Sidebar (Mocking active state) */}
            <div className={`fixed inset-0 z-40 transform transition-transform duration-300 md:relative md:translate-x-0 md:inset-auto ${mobileMenuOpen ? "translate-x-0 bg-black/95" : "-translate-x-full"}`}>
                <Sidebar activeTab="resumes" setActiveTab={(tab) => router.push("/profile")} />
            </div>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto h-[100dvh] relative scroll-smooth p-4 md:p-8 lg:p-12 pb-24 md:pb-8">
                {/* Background Gradients */}
                <div className="fixed inset-0 pointer-events-none z-0">
                    <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[100px]" />
                </div>

                <div className="relative z-10 max-w-7xl mx-auto space-y-8">

                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6 pt-12 md:pt-0">
                        <div>
                            <Link href="/profile" className="flex items-center text-gray-400 hover:text-white transition-colors mb-2 text-sm">
                                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
                            </Link>
                            <h1 className="text-3xl font-bold text-white">Resume Studio</h1>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-bold uppercase tracking-widest w-fit">
                            <Sparkles className="w-4 h-4" /> AI Powered
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">

                        {/* Left Panel: Input */}
                        <div className="space-y-6 flex flex-col h-full">
                            <div className="glass-panel p-6 rounded-2xl flex-1 flex flex-col">
                                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs">1</span>
                                    Resume Details
                                </h2>

                                <div className="space-y-4 mb-4">
                                    {/* Model Selector */}
                                    <ModelSelector
                                        selectedModel={selectedModel}
                                        onSelect={setSelectedModel}
                                        disabled={generating}
                                    />



                                    <div>
                                        <label className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-2 block">Resume Name</label>
                                        <div className="relative">
                                            <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                            <input
                                                type="text"
                                                value={resumeTitle}
                                                onChange={(e) => setResumeTitle(e.target.value)}
                                                className="glass-input w-full pl-10 p-3 rounded-xl text-sm"
                                                placeholder="e.g. Senior Frontend at Google"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-2 block">Target Length</label>
                                        <select 
                                            value={pageLength}
                                            onChange={(e) => setPageLength(e.target.value as "1" | "2" | "auto" as any)}
                                            className="glass-input w-full p-3 rounded-xl text-sm outline-none cursor-pointer focus:ring-2 focus:ring-purple-500/50 transition-all"
                                        >
                                            <option className="bg-gray-900 text-white py-2" value="auto">Auto-Detect (Based on Experience)</option>
                                            <option className="bg-gray-900 text-white py-2" value="1">Strictly 1 Page (Concise & Impactful)</option>
                                            <option className="bg-gray-900 text-white py-2" value="2">Up to 2 Pages (Rich & Detailed)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-2 block">Job Description</label>
                                        <textarea
                                            value={jobDescription}
                                            onChange={(e) => setJobDescription(e.target.value)}
                                            className="glass-input w-full p-5 rounded-xl resize-none text-sm leading-relaxed min-h-[220px]"
                                            placeholder="Paste the full job description here to let our AI analyze keyword matches and tailor your resume..."
                                        />
                                    </div>
                                </div>

                                <div className="mt-6">
                                    <button
                                        onClick={handleGenerate}
                                        disabled={generating || !jobDescription.trim()}
                                        className="w-full flex items-center justify-center gap-3 glass-button px-6 py-4 rounded-xl disabled:opacity-50 font-bold text-lg shadow-xl"
                                    >
                                        {generating ? <Loader2 className="animate-spin w-5 h-5" /> : <Wand2 className="w-5 h-5" />}
                                        {generating ? "Tailoring Resume..." : "Generate Resume"}
                                    </button>
                                </div>
                                {errorMessage && <div className="mt-4 p-4 rounded-xl bg-red-500/20 text-red-200 text-sm border border-red-500/20">{errorMessage}</div>}
                                {savedResumeId && <div className="mt-4 p-4 rounded-xl bg-green-500/20 text-green-200 text-sm border border-green-500/20 flex items-center gap-2"><Save className="w-4 h-4" /> Saved to your dashboard!</div>}
                            </div>
                        </div>

                        {/* Right Panel: Preview */}
                        <div className="space-y-6 flex flex-col h-full">
                            <div className="glass-panel p-6 rounded-2xl flex-1 flex flex-col relative overflow-hidden">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                        <span className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs">2</span>
                                        Preview & Download
                                    </h2>
                                    {tailoredProfile && (
                                        <button
                                            onClick={handleDownload}
                                            className="flex items-center gap-2 bg-white text-black hover:bg-gray-200 px-4 py-2 rounded-lg font-bold text-xs transition-colors shadow-lg"
                                        >
                                            <Download className="w-4 h-4" /> PDF
                                        </button>
                                    )}
                                </div>

                                {templates.length > 0 && (
                                    <div className="mb-4">
                                        <TemplateSelector
                                            templates={templates}
                                            selectedId={selectedTemplateId}
                                            onSelect={setSelectedTemplateId}
                                            previewData={tailoredProfile || masterProfile || undefined}
                                        />
                                    </div>
                                )}

                                <div ref={previewContainerRef} className="flex-1 bg-black/40 rounded-xl relative overflow-y-auto overflow-x-hidden border border-white/5 w-full">
                                    <div className="min-h-full flex flex-col items-center py-8 w-full">
                                        {/* Preview Content */}
                                        {(tailoredProfile || masterProfile) ? (
                                            <>
                                                {/* Status overlay for Preview Mode */}
                                                {!tailoredProfile && (
                                                    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 px-3 py-1 bg-blue-500/90 text-white text-xs font-bold rounded-full shadow-lg backdrop-blur-md flex items-center gap-2 pointer-events-none">
                                                        <Sparkles className="w-3 h-3" /> Live Template Preview (Master Data)
                                                    </div>
                                                )}

                                                {generatingPdf && (
                                                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm">
                                                        <Loader2 className="animate-spin w-12 h-12 text-purple-500 mb-4" />
                                                        <span className="text-white font-bold animate-pulse">Designing PDF...</span>
                                                    </div>
                                                )}
                                                {pdfUrl ? (
                                                    <iframe
                                                        src={`${pdfUrl}#toolbar=0&navpanes=0&view=FitH`}
                                                        className="w-full h-full rounded-lg shadow-2xl"
                                                        title="Resume Preview"
                                                    />
                                                ) : (
                                                    <div 
                                                        className="origin-top shadow-2xl rounded-sm overflow-hidden ring-1 ring-white/10 bg-white"
                                                        style={{ 
                                                            transform: `scale(${previewScale})`,
                                                            marginBottom: `-${(1 - previewScale) * (contentRef.current?.offsetHeight || 1120)}px` 
                                                        }}
                                                    >
                                                        <div ref={contentRef} className="relative" style={{ width: '210mm' }}>
                                                            {/* Visual Page 1/Page 2 Divider for 2-Page mode */}
                                                            {pageLength === "2" && (
                                                                <div className="absolute top-[297mm] left-0 w-full border-t-2 border-dashed border-blue-400 z-50 pointer-events-none print:hidden flex justify-center opacity-80">
                                                                    <span className="bg-blue-400 text-white text-[10px] font-bold px-3 py-1 rounded-b uppercase tracking-widest shadow-sm">Page 2 Boundary</span>
                                                                </div>
                                                            )}
                                                            {/* Use tailoredProfile if available, else masterProfile for preview */}
                                                            <SelectedComponent
                                                                data={(tailoredProfile || masterProfile) as UserProfile}
                                                                isCompact={isCompact}
                                                                enablePagination={pageLength === "2"}
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <div className="text-center text-gray-500 py-20">
                                                <div className="w-20 h-24 mx-auto mb-4 rounded border-2 border-dashed border-gray-700 bg-white/5 flex items-center justify-center">
                                                    <Layout className="w-8 h-8 text-gray-700" />
                                                </div>
                                                <p className="text-sm">Loading preview...</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
