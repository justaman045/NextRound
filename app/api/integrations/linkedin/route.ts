import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }

        // 1. Read PDF as Base64 (Gemini Native Input)
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64Data = buffer.toString("base64");

        // 2. AI Parsing with Gemini
        // We instruct it to return strictly a JSON snippet matching our UserProfile structure
        const model = genAI.getGenerativeModel({ model: "gemma-3-12b-it" });

        const prompt = `
            You are a Data Extraction Specialist. 
            I will provide you with a LinkedIn Profile PDF.
            Your task is to extract relevant data and structure it into a JSON object that matches our application's data schema.

            **Schema Structure:**
            {
                "fullName": string,
                "email": string (if found, else ""),
                "phone": string (if found, else ""),
                "location": string (if found, else ""),
                "website": string (if found, else ""),
                "summary": string,
                "skills": string (comma separated list),
                "experience": [
                    {
                        "id": "exp_" + random_string,
                        "role": string (Job Title),
                        "company": string,
                        "startDate": string (Format: YYYY-MM or 'Present'),
                        "endDate": string (Format: YYYY-MM or 'Present'),
                        "description": string (bullet points, be detailed)
                     }
                ],
                "education": [
                    {
                        "id": "edu_" + random_string,
                        "degree": string,
                        "school": string,
                        "year": string (e.g. "2018 - 2022")
                    }
                ],
                "projects": [
                    {
                        "id": "proj_" + random_string,
                        "name": string,
                        "description": string,
                        "technologies": string,
                        "link": string (optional),
                        "imported": true
                    }
                ]
            }

            **Instructions:**
            1. Extract the Full Name from the top.
            2. Extract Contact Info if available.
            3. Extract the "Summary" or "About" section.
            4. Extract "Experience". For description, try to keep it detailed. Convert dates to YYYY-MM format if possible.
            5. Extract "Education".
            6. Extract "Skills" into a comma-separated string.
            7. If "Projects" section exists, extract it. If not, check description for project mentions.
            8. **IMPORTANT**: Return ONLY the JSON object. Do not include markdown formatting like \`\`\`json.
        `;

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: base64Data,
                    mimeType: "application/pdf",
                },
            },
        ]);

        const response = await result.response;
        const jsonString = response.text().replace(/```json/g, '').replace(/```/g, '').trim();

        let extractedData;
        try {
            extractedData = JSON.parse(jsonString);
        } catch (e) {
            console.error("Failed to parse AI JSON:", jsonString);
            return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
        }

        return NextResponse.json({ success: true, data: extractedData });

    } catch (error: any) {
        console.error("LinkedIn Parse Error:", error);
        return NextResponse.json({ error: error.message || "Unknown error" }, { status: 500 });
    }
}
