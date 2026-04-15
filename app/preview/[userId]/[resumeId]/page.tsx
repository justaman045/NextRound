import { adminDb } from "@/lib/firebaseAdmin";
import { notFound } from "next/navigation";
import { TEMPLATE_MAP } from "@/components/dashboard/ResumeStudio";
import { UserResume } from "@/types";

interface PreviewPageProps {
    params: Promise<{
        userId: string;
        resumeId: string;
    }>;
}

export default async function ResumePreviewPage({ params }: PreviewPageProps) {
    const { userId, resumeId } = await params;

    // Fetch resume from Firestore using Admin SDK
    const resumeDoc = await adminDb.collection('users').doc(userId).collection('resumes').doc(resumeId).get();

    if (!resumeDoc.exists) {
        return notFound();
    }

    const resume = { id: resumeDoc.id, ...resumeDoc.data() } as UserResume;
    
    if (!resume.data || !resume.templateId) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center text-gray-500">
                Incomplete resume data
            </div>
        );
    }

    const SelectedTemplate = TEMPLATE_MAP[resume.templateId as keyof typeof TEMPLATE_MAP] || TEMPLATE_MAP.modern;

    return (
        <div className="bg-white min-h-screen">
            {/* 
                Scale to 100% and force white background. 
                This page is specifically for Puppeteer. 
            */}
            <SelectedTemplate data={resume.data} />
            
            <style jsx global>{`
                body {
                    margin: 0;
                    padding: 0;
                    background: white;
                }
                @page {
                    size: auto;
                    margin: 0;
                }
            `}</style>
        </div>
    );
}
