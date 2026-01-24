"use client";

import { AlertTriangle } from "lucide-react";

export default function SentryExamplePage() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-6">
            <div className="max-w-md w-full text-center space-y-6">
                <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <AlertTriangle className="w-8 h-8 text-red-500" />
                </div>

                <h1 className="text-3xl font-bold">Sentry Verification</h1>
                <p className="text-gray-400">
                    Click the button below to intentionally throw an error.
                    If Sentry is configured correctly, this error will appear in your Sentry dashboard.
                </p>

                <button
                    className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg shadow-red-500/20"
                    onClick={() => {
                        throw new Error("Sentry Example Project Test Error");
                    }}
                >
                    Throw Test Error
                </button>
            </div>
        </div>
    );
}
