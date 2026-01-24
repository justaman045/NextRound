"use client";

import { useEffect, useState } from "react";
import { getSystemConfig, updateSystemConfig } from "@/lib/firestore";
import { Loader2, Save, Power, PowerOff, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export default function AdminIntegrationsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
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
        const fetchConfig = async () => {
            try {
                const data = await getSystemConfig();
                if (data) {
                    setConfig({
                        enableIndeed: data.enableIndeed || false,
                        enableNaukri: data.enableNaukri || false,
                        enablePortfolio: data.enablePortfolio || false
                    });
                }
            } catch (error) {
                console.error("Failed to load config:", error);
                toast.error("Failed to load system config.");
            } finally {
                setLoading(false);
            }
        };

        fetchConfig();
    }, []);

    const handleToggle = (key: keyof typeof config) => {
        setConfig(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateSystemConfig(config);
            toast.success("Integration settings updated successfully!");
        } catch (error) {
            console.error("Failed to save config:", error);
            toast.error("Failed to save settings.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
            </div>
        );
    }

    const integrations = [
        { id: 'enableIndeed', label: 'Indeed Integration', description: 'Enable Indeed card in user dashboard (Job Platform)', icon: 'i', color: 'bg-[#2164f3]' },
        { id: 'enableNaukri', label: 'Naukri Integration', description: 'Enable Naukri card in user dashboard (Job Platform)', icon: 'n', color: 'bg-[#4D65F0]' },
        { id: 'enablePortfolio', label: 'Portfolio Website', description: 'Enable Portfolio connection (Developer Tool)', icon: 'www', color: 'bg-purple-600' }
    ];

    return (
        <div className="space-y-8 animate-fade-in-up">
            <div>
                <h1 className="text-3xl font-bold text-white">Integration Management</h1>
                <p className="text-gray-400 mt-2">Control the visibility of beta integrations globally.</p>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {integrations.map((item) => {
                    const isEnabled = config[item.id as keyof typeof config];
                    return (
                        <div key={item.id} className="glass-panel p-6 rounded-xl border border-white/5 flex items-center justify-between group hover:border-purple-500/20 transition-all">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg ${item.color}`}>
                                    {item.icon}
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">{item.label}</h3>
                                    <p className="text-sm text-gray-400">{item.description}</p>
                                </div>
                            </div>

                            <button
                                onClick={() => handleToggle(item.id as keyof typeof config)}
                                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-black ${isEnabled ? 'bg-green-500' : 'bg-gray-700'}`}
                            >
                                <span
                                    className={`${isEnabled ? 'translate-x-7' : 'translate-x-1'
                                        } inline-block h-6 w-6 transform rounded-full bg-white transition-transform duration-200 shadow-md`}
                                />
                            </button>
                        </div>
                    );
                })}
            </div>

            <div className="flex justify-end pt-4 border-t border-white/10">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold shadow-lg shadow-purple-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    Save Changes
                </button>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-start gap-3 mt-8">
                <ShieldCheck className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                    <h4 className="text-sm font-bold text-blue-300">Safe Display Logic</h4>
                    <p className="text-xs text-blue-200 mt-1">
                        Disabling an integration here hides it for all users who haven't connected it yet.
                        Users who have already connected the service will continue to see it to access their data.
                    </p>
                </div>
            </div>
        </div>
    );
}
