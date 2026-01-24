import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';

export async function POST(request: NextRequest) {
    try {
        const templatesRef = collection(db, 'templates');
        const snapshot = await getDocs(templatesRef);

        const results: any[] = [];

        for (const docSnap of snapshot.docs) {
            const data = docSnap.data();

            if (data.files && Array.isArray(data.files)) {
                let needsUpdate = false;
                const updatedFiles = data.files.map((file: any) => {
                    if (file.content && typeof file.content === 'string') {
                        let content = file.content;
                        const originalContent = content;

                        // Fix: Split triple braces {{{ var }}} -> { {{ var }} }
                        content = content.replace(/\{\{\{/g, '{ {{').replace(/\}\}\}/g, '}} }');

                        // Fix 2: {{ var }}} -> {{ var }} (handle remaining extra braces)
                        content = content.replace(/(\{\{[^}]+)\}\}\}/g, '$1}}');

                        if (content !== originalContent) {
                            needsUpdate = true;
                            return { ...file, content };
                        }
                    }
                    return file;
                });

                if (needsUpdate) {
                    await updateDoc(doc(db, 'templates', docSnap.id), { files: updatedFiles });
                    results.push({
                        id: docSnap.id,
                        name: data.name,
                        status: 'fixed'
                    });
                } else {
                    results.push({
                        id: docSnap.id,
                        name: data.name,
                        status: 'ok'
                    });
                }
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Templates processed',
            results
        });
    } catch (error: any) {
        console.error('Error fixing templates:', error);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}
