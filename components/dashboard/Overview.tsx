"use client";

import { useAuth } from "@/context/AuthContext";
import { UserProfile, UserResume, Subscription } from "@/types";
import { FileText, Sparkles, TrendingUp } from "lucide-react";
import Link from "next/link";


interface OverviewProps {
    profile: UserProfile;
    stats: {
        totalResumes: number;
        avgScore: number;
    };
    recentResumes: UserResume[];
    subscription: Subscription | null;
    onNavigate: (tab: string) => void;
}

function timeAgo(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return "just now";
}

export default function Overview({ profile, stats, recentResumes, subscription, onNavigate }: OverviewProps) {
    const { user } = useAuth();
    const firstName = user?.displayName?.split(" ")[0] || "User";

    const isPro = subscription?.plan === 'pro' || subscription?.plan === 'enterprise';
    const isFreeExceeded = !isPro && stats.totalResumes >= 1;

    return (
        <div className="space-y-8 animate-fade-in-up">
            {/* Value Prop Header - Hidden if Free Limit Reached */}
            {!isFreeExceeded && (
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-600 to-indigo-600 p-8 shadow-2xl">
                    <div className="relative z-10">
                        <h2 className="text-3xl font-bold text-white mb-2">Welcome back, {firstName}! 🚀</h2>
                        <p className="text-purple-100 max-w-xl">
                            {profile?.experience?.length
                                ? "Tailor your resume for your next dream job in seconds."
                                : "Let's build your master profile first. Add your experience to get started."}
                        </p>

                        <div className="flex gap-4 mt-6">
                            {profile?.experience?.length ? (
                                <Link
                                    href="/tailor"
                                    className="inline-flex items-center gap-2 bg-white text-purple-700 px-6 py-3 rounded-xl font-bold hover:bg-purple-50 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                                >
                                    <Sparkles className="w-5 h-5" />
                                    Tailor New Resume
                                </Link>
                            ) : (
                                <Link
                                    href="/profile"
                                    className="inline-flex items-center gap-2 bg-white text-purple-700 px-6 py-3 rounded-xl font-bold hover:bg-purple-50 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                                >
                                    <UserIcon className="w-5 h-5" />
                                    Complete Profile
                                </Link>
                            )}
                        </div>
                    </div>
                    {/* Decorative Pattern */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-2xl -ml-10 -mb-10 pointer-events-none" />
                </div>
            )}

            {isFreeExceeded && (
                <div className="flex justify-between items-end">
                    <h2 className="text-3xl font-bold text-white">Welcome back, {firstName}! 👋</h2>
                </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-panel p-6 rounded-2xl flex items-center gap-4">
                    <div className="p-3 bg-blue-500/20 rounded-xl text-blue-400">
                        <FileText className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-400">Total Resumes</p>
                        <p className="text-2xl font-bold text-white">{stats.totalResumes}</p>
                    </div>
                </div>
                <div className="glass-panel p-6 rounded-2xl flex items-center gap-4">
                    <div className="p-3 bg-green-500/20 rounded-xl text-green-400">
                        <TrendingUp className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-400">Avg. AI Score</p>
                        <p className="text-2xl font-bold text-white">{stats.avgScore > 0 ? stats.avgScore : "-"}</p>
                    </div>
                </div>
                {/* Upsell / Info Card */}
                <div className="glass-panel p-6 rounded-2xl flex items-center justify-between border-purple-500/30 bg-purple-900/10">
                    <div>
                        <p className="text-sm text-purple-300 font-semibold mb-1">
                            {subscription?.plan === 'pro'
                                ? (subscription.billingCycle === 'semiannual' ? "Pro Saver" : "Pro Monthly")
                                : "Free Plan"}
                        </p>
                        <p className="text-xs text-gray-400">{subscription?.plan === 'pro' ? "Unlimited generations" : "1 Resume Limit"}</p>
                    </div>
                    <button onClick={() => onNavigate("subscription")} className="text-xs bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 px-3 py-1.5 rounded-lg transition-colors font-medium border border-purple-500/20">
                        Manage Plan
                    </button>
                </div>
            </div>

            {/* Recent Activity / Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="glass-panel p-6 rounded-2xl space-y-4">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-bold text-white">Recent Resumes</h3>
                        <button onClick={() => onNavigate("resumes")} className="text-xs text-purple-400 hover:text-purple-300 transition-colors">View All</button>
                    </div>

                    {recentResumes.length === 0 ? (
                        <div className="text-center py-8 border-2 border-dashed border-white/5 rounded-xl">
                            <p className="text-gray-500 text-sm mb-4">No resumes generated yet.</p>
                            <Link href="/tailor" className="text-sm text-purple-400 font-medium hover:underline">Create your first one &rarr;</Link>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {recentResumes.map((resume) => (
                                <div key={resume.id} className="p-3 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between hover:bg-white/10 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded bg-gray-700/50 flex items-center justify-center text-xs">PDF</div>
                                        <div>
                                            <p className="text-sm font-medium text-white line-clamp-1">{resume.title}</p>
                                            <p className="text-xs text-gray-500">
                                                {resume.createdAt ? timeAgo(resume.createdAt) : "Unknown date"}
                                            </p>
                                        </div>
                                    </div>
                                    {resume.score && resume.score > 0 && (
                                        <div className="text-xs font-bold text-green-400">{resume.score}% Match</div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="glass-panel p-6 rounded-2xl space-y-4">
                    <h3 className="font-bold text-white">Quick Actions</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <button onClick={() => onNavigate("profile")} className="p-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-left transition-colors group">
                            <UserIcon className="w-6 h-6 text-pink-400 mb-2 group-hover:scale-110 transition-transform" />
                            <p className="font-semibold text-white text-sm">Edit Master Profile</p>
                            <p className="text-xs text-gray-500 mt-1">Update skills & exp</p>
                        </button>
                        <button onClick={() => onNavigate("integrations")} className="p-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-left transition-colors group">
                            <LinkIcon className="w-6 h-6 text-blue-400 mb-2 group-hover:scale-110 transition-transform" />
                            <p className="font-semibold text-white text-sm">Connect Accounts</p>
                            <p className="text-xs text-gray-500 mt-1">
                                {(() => {
                                    const connectedAccounts = [];
                                    if (profile?.linkedinProfile || profile?.integrations?.linkedin) connectedAccounts.push('LinkedIn');
                                    if (profile?.githubProfile || profile?.integrations?.github) connectedAccounts.push('GitHub');
                                    if (profile?.integrations?.indeed) connectedAccounts.push('Indeed');
                                    if (profile?.integrations?.naukri) connectedAccounts.push('Naukri');
                                    
                                    if (connectedAccounts.length > 0) {
                                        return `${connectedAccounts.length} Connected: ${connectedAccounts.join(', ')}`;
                                    }
                                    return "LinkedIn, GitHub...";
                                })()}
                            </p>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function UserIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
        </svg>
    )
}
function LinkIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
    )
}
