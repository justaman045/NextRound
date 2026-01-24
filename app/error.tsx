"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { AlertTriangle, RefreshCcw, Home, Triangle } from "lucide-react";
import Link from "next/link";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to Sentry
        Sentry.captureException(error);
    }, [error]);

    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-6 selection:bg-red-500/30">
            <div className="max-w-md w-full text-center space-y-8 animate-fade-in">
                <div className="flex justify-center">
                    <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/20 group">
                        <AlertTriangle className="w-8 h-8 text-red-500" />
                    </div>
                </div>

                <div className="space-y-2">
                    <h2 className="text-3xl font-bold">Something went wrong</h2>
                    <p className="text-gray-400">
                        We've encountered an unexpected round. Our engineers (and AI) have been notified.
                    </p>
                    {error.digest && (
                        <p className="text-[10px] text-gray-600 font-mono mt-2">
                            ID: {error.digest}
                        </p>
                    )}
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                    <button
                        onClick={() => reset()}
                        className="flex-1 bg-white text-black px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-gray-200 transition-all"
                    >
                        <RefreshCcw className="w-5 h-5" />
                        Try Again
                    </button>
                    <Link
                        href="/"
                        className="flex-1 bg-white/5 hover:bg-white/10 text-white border border-white/10 px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all"
                    >
                        <Home className="w-5 h-5" />
                        Back to Safety
                    </Link>
                </div>

                <div className="flex items-center justify-center gap-2 opacity-30 pt-8">
                    <Triangle className="w-3 h-3 text-white fill-current" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em]">NextRound Stability</span>
                </div>
            </div>
        </div>
    );
}
