import { NextResponse } from 'next/server';
import OpenAI from "openai";
import { checkRateLimit } from '@/lib/ratelimit';

const openai = new OpenAI({ baseURL: "https://openrouter.ai/api/v1", apiKey: process.env.OPENROUTER_API_KEY || process.env.GEMINI_API_KEY || "" });

export async function POST(request: Request) {
    try {
        // Rate Limiting
        const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
        const { success, limit, reset, remaining } = await checkRateLimit(`ai-limit-${ip}`);

        if (!success) {
            return NextResponse.json(
                { error: "Too many requests. Please try again later." },
                {
                    status: 429,
                    headers: {
                        'X-RateLimit-Limit': limit.toString(),
                        'X-RateLimit-Remaining': remaining.toString(),
                        'X-RateLimit-Reset': reset.toString(),
                    }
                }
            );
        }

        const { text, type, context, model: modelName } = await request.json();

        if (!text) {
            return NextResponse.json({ error: "Text is required" }, { status: 400 });
        }

        // Fallback or use requested model
        const selectedModel = modelName || "openrouter/free";

        let systemPrompt = "";
        let isJson = false;

        switch (type) {
            case "summary":
                systemPrompt = "You are an expert resume writer. Rewrite the following professional summary to be more impactful, concise, and professional. Highlight key achievements and skills. Keep it to one paragraph or 3-4 distinct bullet points if appropriate. IMPORTANT: Output ONLY the rewritten summary as plain text. Do NOT include any introductory or concluding text. Optimize for high ATS scoring by including relevant industry keywords.";
                break;
            case "experience":
                isJson = true;
                systemPrompt = `You are an expert resume writer. Rewrite the job description to achieve a 99/100 ATS score.
                
                Guidelines:
                1. Use the STAR method (Situation, Task, Action, Result) for every bullet point.
                2. QUANTIFY results with specific numbers, percentages, or dollar amounts (e.g., "Improved X by 20%", "Reduced latency by 50ms").
                3. Start every bullet point with a strong action verb (e.g., "Spearheaded", "Engineered", "Optimized").
                4. Focus on technical skills, leadership, and tangible impact.
                
                Context (Role/Company): ${context || "N/A"}
                
                Output a JSON object with the following structure:
                {
                    "role": "Improved Job Title (Standard Industry Term)",
                    "description": "• Bullet point 1\n• Bullet point 2\n• Bullet point 3\n(Ensure each line starts with a bullet point •)"
                }
                IMPORTANT: Output ONLY valid JSON.`;
                break;
            case "project":
                isJson = true;
                systemPrompt = `You are an expert technical resume writer. Rewrite the project description to show technical depth and impact.
                
                Guidelines:
                1. Highlight the technical problem solved and the specific solution architecture.
                2. Mention specific technologies used and *how* they were used.
                3. Quantify the outcome (e.g., "Handled 10k+ concurrent users", "Reduced build time by 40%").
                4. Use professional, concise language optimized for ATS parsers.
                
                Context (Project Name): ${context || "N/A"}
                
                Output a JSON object with the following structure:
                {
                    "name": "Improved Project Name (Professional & Descriptive)",
                    "description": "• Bullet point 1\n• Bullet point 2\n• Bullet point 3\n(Ensure each line starts with a bullet point •)",
                    "technologies": "Comma separated list of core technologies used"
                }
                IMPORTANT: Output ONLY valid JSON.`;
                break;
            case "skills":
                systemPrompt = "You are an expert resume writer. Categorize the provided skills logically based on their domains (Languages, Frameworks, Tools, etc). YOU MUST format the output exactly as:\nCategory Name: Skill 1, Skill 2\nCategory Name 2: Skill 1\nSeparate each category with a newline. IMPORTANT: Output ONLY the categorized list as plain text.";
                break;
            default:
                systemPrompt = "You are an expert resume writer. Improve the clarity, professional tone, and impact of the following text. IMPORTANT: Output ONLY the enhanced text.";
        }

        const prompt = `${systemPrompt}\n\nOriginal Text:\n${text}\n\nEnhanced Version${isJson ? " (JSON)" : ""}:`;

        let responseText = "";
        try {
            const completion = await openai.chat.completions.create({
                model: selectedModel,
                messages: [{ role: "user", content: prompt }]
            });
            responseText = completion.choices[0].message.content || "";
        } catch (error: any) {
            console.warn(`Model ${selectedModel} failed, falling back to openrouter/free. Error: ${error.message}`);
            const completion = await openai.chat.completions.create({
                model: "openrouter/free",
                messages: [{ role: "user", content: prompt }]
            });
            responseText = completion.choices[0].message.content || "";
        }

        responseText = responseText.trim();

        // Clean markdown code blocks if present (common with JSON output)
        if (responseText.startsWith("```json")) {
            responseText = responseText.replace(/^```json\n/, "").replace(/\n```$/, "");
        } else if (responseText.startsWith("```")) {
            responseText = responseText.replace(/^```\n/, "").replace(/\n```$/, "");
        }

        // Validate JSON if required
        if (isJson) {
            try {
                const jsonCheck = JSON.parse(responseText);
                return NextResponse.json(jsonCheck); // Return object directly
            } catch (e) {
                console.error("Failed to parse JSON from AI:", responseText);
                return NextResponse.json({ error: "AI produced invalid JSON" }, { status: 500 });
            }
        }

        return NextResponse.json({ enhancedText: responseText });

    } catch (error) {
        console.error("AI Enhance Text Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
