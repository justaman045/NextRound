import { NextRequest, NextResponse } from 'next/server';
import OpenAI from "openai";

const openai = new OpenAI({ baseURL: "https://openrouter.ai/api/v1", apiKey: process.env.OPENROUTER_API_KEY || process.env.GEMINI_API_KEY || "" });

export async function POST(req: NextRequest) {
    try {
        const { resumeData, jobDescription, model = "openrouter/free" } = await req.json();

        if (!resumeData || !jobDescription) {
            return NextResponse.json({ error: "Missing resume data or job description" }, { status: 400 });
        }

        const prompt = `
            You are an expert ATS (Applicant Tracking System) Auditor.
            Your task is to objectively evaluate how well the following resume matches the provided Job Description.

            ### Candidate Resume Data:
            ${JSON.stringify(resumeData)}

            ### Target Job Description:
            ${jobDescription}

            ### Evaluation Criteria:
            1. **Keyword Matching**: Are critical hard skills and tools from the JD present in the resume?
            2. **Skill Relevance**: Does the candidate demonstrate the specific expertise required?
            3. **Experience Alignment**: Is the past work experience relevant to the target role?
            4. **Completeness**: Are there any major missing requirements?

            ### Output Format (Strict JSON):
            {
                "score": number, // 0-100
                "analysis": "string (1-2 sentences of high-level overview)",
                "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"] // Max 4 actionable tips
            }

            Return ONLY the raw JSON. No markdown.
        `;

        const completion = await openai.chat.completions.create({
            model: model,
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" }
        });

        const result = JSON.parse(completion.choices[0].message.content || "{}");

        return NextResponse.json(result);

    } catch (error: any) {
        console.error("ATS Evaluation Error:", error);
        return NextResponse.json({ error: error.message || "Failed to evaluate ATS score" }, { status: 500 });
    }
}
