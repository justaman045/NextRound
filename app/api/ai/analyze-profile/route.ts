
import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(request: Request) {
    try {
        const { profile, source = "github" } = await request.json();

        if (!profile) {
            return NextResponse.json({ error: "Profile data is required" }, { status: 400 });
        }

        const modelName = "gemma-3-12b-it";
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

        let result;
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            result = await model.generateContent(systemPrompt);
        } catch (error: any) {
            console.warn(`Primary model ${modelName} failed: `, error.message);
            const fallbackModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            result = await fallbackModel.generateContent(systemPrompt);

            return NextResponse.json({
                ...JSON.parse(result.response.text().replace(/```json\n?|```/g, "").trim()),
                model: "Gemini 1.5 Flash (Fallback)"
            });
        }

        let responseText = result.response.text().trim();
        if (responseText.startsWith("```json")) {
            responseText = responseText.replace(/^```json\n/, "").replace(/\n```$/, "");
        } else if (responseText.startsWith("```")) {
            responseText = responseText.replace(/^```\n/, "").replace(/\n```$/, "");
        }

        const analysis = JSON.parse(responseText);

        return NextResponse.json({
            ...analysis,
            model: "Gemma 3 12B"
        });

    } catch (error) {
        console.error("AI Profile Analysis Error:", error);
        return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
    }
}
