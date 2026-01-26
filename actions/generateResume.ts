'use server';

import { GoogleGenerativeAI } from "@google/generative-ai";
import { UserProfile } from "@/types";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function tailorResume(userProfile: UserProfile, jobDescription: string, modelName: string = "gemini-2.5-flash", pageLength: "1" | "2" = "1"): Promise<UserProfile> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not set");
  }

  const model = genAI.getGenerativeModel({ model: modelName, generationConfig: { responseMimeType: "application/json" } });

  // Filter out hidden GitHub projects (same logic as ProfileForm)
  // We only want to show projects that are manually added (don't start with gh_)
  // OR projects that are explicitly imported (imported: true)
  const visibleProjects = (userProfile.projects || []).filter(p => !p.id.startsWith("gh_") || p.imported);

  // Create a clean profile object for the AI
  const aiInputProfile = {
    ...userProfile,
    projects: visibleProjects
  };

  const lengthConstraint = pageLength === "1"
    ? `CRITICAL - 1-PAGE AESTHETIC PRIORITY (PERFECT FIT):
         - The user wants a "Full" single-page resume, but it MUST NOT spill to page 2.
         - STRATEGY: BALANCED DENSITY.
           1. **Experience**: Select top 3-4 roles. Max 5 bullets per role. (Do not go over 5).
           2. **Projects**: STRICTLY limitation: Max 2 Projects.
           3. **Bullets**: Write 3-5 high-impact, concise bullets per role.
           4. **Skills**: Top 15-18 skills.
           5. **Summary**: 3 lines max.
         - FAIL-SAFE: If the experience is extensive, DROP the oldest role to ensure 1-page fit.`
    : `TWO PAGE "RICH & DETAILED" TARGET:
         - Target approximately 1.5 to 2 full pages of content.
         - Provide deep detail for all relevant roles (up to 6-8 bullets each).
         - Include distinctive "Project" descriptors and extensive skill lists.
         - The resume should look authoritative and comprehensive.
         - Avoid concise summarization; lean towards "thorough qualification".`;

  const prompt = `
    You are an expert Resume Writer and ATS (Applicant Tracking System) Specialist.
    
    Here is the Candidate's Master Profile:
    ${JSON.stringify(aiInputProfile)}

    Here is the Job Description (JD) they are applying for:
    ${jobDescription}

    OBJECTIVE:
    Tailor the candidate's resume to strictly match the Job Description for a 99% ATS match score, while maintaining professional integrity.
    
    ${lengthConstraint}

    CRITICAL RULES:
    1. **Keywords**: YOU MUST intelligently embed important keywords from the JD (skills, tools, methodologies) into the summary and bullet points. Use the exact wording found in the JD where applicable.
    2. **Selection**: Select ONLY the most relevant experience and skills. If a past role is irrelevant, you may condense it significantly or omit the bullets, but generally keep the timeline to show continuity. Focus 80% of the content on the roles most similar to the target job.
    3. **Impact**: Rewrite bullet points using the STAR method (Situation, Task, Action, Result) where possible. Quantify results (e.g., "Improved X by Y%", "Managed Z team size"). Use strong action verbs.
    4. **Formatting**: Output strictly PLAIN TEXT. DO NOT use markdown characters like **bold**, *italics*, or [links]. DO NOT wrap keywords in asterisks. Return clean, unformatted strings.

    TASK:
    1. **Summary**: Rewrite the "Summary" to be a powerful elevator pitch. It MUST mention the specific Role Title from the JD and the top hard skills.
    2. **Experience**: 
       - For each role in the experience array, analyze its relevance to the JD.
       - If relevant: Rewrite the description (bullets) to prominently feature JD keywords. Highlight transferrable skills. Remove fluff.
       - **IMPORTANT**: return the 'description' field as a single string containing multiple bullet points separated by newlines ("\\n"). Do NOT use bullet characters (•,-) at the start of the line, the UI handles that. Just split sentences with \\n.
       - If irrelevant: Keep it brief or focus *only* on soft skills/leadership/reliability.
       - DO NOT invent facts. Only reframe existing experience.
    3. **Skills**: 
       - Completely regenerate the skills string.
       - Curate a list of the top 15-20 skills that are a mix of the Candidate's actual skills AND the JD's requirements. 
       - Prioritize Hard Skills (Languages, Frameworks, Tools) over Soft Skills.
    4. **Education**: Keep exactly as is.
    5. **Projects**:
       - Select the 2-4 most relevant projects from the 'projects' array that demonstrate skills needed for the JD.
       - If no projects are relevant, select the most impressive technical ones.
       - Rewrite the description to be concise and impact-driven.
       - Ensure 'technologies' is a comma-separated string of the most relevant stack used.

    Output must be a valid JSON object matching the UserProfile interface:
    {
      "summary": "string",
      "experience": [ { "id": "string", "role": "string", "company": "string", "startDate": "string", "endDate": "string", "description": "string (newline separated bullets)" } ],
      "projects": [ { "id": "string", "name": "string", "description": "string", "technologies": "string", "link": "string" } ],
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
