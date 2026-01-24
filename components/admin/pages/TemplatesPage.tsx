"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, addDoc, updateDoc, doc, deleteDoc, query, orderBy, setDoc } from "firebase/firestore";
import { Loader2, Plus, Trash2, Edit2, Check, X, Layout, FileCode, Code, Save } from "lucide-react";
import { Template, TemplateFile } from "@/types";
import LatexCodeEditor from "@/components/admin/LatexCodeEditor";

export default function TemplatesPage() {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form State
    const [formData, setFormData] = useState<Partial<Template>>({
        name: "",
        description: "",
        componentKey: "modern",
        imageUrl: "",
        isActive: true,
        type: 'react',
        files: []
    });

    const fetchTemplates = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, "templates"));
            const snapshot = await getDocs(q);
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Template[];
            setTemplates(data);
        } catch (error) {
            console.error("Error fetching templates:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTemplates();
    }, []);

    const handleSave = async () => {
        try {
            const dataToSave = { ...formData };
            if (dataToSave.type === 'react') {
                delete dataToSave.files;
            } else {
                delete dataToSave.componentKey;
                if (!dataToSave.files || dataToSave.files.length === 0) {
                    dataToSave.files = [{ path: "main.tex", content: "" }];
                }
            }

            if (editingId) {
                await updateDoc(doc(db, "templates", editingId), dataToSave);
            } else {
                await addDoc(collection(db, "templates"), dataToSave);
            }

            resetForm();
            fetchTemplates();
        } catch (error) {
            console.error("Error saving template:", error);
            alert("Failed to save template");
        }
    };

    const resetForm = () => {
        setFormData({
            name: "",
            description: "",
            componentKey: "modern",
            imageUrl: "",
            isActive: true,
            type: 'react',
            files: []
        });
        setIsEditing(false);
        setEditingId(null);
    };

    const startEdit = (template: Template) => {
        setFormData(template);
        setEditingId(template.id || null);
        setIsEditing(true);
    }

    const toggleActive = async (id: string, currentStatus: boolean) => {
        try {
            const ref = doc(db, "templates", id);
            await updateDoc(ref, { isActive: !currentStatus });
            setTemplates(prev => prev.map(t => t.id === id ? { ...t, isActive: !currentStatus } : t));
        } catch (error) {
            console.error("Error toggling template:", error);
        }
    };

    const deleteTemplate = async (id: string) => {
        if (!confirm("Are you sure? This cannot be undone.")) return;
        try {
            await deleteDoc(doc(db, "templates", id));
            setTemplates(prev => prev.filter(t => t.id !== id));
        } catch (error) {
            console.error("Error deleting template:", error);
        }
    };

    const seedDefaults = async () => {
        if (!confirm("This will add default templates (Modern, Minimalist, Creative) to Firestore. Continue?")) return;
        setLoading(true);
        try {
            const defaults = [
                {
                    name: "Modern Professional",
                    description: "Clean, professional look suitable for most industries.",
                    type: "react",
                    componentKey: "modern",
                    isActive: true,
                    imageUrl: "https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&q=80&w=500"
                },
                {
                    name: "Minimalist Elegant",
                    description: "Serif typography with plenty of whitespace. Focuses on content.",
                    type: "react",
                    componentKey: "minimalist",
                    isActive: true,
                    imageUrl: "https://images.unsplash.com/photo-1512486130939-2c4f79935e4f?auto=format&fit=crop&q=80&w=500"
                },
                {
                    name: "Creative Sidebar",
                    description: "Two-column layout with a distinct sidebar for skills and contact info.",
                    type: "react",
                    componentKey: "creative",
                    isActive: true,
                    imageUrl: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&q=80&w=500"
                }
            ];

            for (const t of defaults) {
                // Check if exists by componentKey to avoid duplicates? 
                // Simple auto-id add is safer for now, user can delete duplicates.
                // Or better: check by name.
                // For simplicity in this seed, just add.
                await addDoc(collection(db, "templates"), t);
            }
            fetchTemplates();
            alert("Default templates seeded!");
        } catch (error) {
            console.error("Error seeding:", error);
            alert("Failed to seed templates");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8 pb-20">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white">Template Manager</h1>
                    <p className="text-gray-400 mt-1">Control which resume designs are available to users.</p>
                </div>
                {!isEditing && (
                    <div className="flex gap-2">
                        <button
                            onClick={seedDefaults}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors font-medium border border-white/10"
                        >
                            <Layout className="w-4 h-4" /> Seed Defaults
                        </button>
                        <button
                            onClick={() => setIsEditing(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium"
                        >
                            <Plus className="w-4 h-4" /> Add Template
                        </button>
                    </div>
                )}
            </div>

            {/* Add/Edit Template Form */}
            {isEditing && (
                <div className="glass-panel p-6 rounded-2xl border border-white/10 animate-fade-in-up">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-white">{editingId ? 'Edit Template' : 'Add New Template'}</h3>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setFormData({ ...formData, type: 'react' })}
                                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${formData.type === 'react' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-gray-800 text-gray-400'}`}
                            >
                                React Component
                            </button>
                            <button
                                onClick={() => setFormData({ ...formData, type: 'latex' })}
                                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${formData.type === 'latex' ? 'bg-orange-600 text-white shadow-lg shadow-orange-500/20' : 'bg-gray-800 text-gray-400'}`}
                            >
                                LaTeX Studio
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <input
                            type="text"
                            placeholder="Template Name"
                            value={formData.name || ""}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            className="glass-input p-3 rounded-xl"
                        />
                        <input
                            type="text"
                            placeholder="Description"
                            value={formData.description || ""}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            className="glass-input p-3 rounded-xl"
                        />
                        <input
                            type="text"
                            placeholder="Preview Image URL"
                            value={formData.imageUrl || ""}
                            onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                            className="glass-input p-3 rounded-xl"
                        />
                        {formData.type === 'react' && (
                            <input
                                type="text"
                                placeholder="Component Key (e.g. 'modern')"
                                value={formData.componentKey || ""}
                                onChange={e => setFormData({ ...formData, componentKey: e.target.value })}
                                className="glass-input p-3 rounded-xl border-blue-500/30"
                            />
                        )}
                    </div>

                    {/* LaTeX Editor Area */}
                    {formData.type === 'latex' && (
                        <div className="mb-6">
                            <div className="text-xs text-gray-400 mb-2 flex justify-between">
                                <span>LaTeX Source Files</span>
                                <span className="text-orange-400">Handlebars syntax supported: {"\\name{ {{fullName}} }"}</span>
                            </div>
                            <LatexCodeEditor
                                files={formData.files || []}
                                onChange={(files) => setFormData({ ...formData, files })}
                            />
                        </div>
                    )}

                    <div className="flex justify-end gap-2 pt-4 border-t border-white/5">
                        <button
                            onClick={resetForm}
                            className="px-4 py-2 text-gray-400 hover:text-white"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={!formData.name}
                            className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50 flex items-center gap-2"
                        >
                            <Save className="w-4 h-4" /> Save Template
                        </button>
                    </div>
                </div>
            )}

            {/* Template List */}
            {loading ? (
                <div className="flex justify-center p-12">
                    <Loader2 className="animate-spin w-8 h-8 text-purple-500" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {templates.map(template => (
                        <div key={template.id} className="glass-panel rounded-2xl overflow-hidden border border-white/5 group hover:border-purple-500/30 transition-all">
                            <div className="h-48 bg-gray-900 relative">
                                {template.imageUrl ? (
                                    <img src={template.imageUrl} alt={template.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-white/5 text-gray-600">
                                        <Layout className="w-12 h-12" />
                                    </div>
                                )}
                                <div className="absolute top-2 right-2 flex gap-2">
                                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${template.type === 'latex' ? 'bg-orange-500/20 border-orange-500/50 text-orange-200' : 'bg-blue-500/20 border-blue-500/50 text-blue-200'}`}>
                                        {template.type === 'latex' ? 'LaTeX' : 'React'}
                                    </span>
                                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${template.isActive ? 'bg-green-500 text-black' : 'bg-red-500 text-white'}`}>
                                        {template.isActive ? 'ACTIVE' : 'INACTIVE'}
                                    </span>
                                </div>
                            </div>
                            <div className="p-6">
                                <h3 className="text-xl font-bold text-white mb-1">{template.name}</h3>
                                <p className="text-gray-400 text-sm mb-4 line-clamp-2">{template.description}</p>

                                <div className="flex items-center justify-between border-t border-white/5 pt-4">
                                    <button
                                        onClick={() => startEdit(template)}
                                        className="text-sm font-medium text-gray-400 hover:text-white flex items-center gap-1"
                                    >
                                        <Edit2 className="w-4 h-4" /> Edit
                                    </button>
                                    <button
                                        onClick={() => toggleActive(template.id!, template.isActive)}
                                        className="text-sm font-medium text-gray-400 hover:text-white flex items-center gap-1"
                                    >
                                        {template.isActive ? (
                                            <><X className="w-4 h-4" /> Disable</>
                                        ) : (
                                            <><Check className="w-4 h-4" /> Enable</>
                                        )}
                                    </button>
                                    <button
                                        onClick={() => deleteTemplate(template.id!)}
                                        className="text-sm font-medium text-red-500/50 hover:text-red-500 flex items-center gap-1"
                                    >
                                        <Trash2 className="w-4 h-4" /> Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}

                    {templates.length === 0 && !loading && (
                        <div className="col-span-full text-center py-12 text-gray-500">
                            No templates found. Add your first one above!
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
