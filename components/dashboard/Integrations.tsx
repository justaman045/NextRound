"use client";

import posthog from "posthog-js";

import { IntegrationStatus, UserProfile, Project, Experience, Education } from "@/types";
import { Link as LinkIcon, CheckCircle2, XCircle, ArrowRight, Loader2, Github } from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { toggleIntegration, saveUserProfile, deleteField, getSystemConfig } from "@/lib/firestore";
import { useRouter } from "next/navigation";

interface IntegrationsProps {
    integrations?: IntegrationStatus;
    profile: UserProfile;
    onUpdate?: (profile?: UserProfile) => void;
}

export default function Integrations({ integrations, profile, onUpdate }: IntegrationsProps) {
    const { user } = useAuth();
    const router = useRouter();
    const [loadingState, setLoadingState] = useState<Record<string, boolean>>({});
    const [showGithubModal, setShowGithubModal] = useState(false);
    const [githubUsername, setGithubUsername] = useState("");
    const [showLinkedinModal, setShowLinkedinModal] = useState(false);
    const [linkedinFile, setLinkedinFile] = useState<File | null>(null);
    const [syncLoading, setSyncLoading] = useState(false);

    // Default status if undefined
    const [status, setStatus] = useState<IntegrationStatus>({
        linkedin: false,
        indeed: false,
        naukri: false,
        github: false,
        portfolio: false,
        ...integrations
    });

    const [config, setConfig] = useState<{
        enableIndeed: boolean;
        enableNaukri: boolean;
        enablePortfolio: boolean;
    }>({
        enableIndeed: false,
        enableNaukri: false,
        enablePortfolio: false
    });

    useEffect(() => {
        const loadConfig = async () => {
            try {
                const sysConfig = await getSystemConfig();
                if (sysConfig) {
                    setConfig({
                        enableIndeed: !!sysConfig.enableIndeed,
                        enableNaukri: !!sysConfig.enableNaukri,
                        enablePortfolio: !!sysConfig.enablePortfolio
                    });
                }
            } catch (e) { console.error("Config fetch error", e); }
        };
        loadConfig();
    }, []);

    const categories = [
        {
            title: "Job Platforms",
            description: "Connect your accounts to auto-apply (Coming Soon) and sync profile data.",
            items: [
                { id: "linkedin", name: "LinkedIn", color: "bg-[#0077b5]", icon: "in" },
                { id: "indeed", name: "Indeed", color: "bg-[#2164f3]", icon: "i" },
                { id: "naukri", name: "Naukri", color: "bg-[#4D65F0]", icon: "n" },
            ]
        },
        {
            title: "Developer & Portfolio",
            description: "Sync your projects and code repositories.",
            items: [
                { id: "github", name: "GitHub", color: "bg-[#24292e]", icon: "gh" },
                { id: "portfolio", name: "Portfolio Website", color: "bg-purple-600", icon: "www" },
            ]
        }
    ];

    const toggleConnect = async (id: string) => {
        if (!user) return;

        // specific handler for github
        if (id === 'github' && !status.github) {
            setShowGithubModal(true);
            return;
        }

        if (id === 'linkedin' && !status.linkedin) {
            setShowLinkedinModal(true);
            return;
        }

        const platform = id as keyof IntegrationStatus;
        const currentStatus = status[platform];
        const newStatus = !currentStatus;

        setLoadingState(prev => ({ ...prev, [id]: true }));

        try {
            // 1. Toggle the status first
            await toggleIntegration(user.uid, id, newStatus);

            // 2. If disconnecting GitHub, clean up profile data carefully
            if (id === 'github' && !newStatus) {
                const updates: any = {
                    githubProfile: deleteField(),
                    githubSkills: deleteField(),
                    integrations: {
                        ...profile.integrations,
                        github: false
                    }
                };
                // Filter projects
                const cleanedProjects = profile.projects.filter(p => !p.id.startsWith("gh_"));
                updates.projects = cleanedProjects;

                await saveUserProfile(user.uid, updates);
                if (onUpdate) onUpdate({ ...profile, ...updates, githubProfile: undefined });
            }

            // 3. If disconnecting LinkedIn, clean up imported data
            if (id === 'linkedin' && !newStatus) {
                const updates: any = {
                    linkedinProfile: deleteField(),
                    integrations: {
                        ...profile.integrations,
                        linkedin: false
                    }
                };

                // Filter imported items
                const cleanExperience = (profile.experience || []).filter(e => e.source !== 'linkedin');
                const cleanEducation = (profile.education || []).filter(e => e.source !== 'linkedin');
                // Note: We are NOT deleting projects yet as we didn't tag them, but usually projects aren't imported from LinkedIn PDF in this flow (only manually).

                updates.experience = cleanExperience;
                updates.education = cleanEducation;

                await saveUserProfile(user.uid, updates);
                if (onUpdate) onUpdate({ ...profile, ...updates, linkedinProfile: undefined });
            }

            setStatus(prev => ({ ...prev, [id]: newStatus })); // Optimistic update

            posthog.capture(newStatus ? 'integration_connected' : 'integration_disconnected', {
                platform: id
            });

            if (onUpdate) onUpdate(); // Refresh parent state
            router.refresh();
        } catch (error) {
            console.error("Failed to toggle integration:", error);
            toast.error("Failed to update integration status.");
        } finally {
            setLoadingState(prev => ({ ...prev, [id]: false }));
        }
    };

    const handleLinkedinSync = async () => {
        if (!user || !linkedinFile) return;
        setSyncLoading(true);

        try {
            const formData = new FormData();
            formData.append("file", linkedinFile);

            const res = await fetch('/api/integrations/linkedin', {
                method: 'POST',
                body: formData
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Failed to parse PDF");
            }

            const { data } = await res.json();

            // Merge Data
            const newExperience = (data.experience || []).map((e: any) => ({ ...e, source: 'linkedin' }));
            const newEducation = (data.education || []).map((e: any) => ({ ...e, source: 'linkedin' }));
            const newProjects = data.projects || [];
            const newSkills = data.skills || "";

            // Deduping Experience
            const mergedExperience = [...profile.experience];
            newExperience.forEach((newExp: Experience) => {
                // Check uniqueness by Role + Company
                const exists = mergedExperience.some(curr =>
                    curr.role.toLowerCase().trim() === newExp.role.toLowerCase().trim() &&
                    curr.company.toLowerCase().trim() === newExp.company.toLowerCase().trim()
                );
                if (!exists) {
                    mergedExperience.push(newExp);
                }
            });

            // Deduping Education
            const mergedEducation = [...profile.education];
            newEducation.forEach((newEdu: Education) => {
                const exists = mergedEducation.some(curr =>
                    curr.school.toLowerCase().trim() === newEdu.school.toLowerCase().trim() &&
                    curr.degree.toLowerCase().trim() === newEdu.degree.toLowerCase().trim()
                );
                if (!exists) {
                    mergedEducation.push(newEdu);
                }
            });

            // Deduping Projects
            const mergedProjects = [...profile.projects];
            newProjects.forEach((newProj: Project) => {
                const exists = mergedProjects.some(curr =>
                    curr.name.toLowerCase().trim() === newProj.name.toLowerCase().trim()
                );
                if (!exists) {
                    mergedProjects.push(newProj);
                }
            });

            // Deduping Skills
            const existingSkills = profile.skills ? profile.skills.split(',').map((s: string) => s.trim()).filter((s: string) => s) : [];
            const importedSkills = newSkills ? newSkills.split(',').map((s: string) => s.trim()).filter((s: string) => s) : [];
            const uniqueSkills = Array.from(new Set([...existingSkills, ...importedSkills])).join(", ");

            const updatedProfile: UserProfile = {
                ...profile,
                fullName: profile.fullName || data.fullName,
                summary: profile.summary || data.summary, // LinkedIn summary is usually good
                // Merge Arrays
                experience: mergedExperience,
                education: mergedEducation,
                projects: mergedProjects,
                // Merge Skills
                skills: uniqueSkills,
                integrations: {
                    ...profile.integrations,
                    linkedin: true,
                    indeed: profile.integrations?.indeed || false,
                    naukri: profile.integrations?.naukri || false
                },
                linkedinProfile: {
                    url: "https://linkedin.com/in/me", // Placeholder or parsed from PDF if available
                    connectedAt: new Date().toISOString(),
                    // We could store the raw data hash to detect changes later
                }
            };


            await saveUserProfile(user.uid, updatedProfile);
            await toggleIntegration(user.uid, 'linkedin', true);

            setStatus(prev => ({ ...prev, linkedin: true }));
            setShowLinkedinModal(false);
            if (onUpdate) onUpdate(updatedProfile);
            router.refresh();

            posthog.capture('integration_imported', {
                platform: 'linkedin'
            });

            toast.success("LinkedIn Data Imported Successfully!");

        } catch (error: any) {
            console.error("LinkedIn Connect Error:", error);
            toast.error(error.message || "Failed to import LinkedIn data.");
        } finally {
            setSyncLoading(false);
        }
    };

    const handleGithubSync = async () => {
        if (!user || !githubUsername) return;
        setSyncLoading(true);

        try {
            // 1. Fetch data from our API
            const res = await fetch('/api/integrations/github', {
                method: 'POST',
                body: JSON.stringify({ username: githubUsername }),
                headers: { 'Content-Type': 'application/json' }
            });

            if (!res.ok) throw new Error("Failed to fetch GitHub data");

            const data = await res.json();
            const newProjects = data.projects as Project[];
            const newSkills = data.skills as string;

            // 2. Merge with existing profile preventing duplicates
            const updatedProjects = [...profile.projects];

            // Add new projects only if they don't exist
            newProjects.forEach(newP => {
                if (!updatedProjects.find(p => p.id === newP.id)) {
                    updatedProjects.push(newP);
                }
            });

            // Merge and deduplicate skills
            const existingSkills = profile.skills ? profile.skills.split(',').map(s => s.trim()).filter(s => s) : [];
            const newSkillsArray = newSkills.split(',').map(s => s.trim()).filter(s => s);
            const uniqueSkills = Array.from(new Set([...existingSkills, ...newSkillsArray]));
            const updatedSkills = uniqueSkills.join(', ');

            // 3. Save to Firestore
            const updatedProfile = {
                ...profile,
                projects: updatedProjects,
                skills: updatedSkills,
                githubSkills: newSkills, // Save raw GitHub skills separately
                integrations: {
                    linkedin: profile.integrations?.linkedin || false,
                    indeed: profile.integrations?.indeed || false,
                    naukri: profile.integrations?.naukri || false,
                    portfolio: profile.integrations?.portfolio || false,
                    github: true
                }
            };

            await saveUserProfile(user.uid, updatedProfile);

            // 4. Update Integration Status
            await toggleIntegration(user.uid, 'github', true);
            setStatus(prev => ({ ...prev, github: true }));
            setShowGithubModal(false);
            if (onUpdate) onUpdate(updatedProfile); // Refresh parent state immediately
            router.refresh();

            posthog.capture('integration_imported', {
                platform: 'github'
            });

            toast.success("GitHub Synced Successfully!");

        } catch (error) {
            console.error("GitHub Sync Error:", error);
            toast.error("Failed to sync GitHub data. Please check the username.");
        } finally {
            setSyncLoading(false);
        }
    };

    return (
        <div className="space-y-8 animate-fade-in-up">
            <div>
                <h2 className="text-2xl font-bold text-white">Integrations</h2>
                <p className="text-gray-400 text-sm">Supercharge your resume with data from other platforms.</p>
            </div>

            <div className="space-y-8">
                {categories.map((cat, idx) => (
                    <section key={idx} className="space-y-4">
                        <div className="border-b border-white/5 pb-2">
                            <h3 className="text-lg font-semibold text-white">{cat.title}</h3>
                            <p className="text-xs text-gray-500">{cat.description}</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {cat.items.map((item) => {
                                const isConnected = status[item.id as keyof IntegrationStatus];

                                // Clean matching logic:
                                let platformEnabled = false;
                                if (item.id === 'indeed') platformEnabled = config.enableIndeed;
                                else if (item.id === 'naukri') platformEnabled = config.enableNaukri;
                                else if (item.id === 'portfolio') platformEnabled = config.enablePortfolio;
                                else platformEnabled = true; // LinkedIn, GitHub always on

                                // Show if Connected OR Enabled. 
                                // Default: Show unconnected platforms as "Coming Soon" if not explicitly enabled
                                // Old logic: if (!isConnected && !platformEnabled) return null;

                                return (
                                    <div key={item.id} className={`glass-panel p-6 rounded-xl flex flex-col justify-between h-full transition-colors ${!platformEnabled ? "opacity-75" : "hover:border-purple-500/30"}`}>
                                        <div className="flex items-start justify-between mb-4">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-lg ${item.color} ${!platformEnabled ? "grayscale" : ""}`}>
                                                {item.icon}
                                            </div>
                                            {isConnected ? (
                                                <span className="flex items-center gap-1 text-[10px] font-bold text-green-400 bg-green-500/10 px-2 py-1 rounded-full border border-green-500/20">
                                                    <CheckCircle2 className="w-3 h-3" /> CONNECTED
                                                </span>
                                            ) : !platformEnabled ? (
                                                <span className="flex items-center gap-1 text-[10px] font-bold text-purple-300 bg-purple-500/10 px-2 py-1 rounded-full border border-purple-500/20">
                                                    COMING SOON
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1 text-[10px] font-bold text-gray-500 bg-gray-500/10 px-2 py-1 rounded-full border border-gray-500/20">
                                                    <XCircle className="w-3 h-3" /> DISCONNECTED
                                                </span>
                                            )}
                                        </div>

                                        <div>
                                            <h4 className="font-bold text-white text-base">{item.name}</h4>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {isConnected
                                                    ? "Data last synced: Just now"
                                                    : !platformEnabled
                                                        ? "Integration currently under development."
                                                        : "Connect to import experience & skills."
                                                }
                                            </p>
                                        </div>

                                        <button
                                            onClick={() => toggleConnect(item.id)}
                                            disabled={loadingState[item.id] || !platformEnabled}
                                            className={`mt-6 w-full py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${isConnected
                                                ? "bg-white/5 text-gray-300 hover:bg-red-500/10 hover:text-red-400 border border-white/5"
                                                : !platformEnabled
                                                    ? "bg-white/5 text-gray-500 cursor-not-allowed border border-white/5"
                                                    : "bg-white text-black hover:bg-purple-50"
                                                }`}
                                        >
                                            {loadingState[item.id] ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                                            {isConnected ? "Disconnect" : !platformEnabled ? "Coming Soon" : "Connect Account"}
                                            {!isConnected && !loadingState[item.id] && platformEnabled && <ArrowRight className="w-3 h-3" />}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                ))}
            </div>

            {/* GitHub Modal */}
            {showGithubModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="glass-panel border-white/10 p-6 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-[#24292e] rounded-lg flex items-center justify-center text-white">
                                <Github className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white">Connect GitHub</h3>
                                <p className="text-xs text-gray-400">Import repositories and languages</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-400 mb-1">GitHub Username</label>
                                <input
                                    type="text"
                                    value={githubUsername}
                                    onChange={(e) => setGithubUsername(e.target.value)}
                                    placeholder="e.g. vercel"
                                    className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setShowGithubModal(false)}
                                    className="flex-1 py-2 rounded-lg text-sm font-semibold text-gray-400 hover:bg-white/5 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleGithubSync}
                                    disabled={!githubUsername || syncLoading}
                                    className="flex-1 py-2 rounded-lg text-sm font-semibold bg-white text-black hover:bg-purple-50 transition-colors flex items-center justify-center gap-2"
                                >
                                    {syncLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                                    {syncLoading ? "Syncing..." : "Sync Data"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* LinkedIn Modal */}
            {showLinkedinModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="glass-panel border-white/10 p-6 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-[#0077b5] rounded-lg flex items-center justify-center text-white">
                                <span className="font-bold text-xl">in</span>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white">Connect LinkedIn</h3>
                                <p className="text-xs text-gray-400">Sync your professional profile</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {!linkedinFile ? (
                                <div className="border-2 border-dashed border-white/20 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:border-blue-500/50 hover:bg-blue-500/5 transition-all cursor-pointer group relative">
                                    <input
                                        type="file"
                                        accept=".pdf"
                                        onChange={(e) => {
                                            if (e.target.files?.[0]) setLinkedinFile(e.target.files[0]);
                                        }}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                    <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                        <LinkIcon className="w-6 h-6 text-blue-400" />
                                    </div>
                                    <h4 className="text-white font-semibold">Upload LinkedIn Profile PDF</h4>
                                    <p className="text-xs text-gray-400 mt-1">LinkedIn Profile &rarr; More &rarr; Save to PDF</p>
                                </div>
                            ) : (
                                <div className="bg-white/5 rounded-lg p-4 flex items-center justify-between border border-white/10">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-red-500/20 text-red-400 rounded-lg flex items-center justify-center">
                                            <span className="text-xs font-bold">PDF</span>
                                        </div>
                                        <div>
                                            <p className="text-sm text-white font-medium truncate max-w-[200px]">{linkedinFile.name}</p>
                                            <p className="text-xs text-gray-500">{(linkedinFile.size / 1024).toFixed(0)} KB</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setLinkedinFile(null)}
                                        className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white"
                                    >
                                        <XCircle className="w-5 h-5" />
                                    </button>
                                </div>
                            )}

                            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                                <p className="text-xs text-blue-200">
                                    <strong>Why upload?</strong> LinkedIn blocks direct fetching. Uploading your "Save to PDF" file allows us to extract your full experience and skills using AI.
                                </p>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setShowLinkedinModal(false)}
                                    className="flex-1 py-2 rounded-lg text-sm font-semibold text-gray-400 hover:bg-white/5 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleLinkedinSync}
                                    disabled={!linkedinFile || syncLoading}
                                    className="flex-1 py-2 rounded-lg text-sm font-semibold bg-white text-black hover:bg-purple-50 transition-colors flex items-center justify-center gap-2"
                                >
                                    {syncLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                                    {syncLoading ? "Importing..." : "Import Data"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
