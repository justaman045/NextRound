import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';
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

async function fixTemplates() {
    const templatesRef = collection(db, 'templates');
    const snapshot = await getDocs(templatesRef);

    console.log(`Found ${snapshot.docs.length} templates\n`);

    for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        console.log(`\nChecking template: ${docSnap.id} (${data.name})`);

        if (data.files && Array.isArray(data.files)) {
            let needsUpdate = false;
            const updatedFiles = data.files.map((file: any) => {
                if (file.content && typeof file.content === 'string') {
                    let content = file.content;
                    const originalContent = content;

                    // Fix: {{ var }}} -> {{ var }}
                    content = content.replace(/(\{\{[^}]+)\}\}\}/g, '$1}}');

                    if (content !== originalContent) {
                        console.log(`  ✓ Fixed ${file.path}`);
                        const matches = originalContent.match(/(\{\{[^}]+)\}\}\}/g);
                        if (matches) {
                            console.log(`    Found ${matches.length} instances of triple closing braces`);
                            matches.slice(0, 3).forEach((m: string) => console.log(`      - ${m}`));
                        }
                        needsUpdate = true;
                        return { ...file, content };
                    }
                }
                return file;
            });

            if (needsUpdate) {
                console.log(`  → Updating Firestore...`);
                await updateDoc(doc(db, 'templates', docSnap.id), { files: updatedFiles });
                console.log(`  ✓ Updated successfully`);
            } else {
                console.log(`  ✓ No issues found`);
            }
        }
    }

    console.log('\n✓ All templates processed');
}

fixTemplates().catch(console.error);
