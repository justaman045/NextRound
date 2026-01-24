"use client";

import posthog from "posthog-js";

import { useEffect, useState } from "react";
import { UserProfile, Experience, Education, Project, CustomSectionItem, CustomSection, Subscription } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { getUserProfile, saveUserProfile, getUserSubscription } from "@/lib/firestore";
import { Plus, Trash2, Save, Loader2, ArrowRight, Wand2, Sparkles, Lock } from "lucide-react";
import Link from "next/link";
import { AI_MODELS } from "./tailor/ModelSelector";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface ProfileFormProps {
    initialProfile?: UserProfile | null;
}

// Helper to prevent React key duplication by regenerating non-unique IDs
const sanitizeIds = (items: any[]) => {
    const seenIds = new Set();
    return (items || []).map(item => {
        if (seenIds.has(item.id)) {
            return { ...item, id: Math.random().toString(36).substr(2, 9) };
        }
        seenIds.add(item.id);
        return item;
    });
};

export default function ProfileForm({ initialProfile }: ProfileFormProps) {
    const { user } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(!initialProfile);
    const [saving, setSaving] = useState(false);
    const [selectedModel, setSelectedModel] = useState<string>("gemini-2.5-flash");
    const [enhancingState, setEnhancingState] = useState<Record<string, boolean>>({});
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [profile, setProfile] = useState<UserProfile>(() => {
        if (initialProfile) {
            return {
                ...initialProfile,
                experience: sanitizeIds(initialProfile.experience),
                education: sanitizeIds(initialProfile.education),
                projects: sanitizeIds(initialProfile.projects),
                customSections: (initialProfile.customSections || []).map(s => ({
                    ...s,
                    items: sanitizeIds(s.items)
                }))
            };
        }
        return {
            fullName: "",
            email: "",
            phone: "",
            location: "",
            website: "",
            summary: "",
            experience: [],
            education: [],
            projects: [],
            skills: "",
        };
    });

    useEffect(() => {
        if (initialProfile) {
            // Already handled in useState override
            setLoading(false);
            return;
        }

        const fetchProfile = async () => {
            if (user) {
                try {
                    const data = await getUserProfile(user.uid);
                    if (data) {
                        setProfile(prev => ({
                            ...prev,
                            ...data,
                            experience: sanitizeIds(data.experience),
                            education: sanitizeIds(data.education),
                            projects: sanitizeIds(data.projects),
                            customSections: (data.customSections || []).map(s => ({
                                ...s,
                                items: sanitizeIds(s.items)
                            }))
                        }));
                    } else {
                        setProfile(prev => ({
                            ...prev,
                            fullName: user.displayName || "",
                            email: user.email || ""
                        }));
                    }
                } catch (error) {
                    console.error("Error fetching profile:", error);
                }
            }
            setLoading(false);
        };
        fetchProfile();
    }, [user, initialProfile]);

    // Fetch subscription
    useEffect(() => {
        const fetchSubscription = async () => {
            if (user) {
                try {
                    const sub = await getUserSubscription(user.uid);
                    setSubscription(sub);
                } catch (error) {
                    console.error("Error fetching subscription:", error);
                }
            }
        };
        fetchSubscription();
    }, [user]);

    const handleAnalyzeProfile = async () => {
        if (!user) return;

        // Gate feature for free users
        if (subscription?.plan === 'free') {
            router.push('/profile?tab=subscription');
            return;
        }

        setAnalyzing(true);
        setError(null);
        try {
            const res = await fetch("/api/ai/analyze-profile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ profile })
            });

            let data;
            try {
                data = await res.json();
            } catch (e) {
                throw new Error("Failed to parse API response");
            }

            if (!res.ok) {
                throw new Error(data.error || "Analysis failed");
            }

            // Store analysis in masterProfileAnalysis
            const updatedProfile = {
                ...profile,
                masterProfileAnalysis: {
                    role: data.role,
                    seniority: data.seniority,
                    yearsOfExperience: data.yearsOfExperience,
                    summary: data.summary,
                    model: data.model,
                    date: new Date().toISOString(),
                    projectInsight: data.projectInsight
                }
            };

            await saveUserProfile(user.uid, updatedProfile);
            setProfile(updatedProfile);
            router.refresh();
            toast.success("Master Profile analyzed successfully!");

        } catch (error: any) {
            console.error("Analysis failed:", error);
            setError(error.message || "Failed to analyze");
            toast.error(error.message || "Failed to analyze profile");
        } finally {
            setAnalyzing(false);
        }
    };

    const handleSave = async () => {
        if (!user) return;
        setSaving(true);
        try {
            await saveUserProfile(user.uid, profile);

            posthog.capture('profile_updated', {
                uid: user.uid
            });

            alert("Profile saved successfully!");
        } catch (error) {
            console.error("Error saving profile:", error);
            alert("Failed to save profile.");
        } finally {
            setSaving(false);
        }
    };

    const handleEnhanceText = async (id: string, text: string, type: "summary" | "experience" | "project" | "skills", context?: string) => {
        if (!text) return;

        // Gate feature for free users
        if (subscription?.plan === 'free') {
            router.push('/profile?tab=subscription');
            return;
        }

        setEnhancingState(prev => ({ ...prev, [id]: true }));

        try {
            const res = await fetch('/api/ai/enhance-text', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text,
                    type,
                    context,
                    model: selectedModel
                })
            });

            if (!res.ok) throw new Error("Enhancement failed");
            const data = await res.json();

            posthog.capture('ai_enhancement_used', {
                field: id,
                type: type,
                model: selectedModel
            });

            // Update state based on type
            if (type === "summary") {
                setProfile(prev => ({ ...prev, summary: data.enhancedText }));
            } else if (type === "experience") {
                // Handle multi-field update for experience (role + description)
                // The API now returns a JSON object directly for this type
                if (data.role && data.description) {
                    setProfile(prev => ({
                        ...prev,
                        experience: prev.experience.map(exp => exp.id === id ? { ...exp, role: data.role, description: data.description } : exp)
                    }));
                } else {
                    // Fallback for generic text
                    updateExperience(id, "description", data.enhancedText || data.description || "");
                }
            } else if (type === "project") {
                // Handle multi-field update for project (name + description + technologies)
                if (data.name && data.description) {
                    setProfile(prev => ({
                        ...prev,
                        projects: (prev.projects || []).map(p => p.id === id ?
                            { ...p, name: data.name, description: data.description, technologies: data.technologies || p.technologies }
                            : p)
                    }));
                } else {
                    updateProject(id, "description", data.enhancedText || data.description || "");
                }
            } else if (type === "skills") {
                setProfile(prev => ({ ...prev, skills: data.enhancedText }));
            }

            toast.success("Enhanced successfully!");

        } catch (error) {
            console.error("Enhance error:", error);
            toast.error("Failed to enhance text.");
        } finally {
            setEnhancingState(prev => ({ ...prev, [id]: false }));
        }
    };

    // Helper functions
    const addExperience = () => {
        setProfile(prev => ({ ...prev, experience: [...prev.experience, { id: Date.now().toString(), role: "", company: "", startDate: "", endDate: "", description: "" }] }));
    };
    const removeExperience = (id: string) => {
        setProfile(prev => ({ ...prev, experience: prev.experience.filter(exp => exp.id !== id) }));
        toast.info("Item removed. Click Save to persist.", { duration: 2000 });
    };
    const updateExperience = (id: string, field: keyof Experience, value: string) => {
        setProfile(prev => ({ ...prev, experience: prev.experience.map(exp => exp.id === id ? { ...exp, [field]: value } : exp) }));
    };
    const addEducation = () => {
        setProfile(prev => ({ ...prev, education: [...prev.education, { id: Date.now().toString(), school: "", degree: "", year: "" }] }));
    };
    const removeEducation = (id: string) => {
        setProfile(prev => ({ ...prev, education: prev.education.filter(edu => edu.id !== id) }));
        toast.info("Item removed. Click Save to persist.", { duration: 2000 });
    };
    const updateEducation = (id: string, field: keyof Education, value: string) => {
        setProfile(prev => ({ ...prev, education: prev.education.map(edu => edu.id === id ? { ...edu, [field]: value } : edu) }));
    };

    const addProject = () => {
        setProfile(prev => ({ ...prev, projects: [...(prev.projects || []), { id: Date.now().toString(), name: "", description: "", technologies: "", link: "" }] }));
    };
    const removeProject = (id: string) => {
        setProfile(prev => ({ ...prev, projects: (prev.projects || []).filter(p => p.id !== id) }));
        toast.info("Item removed. Click Save to persist.", { duration: 2000 });
    };
    const updateProject = (id: string, field: keyof Project, value: string) => {
        setProfile(prev => ({ ...prev, projects: (prev.projects || []).map(p => p.id === id ? { ...p, [field]: value } : p) }));
    };

    // Custom Sections Helpers
    const addCustomSection = () => {
        setProfile(prev => ({
            ...prev,
            customSections: [...(prev.customSections || []), { id: Date.now().toString(), title: "", items: [] }]
        }));
    };
    const removeCustomSection = (id: string) => {
        setProfile(prev => ({ ...prev, customSections: (prev.customSections || []).filter(s => s.id !== id) }));
    };
    const updateCustomSectionTitle = (id: string, title: string) => {
        setProfile(prev => ({
            ...prev,
            customSections: (prev.customSections || []).map(s => s.id === id ? { ...s, title } : s)
        }));
    };
    const addCustomItem = (sectionId: string) => {
        setProfile(prev => ({
            ...prev,
            customSections: (prev.customSections || []).map(s => s.id === sectionId ? {
                ...s,
                items: [...s.items, { id: Date.now().toString(), name: "" }]
            } : s)
        }));
    };
    const removeCustomItem = (sectionId: string, itemId: string) => {
        setProfile(prev => ({
            ...prev,
            customSections: (prev.customSections || []).map(s => s.id === sectionId ? {
                ...s,
                items: s.items.filter(i => i.id !== itemId)
            } : s)
        }));
    };
    const updateCustomItem = (sectionId: string, itemId: string, field: keyof CustomSectionItem, value: string) => {
        setProfile(prev => ({
            ...prev,
            customSections: (prev.customSections || []).map(s => s.id === sectionId ? {
                ...s,
                items: s.items.map(i => i.id === itemId ? { ...i, [field]: value } : i)
            } : s)
        }));
    };
    return (
        <div className="space-y-8 glass-panel p-8 rounded-2xl border border-white/10 relative overflow-hidden">
            {/* Decorative background blur */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

            <div className="flex justify-between items-center border-b border-white/10 pb-6 relative z-10">
                <div>
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent tracking-tight">Master Profile</h2>
                    <p className="text-sm text-gray-400 mt-1">Your core data for AI tailoring.</p>
                </div>
                <div className="flex gap-4 items-center">
                    {/* Model Selector */}
                    <div className="hidden md:flex items-center gap-2">
                        <select
                            value={selectedModel}
                            onChange={(e) => setSelectedModel(e.target.value)}
                            className="bg-black/40 border border-white/10 rounded-lg text-xs text-gray-300 px-3 py-2.5 focus:outline-none focus:border-purple-500 cursor-pointer hover:bg-white/5 transition-colors"
                        >
                            {AI_MODELS.map((model) => (
                                <option key={model.id} value={model.id} className="bg-[#161b22] text-white">
                                    {model.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <button
                        onClick={handleAnalyzeProfile}
                        disabled={analyzing}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold tracking-wide shadow-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed
                            ${subscription?.plan !== 'free'
                                ? "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white hover:shadow-purple-500/30"
                                : "bg-gray-800 border border-gray-700 text-gray-400 hover:bg-gray-700"
                            }`}
                    >
                        {analyzing ? (
                            <>
                                <Loader2 className="animate-spin w-4 h-4" />
                                Analyzing...
                            </>
                        ) : subscription?.plan !== 'free' ? (
                            <>
                                <Sparkles className="w-4 h-4 text-yellow-300" />
                                Analyze with AI
                            </>
                        ) : (
                            <>
                                <Lock className="w-4 h-4" />
                                Upgrade to Analyze
                            </>
                        )}
                    </button>

                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 glass-button px-6 py-2.5 rounded-xl disabled:opacity-50 text-sm font-bold tracking-wide shadow-lg hover:shadow-purple-500/20"
                    >
                        {saving ? <Loader2 className="animate-spin w-4 h-4" /> : <Save className="w-4 h-4" />}
                        Save Changes
                    </button>
                </div>
            </div>

            {/* AI Analysis Results */}
            {profile.masterProfileAnalysis && (
                <div className="bg-gradient-to-br from-purple-900/40 to-black border border-purple-500/50 rounded-xl p-6 backdrop-blur-md shadow-[0_0_15px_rgba(168,85,247,0.2)] relative group animate-fade-in-up">
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-xs text-purple-300 font-bold uppercase tracking-wider flex items-center gap-2">
                            <Sparkles className="w-4 h-4" /> Master Profile Analysis
                        </p>

                        {/* Re-analyze Button with Cooldown */}
                        {(() => {
                            const lastDate = new Date(profile.masterProfileAnalysis.date || 0);
                            const now = new Date();
                            const diffMs = now.getTime() - lastDate.getTime();
                            const cooldownMs = 3 * 60 * 60 * 1000; // 3 hours
                            const isLocked = diffMs < cooldownMs;
                            const remainingMinutes = Math.ceil((cooldownMs - diffMs) / 60000);
                            const remainingHours = Math.floor(remainingMinutes / 60);
                            const displayMinutes = remainingMinutes % 60;

                            return (
                                <div className="relative">
                                    <button
                                        onClick={handleAnalyzeProfile}
                                        disabled={isLocked || analyzing}
                                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${isLocked
                                            ? "bg-white/5 text-gray-500 cursor-not-allowed"
                                            : "bg-purple-500/20 text-purple-300 hover:bg-purple-500/40 hover:text-white"
                                            }`}
                                        title={isLocked ? `Next analysis available in ${remainingHours}h ${displayMinutes}m` : "Re-analyze Profile"}
                                    >
                                        {analyzing ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Analyzing...
                                            </>
                                        ) : isLocked ? (
                                            <>
                                                <Lock className="w-4 h-4" />
                                                <span className="font-mono">{remainingHours}h {displayMinutes}m</span>
                                            </>
                                        ) : (
                                            <>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /><path d="M8 16H3v5" /></svg>
                                                Re-analyze
                                            </>
                                        )}
                                    </button>
                                </div>
                            );
                        })()}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h3 className="text-2xl font-bold text-white leading-tight mb-2">
                                {profile.masterProfileAnalysis.role}
                            </h3>
                            <div className="flex items-center gap-3 text-sm text-gray-400 mb-3 font-medium">
                                <span>{profile.masterProfileAnalysis.yearsOfExperience || "Exp N/A"}</span>
                                <span className="w-1 h-1 rounded-full bg-gray-600" />
                                <span>{profile.masterProfileAnalysis.seniority} Level</span>
                            </div>

                            {/* Summary */}
                            {profile.masterProfileAnalysis.summary && (
                                <p className="text-sm text-gray-400 leading-relaxed">
                                    {profile.masterProfileAnalysis.summary}
                                </p>
                            )}
                        </div>

                        {/* Project Insight */}
                        {profile.masterProfileAnalysis.projectInsight && (
                            <div className="bg-black/20 rounded-lg p-4 border border-white/5">
                                <div className="flex items-center gap-2 text-purple-300 mb-3">
                                    <Sparkles className="w-4 h-4" />
                                    <span className="text-xs font-bold uppercase tracking-wider">Project Analysis</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm mb-2">
                                    <span className="text-white font-bold">{profile.masterProfileAnalysis.projectInsight.role}</span>
                                    <span className="text-gray-600">•</span>
                                    <span className="text-gray-400">{profile.masterProfileAnalysis.projectInsight.seniority}</span>
                                </div>
                                <p className="text-xs text-gray-400 leading-relaxed">
                                    {profile.masterProfileAnalysis.projectInsight.justification}
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="mt-4 pt-4 border-t border-white/10 flex justify-end">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-black/40 border border-white/5 text-xs text-gray-500 font-mono">
                            <span>Analyzed by</span>
                            <span className="text-pink-400 font-bold">{profile.masterProfileAnalysis.model || "Gemma 3"}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Contact Info */}
            <section className="space-y-5 relative z-10">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <span className="w-1 h-6 bg-purple-500 rounded-full"></span>
                    Contact Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1">
                        <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold ml-1">Full Name</label>
                        <input type="text" placeholder="e.g. John Doe" value={profile.fullName} onChange={(e) => setProfile({ ...profile, fullName: e.target.value })} className="glass-input p-3.5 rounded-xl w-full text-sm font-medium" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold ml-1">Email</label>
                        <input type="email" placeholder="e.g. john@example.com" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} className="glass-input p-3.5 rounded-xl w-full text-sm font-medium" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold ml-1">Phone</label>
                        <input type="text" placeholder="e.g. +1 555 0123" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} className="glass-input p-3.5 rounded-xl w-full text-sm font-medium" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold ml-1">Location</label>
                        <input type="text" placeholder="e.g. San Francisco, CA" value={profile.location} onChange={(e) => setProfile({ ...profile, location: e.target.value })} className="glass-input p-3.5 rounded-xl w-full text-sm font-medium" />
                    </div>
                    <div className="space-y-1 md:col-span-2">
                        <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold ml-1">Website / LinkedIn</label>
                        <input type="text" placeholder="e.g. linkedin.com/in/johndoe" value={profile.website} onChange={(e) => setProfile({ ...profile, website: e.target.value })} className="glass-input p-3.5 rounded-xl w-full text-sm font-medium" />
                    </div>
                </div>
            </section>

            {/* Summary */}
            <section className="space-y-5 relative z-10">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <span className="w-1 h-6 bg-pink-500 rounded-full"></span>
                        Professional Summary
                    </h3>
                    <button
                        onClick={() => handleEnhanceText("summary", profile.summary, "summary")}
                        disabled={!profile.summary || enhancingState["summary"]}
                        className={`flex items-center gap-1.5 text-xs font-bold transition-colors disabled:opacity-50 ${subscription?.plan === 'free' ? 'text-gray-500 hover:text-purple-400' : 'text-pink-400 hover:text-pink-300'}`}
                    >
                        {enhancingState["summary"] ? <Loader2 className="w-3 h-3 animate-spin" /> : subscription?.plan === 'free' ? <Lock className="w-3 h-3" /> : <Wand2 className="w-3 h-3" />}
                        {enhancingState["summary"] ? "Enhancing..." : subscription?.plan === 'free' ? "Upgrade to Enhance" : "Enhance with AI"}
                    </button>
                </div>
                <textarea
                    value={profile.summary}
                    onChange={(e) => setProfile({ ...profile, summary: e.target.value })}
                    className="glass-input w-full p-4 rounded-xl min-h-[120px] resize-y text-sm leading-relaxed"
                    placeholder="Briefly describe your professional background, key achievements, and career goals..."
                />
            </section>

            {/* Experience */}
            <section className="space-y-5 relative z-10">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <span className="w-1 h-6 bg-blue-500 rounded-full"></span>
                        Experience
                    </h3>
                    <button onClick={addExperience} className="flex items-center gap-1.5 text-xs uppercase tracking-wider font-bold bg-white/5 hover:bg-white/10 text-blue-300 px-4 py-2 rounded-lg transition-colors border border-blue-500/20 hover:border-blue-500/40">
                        <Plus className="w-3 h-3" /> Add Job
                    </button>
                </div>
                <div className="space-y-6">
                    {profile.experience.map((exp) => (
                        <div key={exp.id} className="p-6 border border-white/5 rounded-2xl bg-black/20 hover:bg-black/30 transition-colors relative group">
                            <div className="absolute top-4 right-4 flex items-center gap-2">
                                <button
                                    onClick={() => handleEnhanceText(exp.id, exp.description, "experience", `${exp.role} at ${exp.company}`)}
                                    disabled={!exp.description || enhancingState[exp.id]}
                                    className={`p-2 rounded-lg transition-colors ${subscription?.plan === 'free' ? 'text-gray-500 hover:text-blue-400 hover:bg-white/5' : 'text-blue-400 hover:text-blue-300 hover:bg-blue-500/10'}`}
                                    title={subscription?.plan === 'free' ? "Upgrade to Enhance" : "Enhance Description"}
                                >
                                    {enhancingState[exp.id] ? <Loader2 className="w-4 h-4 animate-spin" /> : subscription?.plan === 'free' ? <Lock className="w-4 h-4" /> : <Wand2 className="w-4 h-4" />}
                                </button>
                                <button onClick={() => removeExperience(exp.id)} className="text-gray-600 hover:text-red-400 p-2 hover:bg-red-500/10 rounded-lg transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-4">
                                <input type="text" placeholder="Job Title" value={exp.role} onChange={(e) => updateExperience(exp.id, "role", e.target.value)} className="glass-input p-3 rounded-xl font-bold" />
                                <input type="text" placeholder="Company" value={exp.company} onChange={(e) => updateExperience(exp.id, "company", e.target.value)} className="glass-input p-3 rounded-xl" />
                                <input type="text" placeholder="Start Date" value={exp.startDate} onChange={(e) => updateExperience(exp.id, "startDate", e.target.value)} className="glass-input p-3 rounded-xl text-sm" />
                                <input type="text" placeholder="End Date" value={exp.endDate} onChange={(e) => updateExperience(exp.id, "endDate", e.target.value)} className="glass-input p-3 rounded-xl text-sm" />
                            </div>
                            <textarea placeholder="Description / Bullet points (One per line)" value={exp.description} onChange={(e) => updateExperience(exp.id, "description", e.target.value)} className="glass-input w-full p-4 rounded-xl min-h-[120px] text-sm" />
                        </div>
                    ))}
                </div>
            </section>

            {/* Education */}
            <section className="space-y-5 relative z-10">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <span className="w-1 h-6 bg-green-500 rounded-full"></span>
                        Education
                    </h3>
                    <button onClick={addEducation} className="flex items-center gap-1.5 text-xs uppercase tracking-wider font-bold bg-white/5 hover:bg-white/10 text-green-300 px-4 py-2 rounded-lg transition-colors border border-green-500/20 hover:border-green-500/40">
                        <Plus className="w-3 h-3" /> Add School
                    </button>
                </div>
                <div className="space-y-4">
                    {profile.education.map((edu) => (
                        <div key={edu.id} className="p-5 border border-white/5 rounded-2xl bg-black/20 hover:bg-black/30 transition-colors relative group">
                            <button onClick={() => removeEducation(edu.id)} className="absolute top-4 right-4 text-gray-600 hover:text-red-400 p-2 opacity-0 group-hover:opacity-100 transition-all">
                                <Trash2 className="w-4 h-4" />
                            </button>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <input type="text" placeholder="School / University" value={edu.school} onChange={(e) => updateEducation(edu.id, "school", e.target.value)} className="glass-input p-3 rounded-xl font-bold" />
                                <input type="text" placeholder="Degree / Certificate" value={edu.degree} onChange={(e) => updateEducation(edu.id, "degree", e.target.value)} className="glass-input p-3 rounded-xl" />
                                <input type="text" placeholder="Year" value={edu.year} onChange={(e) => updateEducation(edu.id, "year", e.target.value)} className="glass-input p-3 rounded-xl" />
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Projects & Leadership */}
            <section className="space-y-5 relative z-10">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <span className="w-1 h-6 bg-orange-500 rounded-full"></span>
                        Projects & Leadership
                    </h3>
                    <button onClick={addProject} className="flex items-center gap-1.5 text-xs uppercase tracking-wider font-bold bg-white/5 hover:bg-white/10 text-orange-300 px-4 py-2 rounded-lg transition-colors border border-orange-500/20 hover:border-orange-500/40">
                        <Plus className="w-3 h-3" /> Add Project
                    </button>
                </div>
                <div className="space-y-6">
                    {(profile.projects || [])
                        .filter(p => !p.id.startsWith("gh_") || p.imported) // Hide raw GitHub projects unless imported
                        .map((proj) => (
                            <div key={proj.id} className="p-6 border border-white/5 rounded-2xl bg-black/20 hover:bg-black/30 transition-colors relative group">
                                <div className="absolute top-4 right-4 flex items-center gap-2">
                                    <button
                                        onClick={() => handleEnhanceText(proj.id, proj.description, "project", proj.name)}
                                        disabled={!proj.description || enhancingState[proj.id]}
                                        className={`p-2 rounded-lg transition-colors ${subscription?.plan === 'free' ? 'text-gray-500 hover:text-orange-400 hover:bg-white/5' : 'text-orange-400 hover:text-orange-300 hover:bg-orange-500/10'}`}
                                        title={subscription?.plan === 'free' ? "Upgrade to Enhance" : "Enhance Description"}
                                    >
                                        {enhancingState[proj.id] ? <Loader2 className="w-4 h-4 animate-spin" /> : subscription?.plan === 'free' ? <Lock className="w-4 h-4" /> : <Wand2 className="w-4 h-4" />}
                                    </button>
                                    <button onClick={() => removeProject(proj.id)} className="text-gray-600 hover:text-red-400 p-2 hover:bg-red-500/10 rounded-lg transition-colors">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <input type="text" placeholder="Project Name / Leadership Role" value={proj.name} onChange={(e) => updateProject(proj.id, "name", e.target.value)} className="glass-input p-3 rounded-xl font-bold" />
                                    <input type="text" placeholder="Technologies / Skills Used" value={proj.technologies || ""} onChange={(e) => updateProject(proj.id, "technologies", e.target.value)} className="glass-input p-3 rounded-xl" />
                                    <input type="text" placeholder="Link (GitHub/Live URL)" value={proj.link || ""} onChange={(e) => updateProject(proj.id, "link", e.target.value)} className="glass-input p-3 rounded-xl md:col-span-2 text-sm text-blue-300" />
                                </div>
                                <textarea placeholder="Description / Bullet points" value={proj.description} onChange={(e) => updateProject(proj.id, "description", e.target.value)} className="glass-input w-full p-4 rounded-xl min-h-[100px] text-sm" />
                            </div>
                        ))}
                </div>
            </section>

            {/* Custom Sections */}
            <div className="space-y-6 relative z-10">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <span className="w-1 h-6 bg-purple-500 rounded-full"></span>
                        Additional Sections
                    </h3>
                    <button onClick={addCustomSection} className="flex items-center gap-1.5 text-xs uppercase tracking-wider font-bold bg-white/5 hover:bg-white/10 text-purple-300 px-4 py-2 rounded-lg transition-colors border border-purple-500/20 hover:border-purple-500/40">
                        <Plus className="w-3 h-3" /> Add Section
                    </button>
                </div>

                {(profile.customSections || []).map((section) => (
                    <section key={section.id} className="space-y-4 p-6 border border-white/10 rounded-2xl bg-white/[0.02] relative group">
                        <button onClick={() => removeCustomSection(section.id)} className="absolute top-4 right-4 text-gray-600 hover:text-red-400 p-2 opacity-0 group-hover:opacity-100 transition-all">
                            <Trash2 className="w-4 h-4" />
                        </button>

                        <div className="mb-6">
                            <label className="text-[10px] text-gray-500 uppercase tracking-widest mb-1.5 block font-bold">Section Title</label>
                            <input
                                type="text"
                                placeholder="e.g. Certifications, Awards, Volunteering"
                                value={section.title}
                                onChange={(e) => updateCustomSectionTitle(section.id, e.target.value)}
                                className="glass-input p-3 rounded-xl w-full md:w-1/2 font-bold text-white border-purple-500/30 focus:border-purple-500"
                            />
                        </div>

                        <div className="space-y-4 pl-4 border-l-2 border-white/5">
                            {section.items.map((item) => (
                                <div key={item.id} className="p-5 border border-white/5 rounded-2xl bg-black/20 hover:bg-black/30 transition-colors relative group/item">
                                    <button onClick={() => removeCustomItem(section.id, item.id)} className="absolute top-3 right-3 text-gray-600 hover:text-red-400 p-1 opacity-0 group-hover/item:opacity-100 transition-all">
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                                        <input type="text" placeholder="Item Name" value={item.name} onChange={(e) => updateCustomItem(section.id, item.id, "name", e.target.value)} className="glass-input p-3 rounded-xl font-bold" />
                                        <input type="text" placeholder="Subtitle / Issuer" value={item.subtitle || ""} onChange={(e) => updateCustomItem(section.id, item.id, "subtitle", e.target.value)} className="glass-input p-3 rounded-xl text-sm" />
                                        <input type="text" placeholder="Date" value={item.date || ""} onChange={(e) => updateCustomItem(section.id, item.id, "date", e.target.value)} className="glass-input p-3 rounded-xl text-sm md:col-span-2" />
                                        <textarea
                                            placeholder="Description / Details"
                                            value={item.description || ""}
                                            onChange={(e) => updateCustomItem(section.id, item.id, "description", e.target.value)}
                                            className="glass-input p-3 rounded-xl text-sm md:col-span-2 min-h-[80px]"
                                        />
                                    </div>
                                </div>
                            ))}
                            <button onClick={() => addCustomItem(section.id)} className="flex items-center gap-1 text-xs text-gray-400 hover:text-white px-2 py-1 rounded transition-colors">
                                <Plus className="w-3 h-3" /> Add Item to {section.title || "Section"}
                            </button>
                        </div>
                    </section>
                ))}
            </div>

            {/* Skills */}
            <section className="space-y-5 relative z-10">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <span className="w-1 h-6 bg-teal-500 rounded-full"></span>
                        Skills
                    </h3>
                    <button
                        onClick={() => handleEnhanceText("skills", profile.skills, "skills")}
                        disabled={!profile.skills || enhancingState["skills"]}
                        className={`flex items-center gap-1.5 text-xs font-bold transition-colors disabled:opacity-50 ${subscription?.plan === 'free' ? 'text-gray-500 hover:text-teal-400' : 'text-teal-400 hover:text-teal-300'}`}
                    >
                        {enhancingState["skills"] ? <Loader2 className="w-3 h-3 animate-spin" /> : subscription?.plan === 'free' ? <Lock className="w-3 h-3" /> : <Wand2 className="w-3 h-3" />}
                        {enhancingState["skills"] ? "Enhancing..." : subscription?.plan === 'free' ? "Upgrade to Enhance" : "Enhance with AI"}
                    </button>
                </div>
                <div className="relative">
                    <textarea
                        value={profile.skills}
                        onChange={(e) => setProfile({ ...profile, skills: e.target.value })}
                        className="glass-input w-full p-5 rounded-2xl focus:ring-2 focus:ring-teal-500/50 min-h-[100px] text-sm leading-relaxed"
                        placeholder="List your top skills (e.g. React, Node.js, Design)..."
                    />
                    <div className="absolute top-3 right-3 text-[10px] text-gray-500 bg-black/40 px-2 py-1 rounded">COMMA SEPARATED</div>
                </div>
            </section>

            {/* Danger Zone moved to Settings tab */}
        </div>
    );
}
