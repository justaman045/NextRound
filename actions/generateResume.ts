'use server';

import { GoogleGenerativeAI } from "@google/generative-ai";
import { UserProfile } from "@/types";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function tailorResume(userProfile: UserProfile, jobDescription: string, modelName: string = "gemini-2.5-flash"): Promise<UserProfile> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not set");
  }

  const model = genAI.getGenerativeModel({ model: modelName, generationConfig: { responseMimeType: "application/json" } });

  const prompt = `
    You are an expert Resume Writer and ATS (Applicant Tracking System) Specialist.
    
    Here is the Candidate's Master Profile:
    ${JSON.stringify(userProfile)}

    Here is the Job Description (JD) they are applying for:
    ${jobDescription}

    OBJECTIVE:
    Tailor the candidate's resume to strictly match the Job Description for a 99% ATS match score, while maintaining professional integrity.

    CRITICAL RULES:
    1. **Keywords**: YOU MUST intelligently embed important keywords from the JD (skills, tools, methodologies) into the summary and bullet points. Use the exact wording found in the JD where applicable.
    2. **Selection**: Select ONLY the most relevant experience and skills. If a past role is irrelevant, you may condense it significantly or omit the bullets, but generally keep the timeline to show continuity. Focus 80% of the content on the roles most similar to the target job.
    3. **Impact**: Rewrite bullet points using the STAR method (Situation, Task, Action, Result) where possible. Quantify results (e.g., "Improved X by Y%", "Managed Z team size"). Use strong action verbs.
    4. **Formatting**: Ensure the output text is clean, professional, and free of markdown symbols within the JSON values (the templating engine handles the preview).

    TASK:
    1. **Summary**: Rewrite the "Summary" to be a powerful 3-4 sentence elevator pitch. It MUST mention the specific Role Title from the JD and the top 3 hard skills required.
    2. **Experience**: 
       - For each role in the experience array, analyze its relevance to the JD.
       - If relevant: Rewrite the description (bullets) to prominently feature JD keywords. Highlight transferrable skills. Remove fluff.
       - If irrelevant: Keep it brief or focus *only* on soft skills/leadership/reliability.
       - DO NOT invent facts. Only reframe existing experience.
    3. **Skills**: 
       - Completely regenerate the skills string.
       - Curate a list of the top 15-20 skills that are a mix of the Candidate's actual skills AND the JD's requirements. 
       - Prioritize Hard Skills (Languages, Frameworks, Tools) over Soft Skills.
    4. **Education**: Keep exactly as is.

    Output must be a valid JSON object matching the UserProfile interface:
    {
      "summary": "string",
      "experience": [ { "id": "string", "role": "string", "company": "string", "startDate": "string", "endDate": "string", "description": "string" } ],
      "education": [ ... ],
      "skills": "string"
    }

    Return ONLY the JSON.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    return JSON.parse(text) as UserProfile;
  } catch (error: any) {
    console.error("Error generating resume:", error);
    throw new Error(`Failed to generate resume: ${error.message || "Unknown error"}`);
  }
}
