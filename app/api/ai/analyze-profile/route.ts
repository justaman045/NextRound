
import { NextResponse } from 'next/server';
import OpenAI from "openai";

export async function POST(request: Request) {
    const openai = new OpenAI({ baseURL: "https://openrouter.ai/api/v1", apiKey: process.env.OPENROUTER_API_KEY || process.env.GEMINI_API_KEY || "" });

    try {
        const { profile, source = "github", model } = await request.json();

        if (!profile) {
            return NextResponse.json({ error: "Profile data is required" }, { status: 400 });
        }

        const modelName = model || "openai/gpt-oss-120b:free";
        let systemPrompt = "";

        if (source === "linkedin") {
            systemPrompt = `Analyze the User's Professional Profile based primarily on their WORK EXPERIENCE and EDUCATION (simulating a LinkedIn context).
            
            Input Data:
            - Experience: ${profile.experience?.map((e: any) => `${e.role} at ${e.company} (${e.startDate} - ${e.endDate}): ${e.description}`).join('; ') || "N/A"}
            - Education: ${profile.education?.map((e: any) => `${e.degree} at ${e.school}`).join('; ') || "N/A"}
            - Skills: ${profile.skills || "N/A"}
            - Headline: ${profile.fullName || "Professional"}

            Determine the **Job Role**, **Seniority**, and **Experience**.
            Also provide a "Project Insight" equivalent, which in this context means "Key Achievement Insight": What is their single most impressive career win?

            Output valid JSON only:
            {
                "role": "Job Title",
                "seniority": "Seniority Level",
                "yearsOfExperience": "Estimated Years",
                "summary": "Brief professional summary.",
                "projectInsight": {
                    "role": "Key Skill/Domain",
                    "seniority": "Validation Level (e.g. Proven Expert)",
                    "justification": "One sentence highlighting their biggest achievement or strength."
                }
            }`;
        } else {
            // Default GitHub/Project Focus
            systemPrompt = `Determine the most suitable **Job Role** and **Seniority Level** from TWO perspectives:
            1. **Project-Only Analysis**: Based STRICTLY on the code complexity, tech stack, and scope of the provided GitHub/Social projects. Ignore bio/experience.
            2. **Comprehensive Analysis**: Based on the User's Bio, Experience, AND Projects combined.

            Input Profile Data:
            - Bio: ${profile.githubProfile?.bio || profile.summary || "N/A"}
            - Skills: ${profile.githubSkills || profile.skills || "N/A"}
            - Projects: ${profile.projects?.map((p: any) => `${p.name}: ${p.description} (${p.technologies})`).join('; ') || "N/A"}
            
            Output valid JSON only:
            {
                "role": "Comprehensive Job Title",
                "seniority": "Comprehensive Seniority",
                "yearsOfExperience": "Estimated Years (e.g. '3-5 Years')",
                "summary": "Comprehensive justification.",
                "projectInsight": {
                    "role": "Role based ONLY on code/projects",
                    "seniority": "Seniority based ONLY on code/projects",
                    "justification": "Brief 1-sentence logic (max 15 words) explaining the project-based level."
                }
            }`;
        }

        let responseText = "";
        try {
            const completion = await openai.chat.completions.create({
                model: modelName,
                messages: [{ role: "user", content: systemPrompt }]
            });
            responseText = completion.choices[0].message.content || "";
        } catch (error: any) {
            console.warn(`Primary model ${modelName} failed: `, error.message);
            const completion = await openai.chat.completions.create({
                model: "openai/gpt-oss-120b:free",
                messages: [{ role: "user", content: systemPrompt }]
            });
            responseText = completion.choices[0].message.content || "";

            return NextResponse.json({
                ...JSON.parse(responseText.replace(/```json\n?|```/g, "").trim()),
                model: "Gemini 2.0 Flash Lite (Fallback)"
            });
        }

        // Robust JSON extraction
        let parsedJSON: any = {};
        try {
            const jsonMatch = responseText.match(/```(?:json)?\n([\s\S]*?)\n```/i);
            if (jsonMatch) {
                responseText = jsonMatch[1];
            } else {
                const fallbackMatch = responseText.match(/\{[\s\S]*\}/);
                if (fallbackMatch) {
                    responseText = fallbackMatch[0];
                }
            }
            parsedJSON = JSON.parse(responseText);
        } catch (e) {
            console.error("Failed to parse JSON string:", responseText);
            throw new Error("Invalid output format from model");
        }

        return NextResponse.json({
            ...parsedJSON,
            model: modelName.split("/").pop() || modelName
        });

    } catch (error: any) {
        console.error("AI Profile Analysis Error:", error);
        return NextResponse.json({ error: error.message || "Analysis failed", stack: error.stack }, { status: 500 });
    }
}
