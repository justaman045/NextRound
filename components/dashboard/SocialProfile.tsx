
import { UserProfile, Project, Subscription } from "@/types";
import { Github, Code2, ExternalLink, Share2, BookOpen, Download, Sparkles, Loader2, Lock, Linkedin, Briefcase, Award } from "lucide-react";
import { useEffect, useState } from "react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import ImportProjectModal from "./ImportProjectModal";
import { saveUserProfile } from "@/lib/firestore";
import { removeDuplicates } from "@/lib/profile-utils";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useFreeModels } from "@/hooks/useFreeModels";

interface SocialProfileProps {
    profile: UserProfile;
    subscription: Subscription | null;
    onUpdate?: (profile: UserProfile) => void;
}

export default function SocialProfile({ profile, subscription, onUpdate }: SocialProfileProps) {
    const { user } = useAuth();
    const router = useRouter();
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);

    const [analyzingGithub, setAnalyzingGithub] = useState(false);
    const [analyzingLinkedin, setAnalyzingLinkedin] = useState(false);
    const [activeSource, setActiveSource] = useState<'github' | 'linkedin'>('github');

    const [error, setError] = useState<string | null>(null);
    const [fixingDuplicates, setFixingDuplicates] = useState(false);
    
    // Add selected model state
    const { models } = useFreeModels();
    const [selectedModel, setSelectedModel] = useState<string>(models[0]?.id || "");

    useEffect(() => {
        if (models.length > 0 && !models.find(m => m.id === selectedModel)) {
            setSelectedModel(models[0].id);
        }
    }, [models, selectedModel]);

    // Calculate duplicates on every render/profile change
    const cleanProfile = removeDuplicates(profile);
    const expDupes = (profile.experience?.length || 0) - (cleanProfile.experience?.length || 0);
    const eduDupes = (profile.education?.length || 0) - (cleanProfile.education?.length || 0);
    const projDupes = (profile.projects?.length || 0) - (cleanProfile.projects?.length || 0);
    const totalDupes = expDupes + eduDupes + projDupes;

    const handleFixDuplicates = async () => {
        if (!user) return;
        setFixingDuplicates(true);
        try {
            await saveUserProfile(user.uid, cleanProfile);
            if (onUpdate) onUpdate(cleanProfile);
            toast.success(`Removed ${totalDupes} duplicates!`);
            router.refresh();
        } catch (e) {
            console.error(e);
            toast.error("Failed to clean duplicates.");
        } finally {
            setFixingDuplicates(false);
        }
    };

    const handleAnalyze = async (source: 'github' | 'linkedin') => {
        if (!user) return;

        // Gate feature
        if (subscription?.plan === 'free') {
            router.push('/profile?tab=subscription');
            return;
        }

        if (source === 'github') setAnalyzingGithub(true);
        else setAnalyzingLinkedin(true);

        setError(null);

        try {
            const res = await fetch("/api/ai/analyze-profile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ profile, source, model: selectedModel })
            });

            let data;
            try {
                data = await res.json();
            } catch (e) {
                toast.error("Failed to parse API response");
                return;
            }

            if (!res.ok) {
                toast.error(data.error || "Analysis failed");
                return;
            }

            // Update profile with analysis
            let updatedProfile = { ...profile };

            if (source === 'github') {
                const existingGithubProfile = profile.githubProfile || {
                    username: "", displayName: "", bio: "", email: "", avatarUrl: "",
                    publicRepos: 0, followers: 0, following: 0, location: "", blog: ""
                };
                updatedProfile.githubProfile = {
                    ...existingGithubProfile,
                    aiAnalysis: {
                        role: data.role,
                        seniority: data.seniority,
                        yearsOfExperience: data.yearsOfExperience,
                        model: data.model,
                        date: new Date().toISOString(),
                        projectInsight: data.projectInsight
                    }
                };
            } else {
                const existingLinkedin = profile.linkedinProfile || {
                    url: "", connectedAt: ""
                };
                updatedProfile.linkedinProfile = {
                    ...existingLinkedin,
                    aiAnalysis: {
                        role: data.role,
                        seniority: data.seniority,
                        yearsOfExperience: data.yearsOfExperience,
                        model: data.model,
                        date: new Date().toISOString(),
                        projectInsight: data.projectInsight
                    }
                };
            }

            await saveUserProfile(user.uid, updatedProfile);
            if (onUpdate) onUpdate(updatedProfile);
            router.refresh();

        } catch (error: any) {
            console.error("Analysis failed:", error);
            setError(error.message || "Failed to analyze");
        } finally {
            if (source === 'github') setAnalyzingGithub(false);
            else setAnalyzingLinkedin(false);
        }
    };

    // Parse skills from string to array
    const skillsList = profile.githubSkills
        ? profile.githubSkills.split(',').map(s => s.trim()).filter(s => s.length > 0)
        : [];

    // Filter for GitHub projects (starting with gh_)
    const githubProjects = profile.projects.filter(p => p.id.startsWith("gh_"));
    // Filter for "Other" projects (LinkedIn/Manual)
    const otherProjects = profile.projects.filter(p => !p.id.startsWith("gh_"));

    const sortedEducation = [...(profile.education || [])].sort((a, b) => {
        const getYear = (y: string) => {
            if (!y) return 0;
            const years = y.match(/(\d{4})/g);
            return years ? parseInt(years[years.length - 1]) : 0;
        };
        return getYear(b.year) - getYear(a.year);
    });

    // Check for special repo (username/username)
    const inferUsername = () => {
        if (githubProjects.length === 0) return null;
        for (const p of githubProjects) {
            if (p.link) {
                try {
                    const url = new URL(p.link);
                    const pathParts = url.pathname.split('/').filter(x => x);
                    if (pathParts.length >= 1) return pathParts[0];
                } catch (e) { continue; }
            }
        }
        return null;
    };

    const username = inferUsername();
    const specialRepo = username ? githubProjects.find(p => p.name.toLowerCase() === username.toLowerCase()) : null;
    const [readmeContent, setReadmeContent] = useState<string | null>(null);
    const [readmeBranch, setReadmeBranch] = useState<string>('main');

    useEffect(() => {
        const fetchReadme = async () => {
            if (specialRepo && username) {
                try {
                    const branches = ['main', 'master'];
                    for (const branch of branches) {
                        try {
                            const res = await fetch(`https://raw.githubusercontent.com/${username}/${specialRepo.name}/${branch}/README.md`);
                            if (res.ok) {
                                const text = await res.text();
                                setReadmeContent(text);
                                setReadmeBranch(branch);
                                return;
                            }
                        } catch (err) { }
                    }
                } catch (error) { console.error("Failed to fetch README", error); }
            }
        };
        if (specialRepo) fetchReadme();
        else setReadmeContent(null);
    }, [specialRepo, username]);

    const handleImportClick = (project: Project, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setSelectedProject(project);
        setIsImportModalOpen(true);
    };

    const handleSaveImport = async (importedProject: Project) => {
        if (!user) return;
        const projectToSave = { ...importedProject, imported: true };
        const updatedProjects = profile.projects.map(p =>
            p.id === projectToSave.id ? projectToSave : p
        );
        if (!updatedProjects.find(p => p.id === projectToSave.id)) {
            updatedProjects.push(projectToSave);
        }
        const updatedProfile = { ...profile, projects: updatedProjects };
        await saveUserProfile(user.uid, updatedProfile);
        if (onUpdate) onUpdate(updatedProfile);
        router.refresh();
        setIsImportModalOpen(false);
    };

    const AnalysisCard = ({ type, data, loading, onAnalyze }: { type: 'github' | 'linkedin', data: any, loading: boolean, onAnalyze: () => void }) => {
        const isConnected = type === 'github' ? profile.integrations?.github : profile.integrations?.linkedin;
        const icon = type === 'github' ? <Github className="w-5 h-5" /> : <Linkedin className="w-5 h-5" />;
        const title = type === 'github' ? 'GitHub Analysis' : 'LinkedIn Analysis';
        const color = type === 'github' ? 'bg-[#24292e]' : 'bg-[#0077b5]';

        if (!data && isConnected) {
            return (
                <div className="bg-white/5 border border-white/10 rounded-xl p-6 flex flex-col items-center justify-center text-center">
                    <div className={`p-3 rounded-xl mb-4 text-white ${color}`}>
                        {icon}
                    </div>
                    <h3 className="font-bold text-white mb-2">Analyze {type === 'github' ? 'Code' : 'Experience'}</h3>
                    <p className="text-xs text-gray-400 mb-6 max-w-[200px]">
                        Use Gemma 3 to analyze your {type} data for role eligibility.
                    </p>

                    <button
                        onClick={onAnalyze}
                        disabled={loading}
                        className={`group relative inline-flex items-center justify-center gap-2 px-6 py-2.5 font-bold text-white transition-all duration-200 rounded-xl disabled:opacity-70 disabled:cursor-not-allowed shadow-lg 
                            ${subscription?.plan !== 'free'
                                ? "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 hover:shadow-purple-500/30"
                                : "bg-gray-800 border border-gray-700 cursor-pointer hover:bg-gray-700"
                            }`}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Analyzing...
                            </>
                        ) : subscription?.plan !== 'free' ? (
                            <>
                                <Sparkles className="w-4 h-4 text-yellow-300 group-hover:animate-pulse" />
                                Analyze with AI
                            </>
                        ) : (
                            <>
                                <Lock className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-400">Upgrade to Analyze</span>
                            </>
                        )}
                    </button>
                </div>
            );
        }

        if (!isConnected) {
            return (
                <div className="bg-white/5 border border-white/10 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center opacity-70">
                    <div className="p-3 rounded-xl mb-4 bg-gray-800 text-gray-400">
                        {icon}
                    </div>
                    <h3 className="font-bold text-gray-400 mb-1">{type === 'github' ? 'GitHub' : 'LinkedIn'} Disconnected</h3>
                    <p className="text-[10px] text-gray-500">Connect in Integrations tab to analyze.</p>
                </div>
            )
        }

        const lastAnalysisDate = data?.date ? new Date(data.date) : null;
        const now = new Date();
        const threeHoursMs = 3 * 60 * 60 * 1000;
        let timeLeft = 0;
        let timeLabel = "";

        if (lastAnalysisDate) {
            const diff = now.getTime() - lastAnalysisDate.getTime();
            if (diff < threeHoursMs) {
                timeLeft = threeHoursMs - diff;
                const hours = Math.floor(timeLeft / (1000 * 60 * 60));
                const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
                timeLabel = `${hours}h ${minutes}m`;
            }
        }

        const isLocked = timeLeft > 0;

        return (
            <div className="bg-gradient-to-br from-purple-900/40 to-black border border-purple-500/50 rounded-xl p-5 backdrop-blur-md shadow-[0_0_15px_rgba(168,85,247,0.2)] relative group">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg text-white ${color}`}>
                            {type === 'github' ? <Code2 className="w-3.5 h-3.5" /> : <Briefcase className="w-3.5 h-3.5" />}
                        </div>
                        <p className="text-xs text-purple-300 font-bold uppercase tracking-wider">
                            {type === 'github' ? 'Code Analysis' : 'Experience Analysis'}
                        </p>
                    </div>

                    <button
                        onClick={onAnalyze}
                        disabled={loading || isLocked}
                        className={`p-1.5 rounded-lg transition-all ${isLocked ? "bg-white/5 text-gray-500 cursor-not-allowed border border-white/5" : "bg-purple-500/20 text-purple-300 hover:bg-purple-500/40 hover:text-white"}`}
                        title={isLocked ? `Next analysis available in ${timeLabel}` : "Re-analyze"}
                    >
                        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : (isLocked ? <Lock className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />)}
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <h3 className="text-xl font-bold text-white leading-tight mb-1">
                            {data.role}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
                            <span className="text-white">{data.yearsOfExperience || "Exp N/A"}</span>
                            <span className="w-1 h-1 rounded-full bg-gray-600" />
                            <span>{data.seniority} Level</span>
                        </div>
                    </div>

                    {data.projectInsight && (
                        <div className="bg-black/20 rounded-lg p-3 border border-white/5">
                            <div className="flex items-center gap-1.5 text-purple-300 mb-2">
                                <Award className="w-3.5 h-3.5" />
                                <span className="text-[10px] font-bold uppercase tracking-wider">
                                    {type === 'github' ? 'Key Project' : 'Key Achievement'}
                                </span>
                            </div>
                            <p className="text-xs text-gray-400 leading-relaxed text-left">
                                {data.projectInsight.justification}
                            </p>
                        </div>
                    )}
                </div>

                <div className="mt-4 pt-3 border-t border-white/10 flex justify-end">
                    <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-black/40 border border-white/5 text-[9px] text-gray-500 font-mono">
                        <span>Analyzed by</span>
                        <span className="text-pink-400 font-bold">{data.model || "Gemma 3"}</span>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6 animate-fade-in-up">
            {/* Duplicate Warning Banner */}
            {totalDupes > 0 && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Sparkles className="w-5 h-5 text-yellow-500 animate-pulse" />
                        <div>
                            <h3 className="text-yellow-500 font-bold text-sm">Duplicate Data Detected</h3>
                            <p className="text-xs text-yellow-500/70">
                                found {totalDupes} duplicates ({expDupes} Exp, {eduDupes} Edu, {projDupes} Proj).
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleFixDuplicates}
                        disabled={fixingDuplicates}
                        className="bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-500 px-4 py-2 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                    >
                        {fixingDuplicates ? "Fixing..." : "Fix Duplicates Now"}
                    </button>
                </div>
            )}

            {/* Header Section */}
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-gray-900 to-black p-6 md:p-8">
                <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 p-[2px]">
                        <div className="w-full h-full rounded-full bg-black flex items-center justify-center">
                            <span className="text-2xl font-bold text-white">
                                {profile.fullName.charAt(0)}
                            </span>
                        </div>
                    </div>
                    <div className="flex-1 text-center md:text-left">
                        <h1 className="text-3xl font-bold text-white">
                            {activeSource === 'github'
                                ? (profile.githubProfile?.displayName || profile.githubProfile?.username || profile.fullName)
                                : activeSource === 'linkedin'
                                    ? (profile.linkedinProfile?.name || profile.fullName)
                                    : profile.fullName}
                        </h1>
                        <p className="text-gray-400 text-sm mt-1">
                            {activeSource === 'github'
                                ? (profile.githubProfile?.email || profile.githubProfile?.bio || "No public email available")
                                : activeSource === 'linkedin'
                                    ? (profile.linkedinProfile?.headline || profile.summary || "No headline available")
                                    : (profile.summary || "No bio available")}
                        </p>

                        {/* Source Toggles */}
                        <div className="flex flex-wrap gap-2 mt-4 justify-center md:justify-start">
                            {profile.integrations?.github && (
                                <button
                                    onClick={() => setActiveSource('github')}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-bold transition-all ${activeSource === 'github' ? "bg-[#24292e] border-white/30 text-white shadow-lg scale-105" : "bg-black/40 border-white/10 text-gray-400 hover:bg-white/5"}`}
                                >
                                    <Github className="w-4 h-4" />
                                    GITHUB PROFILE
                                    {activeSource === 'github' && <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse ml-1" />}
                                </button>
                            )}
                            {profile.integrations?.linkedin && (
                                <button
                                    onClick={() => setActiveSource('linkedin')}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-bold transition-all ${activeSource === 'linkedin' ? "bg-[#0077b5] border-white/30 text-white shadow-lg scale-105" : "bg-black/40 border-white/10 text-gray-400 hover:bg-white/5"}`}
                                >
                                    <Linkedin className="w-4 h-4" />
                                    LINKEDIN PROFILE
                                    {activeSource === 'linkedin' && <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse ml-1" />}
                                </button>
                            )}
                            
                            {/* Model Selector */}
                            <div className="flex items-center gap-2 ml-4">
                                <select
                                    value={selectedModel}
                                    onChange={(e) => setSelectedModel(e.target.value)}
                                    className="bg-black/40 border border-white/10 rounded-full text-xs font-bold text-gray-300 px-4 py-2 focus:outline-none focus:border-purple-500 cursor-pointer hover:bg-white/5 transition-colors"
                                >
                                    {models.map((model) => (
                                        <option key={model.id} value={model.id} className="bg-[#161b22] text-white">
                                            {model.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Analysis Grid - Side by Side */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Analysis, Skills, Projects List */}
                <div className="space-y-6">
                    {activeSource === 'github' ? (
                        <>
                            <AnalysisCard
                                type="github"
                                data={profile.githubProfile?.aiAnalysis}
                                loading={analyzingGithub}
                                onAnalyze={() => handleAnalyze('github')}
                            />

                            {/* GitHub Skills */}
                            <div className="glass-panel p-5 rounded-xl border border-white/5 bg-white/5 backdrop-blur-md">
                                <div className="flex items-center gap-2 mb-4">
                                    <Code2 className="w-4 h-4 text-purple-400" />
                                    <h3 className="font-bold text-white text-sm">Languages & Technologies</h3>
                                </div>
                                {skillsList.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {skillsList.map((skill, idx) => (
                                            <span key={idx} className="px-2.5 py-1 rounded-md bg-white/5 border border-white/5 text-xs text-gray-300 font-mono">
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                ) : <p className="text-xs text-gray-500 italic">No skills detected.</p>}
                            </div>

                            {/* Projects Sidebar List */}
                            <div>
                                <h3 className="text-sm font-bold text-white mb-3 uppercase tracking-wider flex items-center gap-2 border-b border-white/10 pb-2">
                                    <Github className="w-3.5 h-3.5" /> All Repositories
                                </h3>
                                <div className="space-y-3 pr-2">
                                    {githubProjects.length > 0 ? (
                                        githubProjects.map(p => {
                                            const isImported = p.imported === true;
                                            return (
                                                <div key={p.id} className={`group relative block p-4 rounded-xl border transition-all duration-300 ${isImported ? "bg-white/5 border-green-500/20" : "bg-white/5 border-white/5 hover:bg-white/10 hover:border-purple-500/30"}`}>
                                                    <div className="flex justify-between items-start mb-2">
                                                        <h4 className="font-bold text-white text-sm truncate pr-2 w-[180px]">{p.name}</h4>
                                                        {isImported && (
                                                            <div title="Already Imported to Master Profile">
                                                                <Sparkles className="w-3 h-3 text-green-400 flex-shrink-0 cursor-help" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <p className="text-[10px] text-gray-400 line-clamp-2 h-[2.5em]">{p.description || "No description."}</p>

                                                    {/* Actions Row */}
                                                    <div className="mt-3 flex items-center justify-between">
                                                        <a href={p.link} target="_blank" rel="noreferrer" className="text-[10px] text-gray-500 hover:text-white flex items-center gap-1">
                                                            <ExternalLink className="w-3 h-3" /> View
                                                        </a>
                                                        {!isImported && (
                                                            <button
                                                                onClick={(e) => handleImportClick(p, e)}
                                                                className="text-[10px] bg-green-500/10 text-green-400 px-2 py-1 rounded hover:bg-green-500/20 transition-colors font-bold"
                                                            >
                                                                IMPORT
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            )
                                        })
                                    ) : (
                                        <div className="text-center py-8 border border-dashed border-white/10 rounded-xl">
                                            <p className="text-xs text-gray-500">No projects found.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <AnalysisCard
                                type="linkedin"
                                data={profile.linkedinProfile?.aiAnalysis}
                                loading={analyzingLinkedin}
                                onAnalyze={() => handleAnalyze('linkedin')}
                            />

                            {/* Education List - Moved to Left */}
                            <div>
                                <h3 className="text-sm font-bold text-white mb-3 uppercase tracking-wider flex items-center gap-2 border-b border-white/10 pb-2">
                                    <Award className="w-3.5 h-3.5" /> Education
                                </h3>
                                <div className="space-y-3 pr-2">
                                    {sortedEducation.length > 0 ? (
                                        sortedEducation.map((edu: any, i: number) => (
                                            <div key={i} className="group relative block p-4 rounded-xl border bg-white/5 border-white/5 hover:bg-white/10 hover:border-purple-500/30 transition-all">
                                                <div className="flex items-start gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white flex-shrink-0">
                                                        <BookOpen className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-white text-sm leading-tight">{edu.school}</h4>
                                                        <p className="text-xs text-blue-300 mt-0.5">{edu.degree}</p>
                                                        <p className="text-[10px] text-gray-500 mt-1 font-mono">{edu.year}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-8 border border-dashed border-white/10 rounded-xl">
                                            <p className="text-xs text-gray-500">No education entries.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Right Column: Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {activeSource === 'github' ? (
                        <>
                            {/* README is MAIN Content */}
                            {readmeContent ? (
                                <div className="glass-panel p-8 rounded-xl border border-white/5 bg-white/5 backdrop-blur-md min-h-[500px]">
                                    <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
                                        <BookOpen className="w-5 h-5 text-pink-400" />
                                        <div>
                                            <h2 className="text-lg font-bold text-white">Profile README</h2>
                                            <p className="text-xs text-gray-400">Sourced from {specialRepo?.name}</p>
                                        </div>
                                    </div>
                                    <div className="selection:bg-purple-500/40 opacity-90 prose prose-invert max-w-none prose-pre:bg-[#0d1117] prose-pre:border prose-pre:border-white/10">
                                        <ReactMarkdown
                                            remarkPlugins={[remarkGfm]}
                                            rehypePlugins={[rehypeRaw]}
                                            components={{
                                                h1: ({ node, ...props }) => <h1 {...props} className="text-3xl font-bold text-white mb-6 border-b border-white/10 pb-2 mt-8 first:mt-0" />,
                                                h2: ({ node, ...props }) => <h2 {...props} className="text-2xl font-bold text-white mb-4 mt-8" />,
                                                h3: ({ node, ...props }) => <h3 {...props} className="text-xl font-bold text-white mb-3 mt-6" />,
                                                p: ({ node, ...props }) => <p {...props} className="mb-4 leading-relaxed text-gray-300" />,
                                                ul: ({ node, ...props }) => <ul {...props} className="list-disc pl-6 mb-4 space-y-1 text-gray-300" />,
                                                a: ({ node, ...props }) => <a {...props} className="text-blue-400 hover:text-blue-300 hover:underline" target="_blank" />,
                                                img: ({ node, ...props }) => {
                                                    let src = props.src;
                                                    if (typeof src === 'string' && !src.startsWith('http') && !src.startsWith('data:')) {
                                                        src = `https://raw.githubusercontent.com/${username}/${specialRepo?.name}/${readmeBranch}/${src.replace(/^\//, '')}`;
                                                    }
                                                    return <img {...props} src={src as string} className="rounded-lg max-w-full my-6 border border-white/5 shadow-2xl inline-block" />;
                                                },
                                                code: ({ node, ...props }) => {
                                                    const { className, children } = props;
                                                    const isInline = !className && typeof children === 'string' && !String(children).includes('\n');
                                                    return isInline
                                                        ? <code {...props} className="bg-white/10 rounded px-1.5 py-0.5 text-sm font-mono text-purple-200 border border-white/5" />
                                                        : <code {...props} className="block bg-[#0d1117] !p-4 rounded-lg my-4 font-mono text-sm overflow-x-auto text-gray-300 border border-white/10" />
                                                },
                                            }}
                                        >
                                            {readmeContent}
                                        </ReactMarkdown>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center min-h-[400px] border border-dashed border-white/10 rounded-xl bg-white/5 text-center p-8">
                                    <BookOpen className="w-12 h-12 text-gray-700 mb-4" />
                                    <h3 className="text-xl font-bold text-white">No README Found</h3>
                                    <p className="text-gray-500 max-w-md mt-2">
                                        Create a special repository named <span className="font-mono text-purple-400">{username}/{username}</span> on GitHub to display your profile README here.
                                    </p>
                                </div>
                            )}
                        </>
                    ) : (
                        <>
                            {/* LinkedIn Summary */}
                            {profile.summary && (
                                <div className="glass-panel p-6 rounded-xl border border-white/5 bg-white/5 backdrop-blur-md">
                                    <h3 className="font-bold text-white text-sm mb-3 flex items-center gap-2">
                                        <Linkedin className="w-4 h-4 text-blue-400" /> Professional Summary
                                    </h3>
                                    <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{profile.summary}</p>
                                </div>
                            )}



                            {/* Experience List - Restored to Right */}
                            <div>
                                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                    <Briefcase className="w-4 h-4" /> Experience
                                </h3>
                                <div className="relative border-l border-white/10 ml-3 space-y-8">
                                    {profile.experience?.length > 0 ? (
                                        profile.experience.map((exp: any, i: number) => (
                                            <div key={i} className="ml-6 relative group">
                                                <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-black border-2 border-blue-500/50 group-hover:border-blue-400 group-hover:scale-110 transition-all shadow-[0_0_10px_rgba(59,130,246,0.3)]"></div>
                                                <div className="bg-white/5 border border-white/5 rounded-xl p-5 hover:bg-white/10 transition-colors">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <h4 className="text-base font-bold text-white">{exp.role}</h4>
                                                        <span className="text-xs text-gray-400 font-mono bg-white/5 px-2 py-1 rounded">{exp.startDate} - {exp.endDate}</span>
                                                    </div>
                                                    <div className="text-sm text-blue-300 font-medium mb-3">{exp.company}</div>
                                                    <ul className="space-y-1.5">
                                                        {exp.description?.split('\n').map((line: string, j: number) => {
                                                            const cleanLine = line.trim().replace(/^[-•]\s*/, '');
                                                            if (!cleanLine) return null;
                                                            return (
                                                                <li key={j} className="text-xs text-gray-400 flex items-start gap-2">
                                                                    <span className="mt-1.5 w-1 h-1 rounded-full bg-gray-600 flex-shrink-0" />
                                                                    <span className="leading-relaxed">{cleanLine}</span>
                                                                </li>
                                                            )
                                                        })}
                                                    </ul>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="ml-6 text-sm text-gray-500 italic">No experience imported yet.</div>
                                    )}
                                </div>
                            </div>


                        </>
                    )}
                </div>
            </div>

            {selectedProject && (
                <ImportProjectModal
                    project={selectedProject}
                    isOpen={isImportModalOpen}
                    subscription={subscription}
                    onClose={() => setIsImportModalOpen(false)}
                    onSave={handleSaveImport}
                />
            )}
        </div>
    );
}
