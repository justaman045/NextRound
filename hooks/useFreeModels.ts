import { useState, useEffect } from "react";
import { getTopFreeModels, AIModelBase } from "@/actions/openrouter";

const COLORS = [
    "text-purple-400", 
    "text-amber-400", 
    "text-emerald-400", 
    "text-blue-400", 
    "text-pink-400", 
    "text-orange-400"
];

export interface UIModel extends AIModelBase {
    color: string;
}

export function useFreeModels() {
    // Start with a safe default matching our universal fallback
    const [models, setModels] = useState<UIModel[]>([
        {
            id: "openai/gpt-oss-120b:free",
            name: "OpenAI: GPT-OSS 120B",
            description: "Default active model.",
            context_length: 8192,
            color: "text-purple-400"
        }
    ]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        const load = async () => {
            try {
                const raw = await getTopFreeModels();
                if (!mounted) return;
                
                const uiModels = raw.map((m, i) => ({
                    ...m,
                    color: COLORS[i % COLORS.length]
                }));
                // Only override if we truly fetched models
                if (uiModels.length > 0) {
                    setModels(uiModels);
                }
            } catch (err) {
                console.error("Failed to fetch dynamic models", err);
            } finally {
                if (mounted) setLoading(false);
            }
        };
        load();
        return () => { mounted = false };
    }, []);

    return { models, loading };
}
