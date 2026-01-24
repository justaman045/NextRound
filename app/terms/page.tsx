import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-black text-white p-8 md:p-20 font-sans">
            <div className="max-w-3xl mx-auto space-y-8">
                <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm font-medium mb-4">
                    <ArrowLeft className="w-4 h-4" /> Back to Home
                </Link>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
                    Terms of Service
                </h1>
                <p className="text-gray-400 text-sm">Last updated: {new Date().toLocaleDateString()}</p>

                <div className="prose prose-invert prose-purple max-w-none space-y-6 text-gray-300">
                    <section>
                        <h2 className="text-xl font-bold text-white mb-2">1. Acceptance of Terms</h2>
                        <p>
                            By accessing or using our NextRound ("Service"), you agree to be bound by these Terms. If you disagree with any part of the terms, you may not access the Service.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-2">2. Use License</h2>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>You are granted a temporary license to use our AI tools for personal resume creation.</li>
                            <li>You may not use the Service for any illegal or unauthorized purpose.</li>
                            <li>Free tier accounts are limited to one (1) resume generation. Creating multiple accounts to bypass this limit is a violation of these terms.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-2">3. Subscription & Payments</h2>
                        <p>
                            Premium features require a paid subscription. You will be billed in advance on a recurring basis. You may cancel your subscription at any time via the dashboard. Refunds are processed according to our specific refund policy.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-2">4. AI Content Disclaimer</h2>
                        <p>
                            Resumes are generated using Artificial Intelligence. We do not guarantee the accuracy, suitability, or success of any resume in job applications. You are responsible for reviewing and verifying all content before use.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
