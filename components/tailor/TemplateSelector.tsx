"use client";

import { Template } from "@/types";
import { Check, Layout, Sparkles } from "lucide-react";

interface Props {
    templates: Template[];
    selectedId: string | null;
    onSelect: (id: string) => void;
}

export default function TemplateSelector({ templates, selectedId, onSelect }: Props) {
    return (
        <div className="space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" /> Choose Your Style
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {templates.map((template) => {
                    const isSelected = selectedId === template.id;
                    return (
                        <button
                            key={template.id}
                            onClick={() => onSelect(template.id!)}
                            className={`group relative aspect-[3/4] rounded-xl overflow-hidden transition-all duration-300 ${isSelected
                                    ? 'ring-4 ring-purple-500 scale-105 shadow-2xl shadow-purple-500/20'
                                    : 'ring-1 ring-white/10 hover:ring-white/30 hover:scale-[1.02]'
                                }`}
                        >
                            {/* Preview Image */}
                            {template.imageUrl ? (
                                <img
                                    src={template.imageUrl}
                                    alt={template.name}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                />
                            ) : (
                                <div className="w-full h-full bg-gray-900 flex flex-col items-center justify-center text-gray-600 gap-2">
                                    <Layout className="w-8 h-8 opacity-50" />
                                    <span className="text-xs uppercase tracking-widest opacity-50">No Preview</span>
                                </div>
                            )}

                            {/* Badge */}
                            <div className="absolute top-2 left-2 flex gap-1">
                                {template.type === 'latex' ? (
                                    <span className="bg-orange-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm backdrop-blur-md">
                                        LaTeX
                                    </span>
                                ) : (
                                    <span className="bg-blue-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm backdrop-blur-md">
                                        React
                                    </span>
                                )}
                            </div>

                            {/* Overlay Info */}
                            <div className={`absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/90 via-black/60 to-transparent transition-all duration-300 ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                <h4 className="text-white text-sm font-bold truncate">{template.name}</h4>
                                <p className="text-gray-300 text-[10px] line-clamp-1">{template.description}</p>
                            </div>

                            {/* Selected Indicator */}
                            {isSelected && (
                                <div className="absolute top-2 right-2 bg-purple-500 text-white p-1 rounded-full shadow-lg animate-fade-in-up">
                                    <Check className="w-3 h-3" />
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>
            {templates.length === 0 && (
                <div className="text-center py-8 text-gray-500 text-sm">
                    No templates available.
                </div>
            )}
        </div>
    );
}
