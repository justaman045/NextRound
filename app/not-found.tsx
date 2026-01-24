"use client";

import Link from "next/link";
import { MoveLeft, Home, Triangle } from "lucide-react";
import { useState, useEffect } from "react";

export default function NotFound() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleBack = () => {
        if (typeof window !== "undefined") {
            window.history.back();
        }
    };

    if (!mounted) {
        return <div className="min-h-screen bg-black" />; // Blank shell for server/prerender
    }

    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-6 selection:bg-purple-500/30">
            <div className="max-w-md w-full text-center space-y-8 animate-fade-in">
                <div className="flex justify-center">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-2xl shadow-white/10 group">
                        <Triangle className="w-8 h-8 text-black fill-current group-hover:scale-110 transition-transform duration-500" />
                    </div>
                </div>

                <div className="space-y-2">
                    <h1 className="text-8xl font-black bg-gradient-to-b from-white to-gray-500 bg-clip-text text-transparent opacity-20">
                        404
                    </h1>
                    <h2 className="text-3xl font-bold">Lost in the Rounds?</h2>
                    <p className="text-gray-400">
                        The page you're looking for doesn't exist or has been moved to a different round.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                    <Link
                        href="/"
                        className="flex-1 glass-button px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 group border border-white/10"
                    >
                        <Home className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" />
                        Go Home
                    </Link>
                    <button
                        onClick={handleBack}
                        className="flex-1 bg-white/5 hover:bg-white/10 text-white border border-white/10 px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all"
                    >
                        <MoveLeft className="w-5 h-5" />
                        Go Back
                    </button>
                </div>

                <p className="text-xs text-gray-600 pt-8 uppercase tracking-widest font-bold">
                    NextRound &copy; {new Date().getFullYear()}
                </p>
            </div>
        </div>
    );
}
