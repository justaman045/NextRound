
import { NextResponse } from 'next/server';
import OpenAI from "openai";

const openai = new OpenAI({ baseURL: "https://openrouter.ai/api/v1", apiKey: process.env.OPENROUTER_API_KEY || process.env.GEMINI_API_KEY || "" });

export async function POST(request: Request) {
    try {
        const { name, description, technologies, model: modelName } = await request.json();

        if (!name) {
            return NextResponse.json({ error: "Project name is required" }, { status: 400 });
        }

        // Default to flash if not provided, else use requested model
        const selectedModel = modelName || "openrouter/free";

        const prompt = `
        You are an expert resume writer. I have a GitHub project that I want to add to my professional resume.
        Please enhance the description and tech stack to be more impressive and ATS-friendly.
        
        Project Name: ${name}
        Original Description: ${description || "No description provided."}
        Original Technologies: ${technologies || "Unknown"}
        
        Requirements:
        1. Generate a "description" consisting of 3-4 distinct bullet points. Each bullet point should start with a strong action verb, mention specific technologies used, and highlight the outcome or feature. Use professional language.
        2. Generate a "technologies" string (comma-separated) that infers likely tools/languages based on the description and project type if the original list is sparse. Merge with original technologies.
        
        Return ONLY valid JSON in this format, without markdown formatting or code blocks:
        {
            "description": "• Bullet 1\\n• Bullet 2\\n• Bullet 3",
            "technologies": "React, TypeScript, Firebase, Tailwind CSS"
        }
        `;

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

        // Clean up markdown if present
        const cleanedText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

        try {
            const data = JSON.parse(cleanedText);

            // Format bullet points nicely if they aren't already
            let finalDescription = data.description;
            if (Array.isArray(finalDescription)) {
                finalDescription = finalDescription.map(d => `• ${d}`).join('\n');
            }

            return NextResponse.json({
                description: finalDescription,
                technologies: data.technologies
            });
        } catch (e) {
            console.error("Failed to parse AI response:", responseText);
            return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
        }

    } catch (error) {
        console.error("AI Enhance Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
