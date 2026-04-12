const fs = require('fs');
const path = require('path');
const OpenAI = require('openai').default;

async function testOpenRouter() {
    try {
        const envPath = path.resolve(__dirname, '../.env.local');
        if (!fs.existsSync(envPath)) {
            console.error('.env.local file not found at', envPath);
            process.exit(1);
        }
        const envContent = fs.readFileSync(envPath, 'utf-8');
        const match = envContent.match(/OPENROUTER_API_KEY=(.*)/) || envContent.match(/GEMINI_API_KEY=(.*)/);

        if (!match) {
            console.error('OPENROUTER_API_KEY not found in .env.local');
            process.exit(1);
        }

        const apiKey = match[1].trim();
        console.log(`Found API Key: ${apiKey.substring(0, 5)}...`);

        const openai = new OpenAI({ baseURL: "https://openrouter.ai/api/v1", apiKey: apiKey });

        const candidateModels = [
            "google/gemma-3-12b-it:free",
            "meta-llama/llama-3.3-70b-instruct:free",
            "qwen/qwen-2.5-coder-32b-instruct:free"
        ];

        console.log("Starting model search...");

        for (const modelName of candidateModels) {
            console.log(`\nTesting ${modelName}...`);
            try {
                const completion = await openai.chat.completions.create({
                    model: modelName,
                    messages: [{ role: "user", content: "Write a haiku about a robot." }]
                });
                
                console.log(`✅ SUCCESS: ${modelName} works!`);
                console.log(`Response: ${completion.choices[0].message.content.substring(0, 50)}...`);
                // If success, we found our winner, no need to test others if we want to save quota
                break;
            } catch (e) {
                console.error(`❌ FAILED: ${modelName}`);
                // Check for 404 (Not Found) or 429 (Rate Limit)
                if (e.message.includes("404")) {
                    console.log("   -> Model not found or not supported.");
                } else if (e.message.includes("429")) {
                    console.log("   -> Rate limited (Model exists but quota exceeded).");
                } else {
                    console.log(`   -> Error: ${e.message.split('\n')[0]}`);
                }
            }
        }
    } catch (error) {
        console.error('Script Error:', error);
    }
}

testOpenRouter();
