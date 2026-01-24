const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testGemini() {
    try {
        const envPath = path.resolve(__dirname, '../.env.local');
        if (!fs.existsSync(envPath)) {
            console.error('.env.local file not found at', envPath);
            process.exit(1);
        }
        const envContent = fs.readFileSync(envPath, 'utf-8');
        const match = envContent.match(/GEMINI_API_KEY=(.*)/);

        if (!match) {
            console.error('GEMINI_API_KEY not found in .env.local');
            process.exit(1);
        }

        const apiKey = match[1].trim();
        console.log(`Found API Key: ${apiKey.substring(0, 5)}...`);

        const genAI = new GoogleGenerativeAI(apiKey);

        const candidateModels = [
            "gemini-3-flash",
            "gemini-2.5-flash",
            "gemini-2.0-flash-lite-preview-02-05", // Often preview models have separate quotas
            "gemini-2.0-flash-lite",
            "gemini-flash-latest",
            "gemini-1.5-flash-latest" // Just in case
        ];

        console.log("Starting model search...");

        for (const modelName of candidateModels) {
            console.log(`\nTesting ${modelName}...`);
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                const prompt = "Write a haiku about a robot.";
                const result = await model.generateContent(prompt);
                const response = await result.response;
                console.log(`✅ SUCCESS: ${modelName} works!`);
                console.log(`Response: ${response.text().substring(0, 50)}...`);
                // If success, we found our winner, no need to test others if we want to save quota
                // But let's find the *best* working one. 2.5 is better than 2.0 lite.
                // If 2.5 works, we are good.
                break;
            } catch (e) {
                console.error(`❌ FAILED: ${modelName}`);
                // Check for 404 (Not Found) or 429 (Rate Limit)
                if (e.message.includes("404")) {
                    console.log("   -> Model not found or not supported.");
                } else if (e.message.includes("429")) {
                    console.log("   -> Rate limited (Model exists but quota exceeded).");
                    if (e.message.includes("limit: 0")) {
                        console.log("   -> Quota limit is 0 (Access might be restricted).");
                    }
                } else {
                    console.log(`   -> Error: ${e.message.split('\n')[0]}`);
                }
            }
        }
    } catch (error) {
        console.error('Script Error:', error);
    }
}

testGemini();
