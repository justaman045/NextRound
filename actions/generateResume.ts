'use server';

import OpenAI from "openai";
import { UserProfile } from "@/types";

const openai = new OpenAI({ baseURL: "https://openrouter.ai/api/v1", apiKey: process.env.OPENROUTER_API_KEY || process.env.GEMINI_API_KEY || "" });

export async function tailorResume(userProfile: UserProfile, jobDescription: string, modelName: string = "openrouter/free", pageLength: "1" | "2" | "auto" = "auto"): Promise<{ data: UserProfile, score: number, analysis: string, pageCount?: "1" | "2" }> {
  if (!process.env.OPENROUTER_API_KEY && !process.env.GEMINI_API_KEY) {
    throw new Error("OPENROUTER_API_KEY is not set");
  }

  const visibleProjects = (userProfile.projects || []).filter(p => !p.id.startsWith("gh_") || p.imported);

  const aiInputProfile = {
    ...userProfile,
    projects: visibleProjects
  };

  // Auto-calculate Years of Experience to determine proper resume length
  let earliestYear = new Date().getFullYear();
  let latestYear = new Date().getFullYear();
  
  if (userProfile.experience && userProfile.experience.length > 0) {
      userProfile.experience.forEach(exp => {
          const start = new Date(exp.startDate).getFullYear();
          const end = exp.endDate && exp.endDate.toLowerCase() !== "present" ? new Date(exp.endDate).getFullYear() : new Date().getFullYear();
          if (!isNaN(start) && start > 1950 && start < earliestYear) earliestYear = start;
          if (!isNaN(end) && end > 1950 && end > latestYear) latestYear = end;
      });
  }
  
  const estimatedYOE = latestYear - earliestYear;
  
  // Decide effective length: 
  // If user explicitly requests 1 or 2, grant it.
  // If Auto, default to 1, but intelligently bump to 2 if they have 4+ years of experience!
  let effectivePageLength: "1" | "2" = "1";
  if (pageLength === "2") {
      effectivePageLength = "2";
  } else if (pageLength === "auto" && estimatedYOE >= 4) {
      effectivePageLength = "2";
  } else if (pageLength === "1") {
      effectivePageLength = "1";
  }

  const lengthConstraint = effectivePageLength === "1"
    ? `CRITICAL - 1-PAGE AESTHETIC PRIORITY:
         - The user has ${estimatedYOE} YOE. Fit content elegantly on a single page.
         - STRATEGY: BALANCED DENSITY.
           1. **Experience**: Keep only most relevant roles. Max 4 bullets per role. Drop oldest irrelevant roles if necessary.
           2. **Projects**: STRICTLY MUST INCLUDE 1-2 projects. DO NOT omit the projects section.
           3. **Education**: DO NOT omit.
           4. **Skills**: Top 15 skills.
           5. **Summary**: 3 lines max.
         - NEVER omit core structural sections (Projects, Education) entirely.`
    : `CRITICAL - 2-PAGE COMPREHENSIVE EXPANSION REQUIRED:
         - The user explicitly requires a comprehensive, highly detailed 2-PAGE resume.
         - You MUST break down their experience into highly granular, highly detailed bullet points to expand the length.
         - **Experience**: Provide 6 to 8 long, dense bullet points (STAR method) per role.
         - **Projects**: Include EVERY project. Expand project descriptions into 2-3 detailed sentences each.
         - **Skills**: Explode the skills section into a massive array of relevant technologies.
         - DO NOT simply summarize. Your goal is to maximize granular technical descriptions so the render naturally flows to a second page.`;

  const prompt = `
    You are an expert Resume Writer and ATS (Applicant Tracking System) Specialist.
    
    Here is the Candidate's Master Profile:
    ${JSON.stringify(aiInputProfile)}

    Here is the Job Description (JD) they are applying for:
    ${jobDescription}

    OBJECTIVE:
    Tailor the candidate's resume to strictly match the Job Description. Maximize the ATS match score by using relevant keywords, but prioritize professional integrity and readability.
    
    ${lengthConstraint}

    CRITICAL RULES:
    1. **Keywords**: YOU MUST intelligently embed important keywords from the JD (skills, tools, methodologies) into the summary and bullet points. Use the exact wording found in the JD where applicable.
    2. **Selection**: Select ONLY the most relevant experience and skills. Focus 80% of the content on roles similar to the target job.
    3. **Impact**: Rewrite bullet points using the STAR method (Situation, Task, Action, Result) where possible. Quantify results.
    4. **Formatting**: Output strictly PLAIN TEXT. DO NOT use markdown characters like **bold**, *italics*, or [links].
    5. **Scoring**: You must calculate an honest, objective ATS match score (0-100) for the *final optimized resume* against the JD. 
       - 90-100: Perfect match, all critical keywords present.
       - 80-89: Strong match, missing minor keywords.
       - <80: Good match, but experience gaps exist.
       - DO NOT inflate the score. If the candidate lacks core requirements, give a realistic lower score.

    TASK:
    1. **Summary**: Rewrite the "Summary" to be a powerful elevator pitch. It MUST mention the specific Role Title from the JD and the top hard skills.
    2. **Experience**: 
       - For each role in the experience array, analyze its relevance to the JD.
       - If relevant: Rewrite the description (bullets) to prominently feature JD keywords. Highlight transferrable skills. Remove fluff.
       - **IMPORTANT**: return the 'description' field as a single string containing multiple bullet points separated by newlines ("\\n"). Do NOT use bullet characters (•,-) at the start of the line, the UI handles that. Just split sentences with \\n.
       - If irrelevant: Keep it brief or focus *only* on soft skills/leadership/reliability.
       - DO NOT invent facts. Only reframe existing experience.
    3. **Skills**: 
       - Completely regenerate the skills list.
       - Curate a list of the top 15-20 skills that are a mix of the Candidate's actual skills AND the JD's requirements. 
       - YOU MUST categorize the skills using the exact format:
         Category Name: Skill 1, Skill 2, Skill 3
         Category Name 2: Skill 1, Skill 2
       - Example:
         Languages: Java, Python, JavaScript
         Frameworks: React, Django
         Tools: Git, Docker, Selenium
       - Separate each category strictly with a newline character.
    4. **Education**: Keep exactly as is.
    5. **Projects**:
       - Select the 2-4 most relevant projects from the 'projects' array that demonstrate skills needed for the JD.
       - If no projects are relevant, select the most impressive technical ones.
       - Rewrite the description to be concise and impact-driven.
       - Ensure 'technologies' is a comma-separated string of the most relevant stack used.

    Output must be a valid JSON object with the following structure:
    {
      "data": {
          "summary": "string",
          "experience": [ { "id": "string", "role": "string", "company": "string", "startDate": "string", "endDate": "string", "description": "string (newline separated bullets)" } ],
          "projects": [ { "id": "string", "name": "string", "description": "string", "technologies": "string", "link": "string" } ],
          "education": [ ... ],
          "skills": "string"
      },
      "score": number, // 0-100 match score based on keyword coverage and role relevance
      "analysis": "string" // A 1-sentence explanation of the score
    }

    Return ONLY the JSON.
  `;

    let text = "";
    try {
      const completion = await openai.chat.completions.create({
        model: modelName,
        max_tokens: 4000,
        response_format: { type: "json_object" },
        messages: [{ role: "user", content: prompt }]
      });
      text = completion.choices[0].message.content || "{}";
    } catch (error: any) {
      console.warn(`Model ${modelName} failed, falling back to openrouter/free. Error: ${error.message}`);
      try {
        const fallbackCompletion = await openai.chat.completions.create({
          model: "openrouter/free",
          max_tokens: 4000,
          response_format: { type: "json_object" },
          messages: [{ role: "user", content: prompt }]
        });
        text = fallbackCompletion.choices[0].message.content || "{}";
      } catch (fallbackError: any) {
        console.error("Error generating resume with fallback:", fallbackError);
        throw new Error(`Failed to generate resume: ${fallbackError.message || "Unknown error"}`);
      }
    }
    
    // Clean potential markdown markdown wrapping common with Gemma/Llama responses
    let jsonString = text;
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      jsonString = jsonMatch[1];
    }
    let json;
    try {
        json = JSON.parse(jsonString);
    } catch (parseError: any) {
        console.error("Initial JSON parse failed. Attempting cleanup...", parseError.message);
        try {
            // Attempt to fix common LLM JSON syntax errors (trailing commas, control characters)
            let cleanedString = jsonString
                .replace(/,\s*([}\]])/g, '$1') // remove trailing commas
                .replace(/[\u0000-\u001F]+/g, ' '); // remove unescaped control characters

            json = JSON.parse(cleanedString);
        } catch (secondError) {
            console.error("Failed to parse LLM JSON completely. Raw string:", jsonString);
            throw new Error("The AI model generated invalid text formatting. Please click 'Generate Resume' again to retry.");
        }
    }

    // Normalize response if AI messes up nesting (fallback)
    if (json.summary && !json.data) {
      return {
        data: json as UserProfile,
        score: json.score || 75, // Fallback if AI fails to generate score structure
        analysis: json.analysis || "Score generated based on keyword matching.",
        pageCount: effectivePageLength as "1" | "2"
      };
    }

    return {
      data: json.data as UserProfile,
      score: json.score || 70,
      analysis: json.analysis || "Generated by AI.",
      pageCount: effectivePageLength as "1" | "2"
    };
}
