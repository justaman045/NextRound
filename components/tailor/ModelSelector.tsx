import { Zap, Cpu, Sparkles, Beaker, AlignHorizontalDistributeEndIcon } from "lucide-react";

export const AI_MODELS = [
    {
        id: "gemini-2.5-flash",
        name: "Gemini 2.5 Flash",
        description: "Balanced speed & intelligence (New)",
        icon: Zap,
        color: "text-amber-400"
    },
    {
        id: "gemini-2.5-pro",
        name: "Gemini 2.5 Pro",
        description: "Best Quality for Reasoning",
        icon: Sparkles,
        color: "text-purple-400"
    },
    {
        id: "gemini-2.5-flash-lite",
        name: "Gemini 2.5 Flash Lite",
        description: "Fastest response, high limits",
        icon: Cpu,
        color: "text-green-400"
    },
    {
        id: "gemma-3-12b-it",
        name: "Gemma 3 12B",
        description: "Google's open-weight model",
        icon: AlignHorizontalDistributeEndIcon,
        color: "text-pink-400"
    },
    {
        id: "gemini-1.5-flash",
        name: "Gemini 1.5 Flash",
        description: "Reliable legacy version",
        icon: Beaker,
        color: "text-blue-400"
    }
];

interface ModelSelectorProps {
    selectedModel: string;
    onSelect: (modelId: string) => void;
    disabled?: boolean;
}

export default function ModelSelector({ selectedModel, onSelect, disabled }: ModelSelectorProps) {

    return (
        <div className="relative">
            <label className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-2 block">AI Model</label>
            <div className="grid grid-cols-1 gap-2">
                {AI_MODELS.map((model) => {
                    const Icon = model.icon;
                    const isSelected = selectedModel === model.id;
                    return (
                        <button
                            key={model.id}
                            onClick={() => onSelect(model.id)}
                            disabled={disabled}
                            className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${isSelected
                                ? "bg-purple-600/20 border-purple-500/50 shadow-lg shadow-purple-900/20"
                                : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
                                } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                            <div className={`p-2 rounded-lg bg-black/40 ${model.color}`}>
                                <Icon className="w-4 h-4" />
                            </div>
                            <div>
                                <div className={`text-sm font-bold ${isSelected ? "text-white" : "text-gray-300"}`}>
                                    {model.name}
                                </div>
                                <div className="text-[10px] text-gray-500">
                                    {model.description}
                                </div>
                            </div>
                            {isSelected && (
                                <div className="ml-auto w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
