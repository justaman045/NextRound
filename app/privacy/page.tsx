import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-black text-white p-8 md:p-20 font-sans">
            <div className="max-w-3xl mx-auto space-y-8">
                <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm font-medium mb-4">
                    <ArrowLeft className="w-4 h-4" /> Back to Home
                </Link>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-teal-400 bg-clip-text text-transparent">
                    Privacy Policy
                </h1>
                <p className="text-gray-400 text-sm">Last updated: {new Date().toLocaleDateString()}</p>

                <div className="prose prose-invert prose-blue max-w-none space-y-6 text-gray-300">
                    <section>
                        <h2 className="text-xl font-bold text-white mb-2">1. Information We Collect</h2>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>Account Data:</strong> Name, email address, and authentication tokens (via Firebase).</li>
                            <li><strong>Profile Data:</strong> Resume content, job history, skills, and uploaded documents you provide for tailoring.</li>
                            <li><strong>Usage Data:</strong> How you interact with our AI tools and dashboard.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-2">2. How We Use Your Data</h2>
                        <p>
                            We use your data solely to:
                        </p>
                        <ul className="list-disc pl-5 space-y-2 mt-2">
                            <li>Provide and maintain the Service.</li>
                            <li>Process your resume content through AI models (e.g., Gemini) to generate tailored output. <strong>We do not use your data to train our own AI models.</strong></li>
                            <li>Process payments via our secure provider (Razorpay).</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-2">3. Data Security</h2>
                        <p>
                            We implement industry-standard security measures to protect your personal information. However, no method of transmission over the Internet is 100% secure.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-2">4. Your Rights (GDPR/CCPA)</h2>
                        <p>
                            You have the right to access, update, or delete your data at any time. You can delete your account permanently via the "Danger Zone" in your profile settings.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
