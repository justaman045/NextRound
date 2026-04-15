"use server";

export interface AIModelBase {
    id: string;
    name: string;
    description: string;
    context_length: number;
}

export async function fetchFreeModelsRaw() {
    try {
        const response = await fetch("https://openrouter.ai/api/v1/models", {
            next: { revalidate: 86400 } // Cache for 24 hours
        });
        if (!response.ok) return [];

        const data = await response.json();
        
        // Strictly filter open models that are mathematically Free
        const freeModels = data.data.filter((m: any) => {
            if (m.pricing?.prompt !== "0" || m.pricing?.completion !== "0") return false;
            
            // Re-verify capability: block non-LLM modalities like Google's Lyria (Media/Audio) 
            // Ensures models populate the selector ONLY if they are explicitly capable of generating textual resumes.
            const nameLower = m.name?.toLowerCase() || "";
            if (nameLower.includes("lyria")) return false;
            
            // Resume contextual prompts are heavy; require a minimum context window
            if (m.context_length && m.context_length < 4000) return false;

            return true;
        });
        return freeModels;
    } catch(e) {
        console.error("OpenRouter Fetch Error:", e);
        return [];
    }
}

export async function getLargestFreeModel(): Promise<string> {
    const freeModels = await fetchFreeModelsRaw();
    if (!freeModels || freeModels.length === 0) return "Google Gemma 3 12B";

    const parseParams = (str: string) => {
        const match = str.match(/(\d+(?:\.\d+)?)b/i);
        return match ? parseFloat(match[1]) : 0;
    };

    freeModels.sort((a: any, b: any) => parseParams(b.id) - parseParams(a.id));
    return freeModels[0]?.name || "OpenSource Free Models";
}

export async function getTopFreeModels(): Promise<AIModelBase[]> {
    const freeModels = await fetchFreeModelsRaw();
    if (!freeModels || freeModels.length === 0) {
        // Safe robust fallback
        return [
            { id: "openrouter/free", name: "OpenRouter Free Auto-Routing", description: "Default active model.", context_length: 8192 }
        ];
    }

    const parseParams = (str: string) => {
        const match = str.match(/(\d+(?:\.\d+)?)b/i);
        return match ? parseFloat(match[1]) : 0;
    };

    // Sort by largest parameter count first
    freeModels.sort((a: any, b: any) => parseParams(b.id) - parseParams(a.id));

    return freeModels.map((m: any) => ({
        id: m.id,
        name: m.name, // Retain openrouter (free) suffix string
        description: `Max Context: ${m.context_length} tokens`,
        context_length: m.context_length
    }));
}
