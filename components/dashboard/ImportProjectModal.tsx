"use client";

import { Project, Subscription } from "@/types";
import { X, Wand2, Loader2, Save, Sparkles, Lock } from "lucide-react";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { AI_MODELS } from "../tailor/ModelSelector";

interface ImportProjectModalProps {
    project: Project;
    isOpen: boolean;
    subscription: Subscription | null;
    onClose: () => void;
    onSave: (project: Project) => Promise<void>;
}

export default function ImportProjectModal({ project, isOpen, subscription, onClose, onSave }: ImportProjectModalProps) {
    const [formData, setFormData] = useState<Project>({
        ...project,
        description: project.description || ""
    });
    const [enhancing, setEnhancing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [selectedModel, setSelectedModel] = useState<string>("gemini-2.5-flash");
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    useEffect(() => {
        setFormData({
            ...project,
            description: project.description || ""
        });
        // Reset transient states
        setEnhancing(false);
        setSaving(false);
    }, [project]);

    // Check if user has access to AI (Pro or Enterprise)
    const plan = subscription?.plan?.toLowerCase();
    const isPro = plan === "pro" || plan === "enterprise";

    if (!isOpen || !mounted) return null;

    const handleEnhance = async () => {
        if (!isPro) return; // Guard clause

        setEnhancing(true);
        try {
            const res = await fetch('/api/ai/enhance-project', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    description: formData.description,
                    technologies: formData.technologies,
                    model: selectedModel
                })
            });

            if (!res.ok) throw new Error("Enhancement failed");

            const data = await res.json();
            setFormData(prev => ({
                ...prev,
                description: data.description,
                technologies: data.technologies
            }));
        } catch (error) {
            console.error("Error enhancing project:", error);
            alert("Failed to enhance project with AI. Please try again.");
        } finally {
            setEnhancing(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await onSave(formData);
            onClose();
        } catch (error) {
            console.error("Error saving project:", error);
            alert("Failed to import project.");
        } finally {
            setSaving(false);
        }
    };

    const modalContent = (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="glass-panel w-full max-w-2xl bg-[#161b22] border border-white/20 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10 bg-white/5">
                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-xl font-bold text-white">Import Project</h2>
                            {/* Plan Badge for Debugging/Transparency */}
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${isPro
                                ? "bg-purple-500/20 text-purple-300 border-purple-500/30"
                                : "bg-gray-700/50 text-gray-400 border-gray-600/30"
                                }`}>
                                {subscription?.plan || "Free"} Plan
                            </span>
                        </div>
                        <p className="text-sm text-gray-400">Review and enhance details before adding to Master Profile.</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6 overflow-y-auto flex-1">

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Project Name</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none transition-colors"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Project Link</label>
                            <input
                                type="text"
                                value={formData.link || ""}
                                onChange={e => setFormData({ ...formData, link: e.target.value })}
                                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none transition-colors"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Technologies</label>

                            {/* AI Control for Technologies */}
                            {isPro ? (
                                <button
                                    onClick={handleEnhance}
                                    disabled={enhancing}
                                    className="text-xs flex items-center gap-1.5 text-purple-400 hover:text-purple-300 transition-colors disabled:opacity-50"
                                >
                                    <Sparkles className="w-3 h-3" />
                                    {enhancing ? "Thinking..." : "Auto-Detect"}
                                </button>
                            ) : (
                                <div className="flex items-center gap-1.5 text-xs text-gray-500 cursor-not-allowed">
                                    <Lock className="w-3 h-3" />
                                    <span className="opacity-0 hover:opacity-100 transition-opacity">Upgrade for AI</span>
                                </div>
                            )}
                        </div>
                        <input
                            type="text"
                            value={formData.technologies || ""}
                            onChange={e => setFormData({ ...formData, technologies: e.target.value })}
                            placeholder="React, Node.js, etc."
                            className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none transition-colors"
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Description (Bullet Points)</label>

                            {/* AI Controls Container */}
                            <div className="flex items-center gap-3">
                                {isPro && (

                                    <select
                                        value={selectedModel}
                                        onChange={(e) => setSelectedModel(e.target.value as any)}
                                        className="bg-[#161b22] border border-white/10 rounded text-[10px] text-gray-300 px-2 py-1 focus:outline-none focus:border-purple-500 cursor-pointer hover:bg-black/50 transition-colors"
                                    >
                                        {AI_MODELS.map((model) => (
                                            <option key={model.id} value={model.id} className="bg-[#161b22] text-white">
                                                {model.name}
                                            </option>
                                        ))}
                                    </select>
                                )}

                                <button
                                    onClick={handleEnhance}
                                    disabled={!isPro || enhancing}
                                    className={`text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all ${isPro
                                        ? "bg-purple-500/10 border-purple-500/20 text-purple-300 hover:bg-purple-500/20 shadow-lg shadow-purple-500/5"
                                        : "bg-gray-800/50 border-white/5 text-gray-500 cursor-not-allowed"
                                        }`}
                                >
                                    {enhancing ? <Loader2 className="w-3 h-3 animate-spin" /> : isPro ? <Wand2 className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                                    {enhancing ? "Enhancing..." : isPro ? "Enhance with AI" : "Upgrade to Enhance"}
                                </button>
                            </div>
                        </div>
                        <textarea
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            rows={8}
                            className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none transition-colors leading-relaxed"
                            placeholder="• Bullet point 1..."
                        />
                        <p className="text-xs text-gray-500">
                            Tip: Use standard bullet points (• or -) for best resume formatting.
                        </p>
                    </div>

                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/10 bg-white/5 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg text-sm font-semibold text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-6 py-2 rounded-lg text-sm font-semibold bg-white text-black hover:bg-purple-50 transition-colors flex items-center gap-2"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {saving ? "Importing..." : "Import to Master Profile"}
                    </button>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}
