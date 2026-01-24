"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { X } from "lucide-react";

export default function CookieConsent() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Check if user has already consented
        const consented = localStorage.getItem("cookie_consent");
        if (!consented) {
            // Show banner after a short delay
            const timer = setTimeout(() => setIsVisible(true), 1000);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleAccept = () => {
        localStorage.setItem("cookie_consent", "true");
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-fade-in-up">
            <div className="max-w-4xl mx-auto glass-panel p-6 rounded-2xl border border-white/10 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 bg-black/90 backdrop-blur-xl">
                <div className="flex-1">
                    <h3 className="text-lg font-bold text-white mb-2">🍪 We use cookies</h3>
                    <p className="text-sm text-gray-400 leading-relaxed">
                        We use cookies to enhance your experience, analyze site traffic, and assist in our marketing efforts.
                        By clicking "Accept", you agree to our use of cookies.
                        Read our <Link href="/privacy" className="text-purple-400 hover:text-purple-300 underline">Privacy Policy</Link> to learn more.
                    </p>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <button
                        onClick={() => setIsVisible(false)}
                        className="p-2 text-gray-400 hover:text-white transition-colors"
                        aria-label="Close"
                    >
                        <X className="w-5 h-5" />
                    </button>
                    <button
                        onClick={handleAccept}
                        className="glass-button px-6 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap flex-1 md:flex-none justify-center"
                    >
                        Accept All
                    </button>
                </div>
            </div>
        </div>
    );
}
