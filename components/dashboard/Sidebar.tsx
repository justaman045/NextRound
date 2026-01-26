"use client";

import { LayoutDashboard, User, FileText, Link as LinkIcon, CreditCard, LogOut, Share2, Settings, Triangle, PenTool } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export type Tab = "overview" | "studio" | "profile" | "resumes" | "integrations" | "subscription" | "social" | "settings";

interface SidebarProps {
    activeTab: Tab;
    setActiveTab: (tab: Tab) => void;
    isGithubConnected?: boolean;
}

export default function Sidebar({ activeTab, setActiveTab, isGithubConnected }: SidebarProps) {
    const { logout } = useAuth();

    const menuItems = [
        { id: "overview", label: "Overview", icon: LayoutDashboard },
        { id: "resumes", label: "My Resumes", icon: FileText },
        { id: "social", label: "Social Profile", icon: Share2 },
        { id: "profile", label: "Master Profile", icon: User },
        { id: "integrations", label: "Integrations", icon: LinkIcon },
        { id: "subscription", label: "Subscription", icon: CreditCard },
        { id: "settings", label: "Settings", icon: Settings },
    ] as const;

    return (
        <aside className="w-full md:w-64 flex flex-col h-full bg-black/40 border-r border-white/10 backdrop-blur-xl">
            <div className="p-6 flex items-center gap-3">
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg shadow-white/10">
                    <Triangle className="w-4 h-4 text-black fill-current" />
                </div>
                <div>
                    <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
                        NextRound
                    </h1>
                    <p className="text-xs text-gray-500 mt-1">PRO Dashboard</p>
                </div>
            </div>

            <nav className="flex-1 px-4 space-y-2">
                {menuItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id as Tab)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${activeTab === item.id
                            ? "bg-purple-600/20 text-purple-300 border border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.15)]"
                            : "text-gray-400 hover:bg-white/5 hover:text-white"
                            }`}
                    >
                        <item.icon className={`w-5 h-5 ${activeTab === item.id ? "text-purple-400" : "group-hover:text-purple-400 transition-colors"}`} />
                        <span className="font-medium text-sm">{item.label}</span>
                    </button>
                ))}
            </nav>

            <div className="p-4 border-t border-white/10">
                <button
                    onClick={logout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200 group"
                >
                    <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span className="font-medium text-sm">Logout</span>
                </button>
            </div>
        </aside>
    );
}
