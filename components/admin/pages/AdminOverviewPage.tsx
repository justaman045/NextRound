"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { getSystemConfig, updateSystemConfig } from "@/lib/firestore";
import { collection, getCountFromServer, query, where } from "firebase/firestore";
import { Users, FileText, DollarSign, Activity } from "lucide-react";

export default function AdminDashboard() {
    const [stats, setStats] = useState({
        totalUsers: 0,
        waitlistCount: 0,
        totalResumesGenerated: 0,
        totalPro: 0
    });
    const [loading, setLoading] = useState(true);

    // ... (fetchStats logic is already correct from previous pass, just state init was wrong)



    useEffect(() => {
        const fetchStats = async () => {
            try {
                // 1. Waitlist Count
                const waitlistColl = collection(db, "waitlist");
                const waitlistSnapshot = await getCountFromServer(waitlistColl);

                // 2. Active Users
                const usersColl = collection(db, "users");
                const usersSnapshot = await getCountFromServer(usersColl);

                // 3. Pro Subscribers
                const qPro = query(collection(db, "users"), where("plan", "==", "pro"));
                const proSnapshot = await getCountFromServer(qPro);

                // 4. Resumes Generated (Global Counter)
                const statsDoc = await import("firebase/firestore").then(mod => mod.getDoc(mod.doc(db, "system", "stats")));
                const globalResumes = statsDoc.exists() ? statsDoc.data().resumesGenerated || 0 : 0;

                setStats({
                    totalUsers: usersSnapshot.data().count,
                    waitlistCount: waitlistSnapshot.data().count,
                    totalResumesGenerated: globalResumes,
                    totalPro: proSnapshot.data().count
                });
            } catch (error: any) {
                console.error("Error fetching admin stats:", error);
                if (error.code === 'permission-denied') {
                    // Ensure user sees this
                    alert("Permission denied. Are you logged in with 'developerlife69@gmail.com'?");
                }
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    const StatCard = ({ title, value, icon: Icon, color }: any) => (
        <div className="glass-panel p-6 rounded-2xl border border-white/5 relative overflow-hidden group">
            <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity ${color}`}>
                <Icon className="w-24 h-24" />
            </div>
            <div className="relative z-10">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${color} bg-opacity-20 text-white`}>
                    <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wider">{title}</h3>
                <p className="text-3xl font-bold text-white mt-1">{loading ? "..." : value}</p>
            </div>
        </div>
    );

    const [systemMode, setSystemMode] = useState<"development" | "production">("production");

    useEffect(() => {
        const fetchConfig = async () => {
            const config = await getSystemConfig();
            if (config?.mode) setSystemMode(config.mode);
        };
        fetchConfig();
    }, []);

    const handleToggleMode = async () => {
        const newMode = systemMode === "development" ? "production" : "development";
        setSystemMode(newMode);
        await updateSystemConfig({ mode: newMode });
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">Dashboard Overview</h1>
                    <p className="text-gray-400 mt-2">Welcome back, Admin. Here's what's happening today.</p>
                </div>

                {/* System Mode Toggle */}
                <div className="glass-panel p-2 rounded-full flex items-center gap-2 border border-white/10">
                    <button
                        onClick={handleToggleMode}
                        className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${systemMode === 'development' ? 'bg-yellow-500 text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}
                    >
                        Development
                    </button>
                    <button
                        onClick={handleToggleMode}
                        className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${systemMode === 'production' ? 'bg-green-500 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                    >
                        Production
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Waitlist"
                    value={stats.waitlistCount}
                    icon={Users}
                    color="bg-blue-500"
                />
                <StatCard
                    title="Active Users"
                    value={stats.totalUsers}
                    icon={Activity}
                    color="bg-purple-500"
                />
                <StatCard
                    title="Resumes Generated"
                    value={stats.totalResumesGenerated}
                    icon={FileText}
                    color="bg-green-500"
                />
                <StatCard
                    title="Pro Subscribers"
                    value={stats.totalPro}
                    icon={DollarSign}
                    color="bg-yellow-500"
                />
            </div>

            {/* Quick Actions or Recent Activity could go here */}
            <div className="glass-panel p-8 rounded-2xl border border-white/5">
                <h2 className="text-xl font-bold text-white mb-4">Initial Setup Required</h2>
                <div className="space-y-2 text-gray-400">
                    <p>• Firestore Rules need to be updated to allow Admin (developerlife69@gmail.com) to read all collections.</p>
                    <p>• User tracking logic needs to be added to the auth flow to populate a 'users' collection reliably.</p>
                </div>
            </div>
        </div>
    );
}
