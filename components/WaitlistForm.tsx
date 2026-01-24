"use client";

import { useState } from "react";
import { saveWaitlistEmail } from "@/lib/firestore";
import { Loader2, Send, CheckCircle } from "lucide-react";

export default function WaitlistForm() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !email.includes("@")) {
            alert("Please enter a valid email.");
            return;
        }

        setLoading(true);
        try {
            await saveWaitlistEmail(email);
            setSuccess(true);
            setEmail("");
        } catch (error) {
            console.error("Error saving email:", error);
            alert("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="glass-panel p-6 rounded-2xl flex items-center gap-4 animate-fade-in-up border-emerald-500/30 bg-emerald-900/10">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                    <CheckCircle className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-white">You're on the list!</h3>
                    <p className="text-emerald-200/80 text-sm">We'll notify you when we launch new features.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-md mx-auto">
            <form onSubmit={handleSubmit} className="relative">
                <input
                    type="email"
                    placeholder="Enter your email for early access..."
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-6 pr-32 py-4 rounded-full bg-white/10 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all backdrop-blur-sm"
                />
                <button
                    type="submit"
                    disabled={loading}
                    className="absolute right-2 top-2 bottom-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 rounded-full hover:shadow-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
                >
                    {loading ? <Loader2 className="animate-spin w-4 h-4" /> : <><span className="hidden sm:inline">Join</span> <Send className="w-4 h-4" /></>}
                </button>
            </form>
            <p className="text-center text-xs text-gray-500 mt-4">
                Join 2,000+ others on the waitlist. Unsubscribe anytime.
            </p>
        </div>
    );
}
