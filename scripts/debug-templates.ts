import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import * as fs from 'fs';

// Parse .env.local manually
const envContent = fs.readFileSync('.env.local', 'utf-8');
const envVars: Record<string, string> = {};
envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
        envVars[match[1].trim()] = match[2].trim();
    }
});

const firebaseConfig = {
    apiKey: envVars.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: envVars.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: envVars.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: envVars.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: envVars.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: envVars.NEXT_PUBLIC_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function debugTemplates() {
    const templatesRef = collection(db, 'templates');
    const snapshot = await getDocs(templatesRef);

    console.log(`Found ${snapshot.docs.length} templates\n`);

    snapshot.docs.forEach(doc => {
        const data = doc.data();
        console.log(`\n=== Template: ${doc.id} ===`);
        console.log(`Name: ${data.name}`);
        console.log(`Type: ${data.type}`);
        console.log(`Active: ${data.isActive}`);

        if (data.files && Array.isArray(data.files)) {
            console.log(`\nFiles (${data.files.length}):`);
            data.files.forEach((file: any, idx: number) => {
                console.log(`\n--- File ${idx + 1}: ${file.path} ---`);
                if (file.content) {
                    const lines = file.content.split('\n');
                    console.log(`Total lines: ${lines.length}`);

                    // Show lines around 169 if it exists
                    if (lines.length >= 169) {
                        console.log('\nLines 165-173:');
                        for (let i = 164; i < Math.min(173, lines.length); i++) {
                            console.log(`${i + 1}: ${lines[i]}`);
                        }
                    }
                }
            });
        }
    });
}

debugTemplates().catch(console.error);
