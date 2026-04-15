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
            You are a Professional Career Coach and Expert Writer.
            Your task is to write a highly compelling, tailored Cover Letter for the following candidate applying to the specific job below.

            ### Candidate Data:
            Name: ${resumeData.fullName}
            Summary: ${resumeData.summary}
            Experience Highlights: ${resumeData.experience.map((e: any) => `${e.role} at ${e.company}`).join(', ')}
            Top Skills: ${resumeData.skills}

            ### Target Job Description:
            ${jobDescription}

            ### Instructions:
            1. **Tone**: Professional, confident, and enthusiastic.
            2. **Structure**:
               - Proper Header (if contact info present)
               - Salutation
               - Hook: Mention the specific role and why you're excited.
               - Body Paragraph 1: Connect your most relevant experience to their core needs.
               - Body Paragraph 2: Mention specific skills/achievements that prove culture/technical fit.
               - Call to Action: Request an interview.
               - Sign-off.
            3. **Customization**: Do NOT use generic templates. Reference specific keywords from the JD.
            4. **Length**: Keep it to a single page (approx 300-400 words).
            5. **Format**: Return the text in clean Markdown format.

            DO NOT include bracketed placeholders like [Insert Date] if the information is missing. If you don't know the hiring manager's name, use "Dear Hiring Team,".
        `;

        const completion = await openai.chat.completions.create({
            model: model,
            messages: [{ role: "user", content: prompt }]
        });

        const coverLetter = completion.choices[0].message.content || "";

        return NextResponse.json({ coverLetter });

    } catch (error: any) {
        console.error("Cover Letter Generation Error:", error);
        return NextResponse.json({ error: error.message || "Failed to generate cover letter" }, { status: 500 });
    }
}
