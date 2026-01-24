"use client";

import { getSystemConfig } from "@/lib/firestore";
import { useEffect, useState } from "react";
import { Plus, Minus, ArrowRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import WaitlistForm from "@/components/WaitlistForm";

const faqs = [
    {
        question: "Is it really free?",
        answer: "Yes! You can create your first tailored resume completely for free to see how powerful our AI is. After that, you can upgrade to Pro for unlimited generations."
    },
    {
        question: "How does the AI tailoring work?",
        answer: "We use Google's advanced Gemini 1.5 Flash model to analyze your Master Profile and the Job Description. It identifies keywords and rewrites your experience bullet points to highlight the most relevant skills for that specific role."
    },
    {
        question: "Can I download the resume as PDF?",
        answer: "Absolutely. Once the AI generates your resume, you can preview it and download a clean, ATS-friendly PDF with a single click."
    },
    {
        question: "Do you sell my data?",
        answer: "Never. Your profile data is stored securely in your own Firebase account. We are not a recruitment agency and we do not share your personal information with third parties."
    }
];

export default function FAQ() {
    const { signInWithGoogle } = useAuth();
    const [openIndex, setOpenIndex] = useState<number | null>(0);
    const [systemMode, setSystemMode] = useState<"development" | "production">("production");

    useEffect(() => {
        const fetchConfig = async () => {
            const config = await getSystemConfig();
            if (config?.mode) setSystemMode(config.mode);
        };
        fetchConfig();
    }, []);

    return (
        <section className="py-24 px-6 max-w-4xl mx-auto">
            <div className="text-center mb-16 animate-fade-in-up">
                <h2 className="text-4xl font-bold mb-4">Frequently Asked Questions</h2>
                <p className="text-gray-400">Everything you need to know about NextRound.</p>
            </div>

            <div className="space-y-4 mb-24">
                {faqs.map((faq, idx) => (
                    <div
                        key={idx}
                        className="border border-white/10 rounded-2xl bg-white/5 overflow-hidden transition-all duration-200"
                    >
                        <button
                            onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                            className="w-full flex items-center justify-between p-6 text-left hover:bg-white/5 transition-colors"
                        >
                            <span className="text-lg font-medium text-gray-200">{faq.question}</span>
                            {openIndex === idx ? (
                                <Minus className="w-5 h-5 text-gray-400" />
                            ) : (
                                <Plus className="w-5 h-5 text-gray-400" />
                            )}
                        </button>

                        {openIndex === idx && (
                            <div className="px-6 pb-6 text-gray-400 leading-relaxed border-t border-white/5 pt-4">
                                {faq.answer}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Final CTA */}
            <div className="text-center bg-gradient-to-br from-purple-900/30 to-blue-900/30 border border-white/10 p-12 rounded-3xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-grid-white/[0.02] pointer-events-none" />
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-purple-500/20 rounded-full blur-[80px]" />

                <div className="relative z-10">
                    <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white text-center">
                        Ready to land your dream job?
                    </h2>
                    <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                        Join thousands of candidates who are getting more interviews with tailored resumes.
                    </p>
                    {systemMode === "production" ? (
                        <button
                            onClick={signInWithGoogle}
                            className="px-8 py-4 bg-white text-black rounded-full font-bold text-lg hover:bg-gray-200 transition-all transform hover:-translate-y-1 shadow-xl inline-flex items-center gap-2"
                        >
                            Build Your Resume Now <ArrowRight className="w-5 h-5" />
                        </button>
                    ) : (
                        <div className="max-w-md mx-auto">
                            <WaitlistForm />
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
