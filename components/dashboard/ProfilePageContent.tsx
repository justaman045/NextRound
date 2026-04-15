"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Sidebar, { Tab } from "@/components/dashboard/Sidebar";
import Overview from "@/components/dashboard/Overview";
import ProfileForm from "@/components/ProfileForm";
import ResumeList from "@/components/dashboard/ResumeList";
import ResumeStudio from "@/components/dashboard/ResumeStudio";
import Integrations from "@/components/dashboard/Integrations";
import SubscriptionView from "@/components/dashboard/Subscription";
import SocialProfile from "@/components/dashboard/SocialProfile";
import Settings from "@/components/dashboard/Settings";
import { Loader2, Menu, Triangle } from "lucide-react";
import { toast } from "sonner";
import { getUserProfile, getUserResumes, getUserSubscription, upgradeToPro, saveUserProfile } from "@/lib/firestore";
import { UserProfile, UserResume, Subscription } from "@/types";

export default function DashboardPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const searchParams = useSearchParams();
    const [activeTab, setActiveTab] = useState<Tab>("overview");
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Data State
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [stats, setStats] = useState({ totalResumes: 0, avgScore: 0 });
    const [recentResumes, setRecentResumes] = useState<UserResume[]>([]);
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [loadingData, setLoadingData] = useState(true);

    const handleTabChange = (tab: Tab) => {
        // Optimistic update
        setActiveTab(tab);
        setMobileMenuOpen(false);

        // URL update
        const params = new URLSearchParams(searchParams.toString());
        params.set('tab', tab);
        params.delete('resumeId'); // Clear resumeId when switching tabs
        router.push(`/profile?${params.toString()}`);
    };

    // Initialize activeTab from URL if present
    useEffect(() => {
        const tabParam = searchParams.get('tab');
        if (tabParam && ["overview", "social", "profile", "resumes", "integrations", "subscription", "studio", "settings"].includes(tabParam)) {
            setActiveTab(tabParam as Tab);
        }
    }, [searchParams]);

    useEffect(() => {
        const fetchData = async () => {
            if (user) {
                try {
                    const [profileData, resumesData, subscriptionData] = await Promise.all([
                        getUserProfile(user.uid),
                        getUserResumes(user.uid),
                        getUserSubscription(user.uid)
                    ]);

                    if (profileData) {
                        setProfile(profileData);
                    } else {
                        // Initialize default profile for new users AND save it
                        const newProfile: UserProfile = {
                            email: user.email || "",
                            fullName: user.displayName || "New User",
                            phone: "",
                            summary: "",
                            location: "",
                            website: "",
                            skills: "",
                            experience: [],
                            education: [],
                            projects: [],
                            integrations: {
                                linkedin: false,
                                github: false,
                                indeed: false,
                                naukri: false,
                                portfolio: false
                            }
                        };
                        setProfile(newProfile);
                        saveUserProfile(user.uid, newProfile).catch(err => console.error("Auto-save failed", err));
                    }
                    setSubscription(subscriptionData);

                    // Calculate Stats
                    const resumes = resumesData as UserResume[];
                    const totalResumes = resumes.length;
                    // Fix: Filter resumes with undefined or null score
                    const validScores = resumes.filter(r => r.score !== undefined && r.score !== null && r.score > 0).map(r => r.score as number);
                    const avgScore = validScores.length > 0
                        ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length)
                        : 0;

                    setStats({ totalResumes, avgScore });
                    setRecentResumes(resumes.slice(0, 3));

                } catch (error) {
                    console.error("Error fetching dashboard data:", error);
                } finally {
                    setLoadingData(false);
                }
            }
        };

        if (user) {
            fetchData();
        } else if (!authLoading) {
            setLoadingData(false);
        }
    }, [user, authLoading]);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/');
        }
    }, [user, authLoading, router]);

    const refreshProfile = async (newProfile?: UserProfile) => {
        if (newProfile) {
            setProfile(newProfile);
            return;
        }
        if (!user) return;
        setLoadingData(true);
        try {
            const [profileData, resumesData, subscriptionData] = await Promise.all([
                getUserProfile(user.uid),
                getUserResumes(user.uid),
                getUserSubscription(user.uid)
            ]);
            if (profileData) setProfile(profileData);
            setSubscription(subscriptionData);
        } catch (error) {
            console.error("Error refreshing profile:", error);
        } finally {
            setLoadingData(false);
        }
    };

    if (authLoading || loadingData) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-black text-white">
                <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
            </div>
        );
    }

    if (!profile) return null;

    return (
        <div className="min-h-screen bg-black text-white flex flex-col md:flex-row overflow-hidden relative font-sans selection:bg-purple-500/30">

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

            {/* Sidebar (Desktop & Mobile Overlay) */}
            <div className={`fixed inset-0 z-40 transform transition-transform duration-300 md:relative md:translate-x-0 md:inset-auto ${mobileMenuOpen ? "translate-x-0 bg-black/95" : "-translate-x-full"}`}>
                <Sidebar
                    activeTab={activeTab}
                    setActiveTab={handleTabChange}
                    isGithubConnected={profile?.integrations?.github}
                />
            </div>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto h-screen relative scroll-smooth">
                {/* Background Gradients */}
                <div className="fixed inset-0 pointer-events-none z-0">
                    <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[100px]" />
                    <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[100px]" />
                </div>

                <div className="relative z-10 p-4 md:p-10 max-w-[1400px] mx-auto pb-20">
                    {activeTab === "overview" && <Overview profile={profile} stats={stats} recentResumes={recentResumes} subscription={subscription} onNavigate={(tab) => handleTabChange(tab as Tab)} />}
                    {activeTab === "social" && <SocialProfile profile={profile} subscription={subscription} onUpdate={refreshProfile} />}
                    {activeTab === "profile" && (
                        <div className="animate-fade-in-up">
                            {/* We wrap ProfileForm to control its layout context if needed */}
                            <ProfileForm initialProfile={profile} />
                        </div>
                    )}
                    {activeTab === "resumes" && <ResumeList />}
                    {activeTab === "integrations" && <Integrations profile={profile} integrations={profile.integrations} onUpdate={refreshProfile} />}
                    {activeTab === "subscription" && subscription && <SubscriptionView subscription={subscription} />}
                    {activeTab === "settings" && <Settings />}
                </div>
            </main>

            {/* Resume Studio - Rendering outside main to ensure full screen overlay */}
            {activeTab === "studio" && <ResumeStudio />}
        </div>
    );
}
