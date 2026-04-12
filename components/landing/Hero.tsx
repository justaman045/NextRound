"use client";

import { useAuth } from "@/context/AuthContext";
import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import WaitlistForm from "@/components/WaitlistForm";

import { getSystemConfig } from "@/lib/firestore";
import { useEffect, useState } from "react";
import { getLargestFreeModel } from "@/actions/openrouter";

export default function Hero() {
    const { user, signInWithGoogle } = useAuth();
    const router = useRouter();
    const [systemMode, setSystemMode] = useState<"development" | "production">("production");
    const [modelName, setModelName] = useState<string>("Loading Models...");

    useEffect(() => {
        const fetchConfig = async () => {
            const config = await getSystemConfig();
            if (config?.mode) setSystemMode(config.mode);
        };
        fetchConfig();

        const fetchModel = async () => {
            const largest = await getLargestFreeModel();
            setModelName(largest);
        };
        fetchModel();
    }, []);

    // We update this via state natively now

    return (
        <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
            {/* Lamp Effect Background */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] z-0 pointer-events-none">
                <div className="absolute top-[-150px] left-1/2 -translate-x-1/2 w-[600px] md:w-[1000px] h-[400px] bg-purple-600/30 rounded-[100%] blur-[80px] opacity-50" />
                <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[800px] md:w-[1200px] h-[400px] bg-blue-600/20 rounded-[100%] blur-[100px] opacity-40" />
            </div>

            <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8 animate-fade-in-up backdrop-blur-md">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span className="text-sm font-medium text-gray-200">Powered by {modelName}</span>
                </div>

                {/* Headline */}
                <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight mb-8 leading-[1.1] animate-fade-in-up delay-100">
                    Craft the Perfect Resume <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-br from-white via-gray-200 to-gray-500">
                        For Every Single Job.
                    </span>
                </h1>
                <p className="max-w-2xl mx-auto text-lg md:text-xl text-gray-400 mb-12 leading-relaxed animate-fade-in-up delay-200">
                    Stop sending generic applications. Our AI analyzes the Job Description and rewrites your resume&apos;s bullet points to match the keywords perfectly.
                </p>

                {/* CTA Buttons - Hidden in Development Mode */}
                {
                    systemMode === "production" ? (
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up delay-300 mb-16">
                            {!user ? (
                                <button
                                    onClick={signInWithGoogle}
                                    className="w-full sm:w-auto px-8 py-4 bg-white text-black rounded-full font-bold text-lg hover:bg-gray-200 transition-all transform hover:-translate-y-1 shadow-[0_0_20px_-5px_rgba(255,255,255,0.3)]"
                                >
                                    Start for Free
                                </button>
                            ) : (
                                <button
                                    onClick={() => router.push("/profile")}
                                    className="w-full sm:w-auto px-8 py-4 bg-white text-black rounded-full font-bold text-lg hover:bg-gray-200 transition-all transform hover:-translate-y-1 shadow-[0_0_20px_-5px_rgba(255,255,255,0.3)] inline-flex items-center justify-center gap-2"
                                >
                                    Dashboard <ArrowRight className="w-5 h-5" />
                                </button>
                            )}

                            <a href="#pricing" className="w-full sm:w-auto px-8 py-4 glass-panel rounded-full font-bold text-lg hover:bg-white/5 transition-all flex items-center justify-center gap-2 group">
                                <span className="text-gray-300 group-hover:text-white transition-colors">View Pricing</span>
                            </a>
                        </div>
                    ) : (
                        <div className="mb-12">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-500/10 border border-yellow-500/20 mb-8 animate-fade-in-up backdrop-blur-md">
                                <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                                <span className="text-sm font-medium text-yellow-200">Early Access Only</span>
                            </div>
                        </div>
                    )
                }

                {/* Waitlist */}
                {
                    (!user || systemMode === "development") && (
                        <div className="animate-fade-in-up delay-500 max-w-md mx-auto">
                            <div className="flex items-center gap-4 mb-6 opacity-30">
                                <div className="h-px bg-white/50 flex-1" />
                                <span className="text-xs uppercase tracking-widest font-bold">Or</span>
                                <div className="h-px bg-white/50 flex-1" />
                            </div>
                            <WaitlistForm />
                        </div>
                    )
                }
            </div >
        </section >
    );
}
