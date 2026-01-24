import { Check, X, Sparkles } from "lucide-react";
import Link from "next/link";

export default function Pricing() {
    return (
        <section className="py-20 px-6 max-w-7xl mx-auto" id="pricing">
            <div className="text-center mb-16 animate-fade-in-up">
                <h2 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h2>
                <p className="text-gray-400 max-w-2xl mx-auto">
                    Start for free to see the magic. Upgrade to unlock unlimited power.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">

                {/* Free Tier */}
                <div className="p-6 rounded-3xl border border-white/5 bg-white/5 hover:bg-white/10 transition-all flex flex-col animate-fade-in-up delay-100 relative overflow-hidden group">
                    <div className="mb-6">
                        <h3 className="text-lg font-bold text-gray-200 mb-2">Free Tier</h3>
                        <div className="text-3xl font-bold text-white mb-2">$0</div>
                        <p className="text-gray-400 text-xs">Forever free.</p>
                    </div>

                    <ul className="space-y-3 mb-6 flex-1 text-sm">
                        <li className="flex items-center gap-3 text-gray-300">
                            <Check className="w-4 h-4 text-gray-500" /> 1 AI Resume Limit
                        </li>
                        <li className="flex items-center gap-3 text-gray-300">
                            <Check className="w-4 h-4 text-gray-500" /> Basic Template
                        </li>
                        <li className="flex items-center gap-3 text-gray-300">
                            <Check className="w-4 h-4 text-gray-500" /> PDF Export
                        </li>
                    </ul>

                    <Link
                        href="/profile"
                        className="w-full py-3 rounded-xl border border-white/10 bg-transparent hover:bg-white/5 text-white font-bold transition-all text-center text-sm"
                    >
                        Get Started
                    </Link>
                </div>

                {/* Pro Monthly */}
                <div className="p-6 rounded-3xl border border-purple-500/30 bg-purple-900/10 hover:bg-purple-900/20 transition-all flex flex-col animate-fade-in-up delay-200 relative overflow-hidden group">
                    <div className="mb-6">
                        <h3 className="text-lg font-bold text-white mb-2">Pro Monthly</h3>
                        <div className="text-3xl font-bold text-white mb-2">$9<span className="text-sm font-normal text-gray-400">/mo</span></div>
                        <p className="text-gray-400 text-xs">Cancel anytime.</p>
                    </div>

                    <ul className="space-y-3 mb-6 flex-1 text-sm">
                        <li className="flex items-center gap-3 text-white">
                            <Check className="w-4 h-4 text-purple-400" /> Unlimited AI Resumes
                        </li>
                        <li className="flex items-center gap-3 text-white">
                            <Check className="w-4 h-4 text-purple-400" /> All Premium Templates
                        </li>
                        <li className="flex items-center gap-3 text-white">
                            <Check className="w-4 h-4 text-purple-400" /> Advanced AI Actions
                        </li>
                    </ul>

                    <button className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition-all text-sm shadow-lg shadow-purple-900/20">
                        Upgrade
                    </button>
                </div>

                {/* Pro Saver (Indian Market Friendly) */}
                <div className="p-6 rounded-3xl border border-blue-500/50 bg-blue-900/20 relative flex flex-col animate-fade-in-up delay-300 shadow-2xl shadow-blue-900/20 group transform scale-105 md:scale-105 z-10">
                    <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl">
                        BEST VALUE
                    </div>

                    <div className="mb-6">
                        <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-bold text-white">Pro Saver</h3>
                            <Sparkles className="w-4 h-4 text-blue-400 animate-pulse" />
                        </div>
                        {/* 29/6 = 4.83 */}
                        <div className="text-3xl font-bold text-white mb-1">$29<span className="text-sm font-normal text-gray-400">/6 mo</span></div>
                        <p className="text-blue-200/70 text-xs">Equals <strong>$4.83/mo</strong>. Huge savings!</p>
                    </div>

                    <ul className="space-y-3 mb-6 flex-1 text-sm">
                        <li className="flex items-center gap-3 text-white">
                            <Check className="w-4 h-4 text-blue-400" /> <strong>Everything in Pro</strong>
                        </li>
                        <li className="flex items-center gap-3 text-white">
                            <Check className="w-4 h-4 text-blue-400" /> Priority Support
                        </li>
                        <li className="flex items-center gap-3 text-white">
                            <Check className="w-4 h-4 text-blue-400" /> LinkedIn Import
                        </li>
                        <li className="flex items-center gap-3 text-white">
                            <Check className="w-4 h-4 text-blue-400" /> Cover Letter AI
                        </li>
                    </ul>

                    <button className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold hover:shadow-lg hover:shadow-blue-500/25 transition-all text-sm">
                        Get 6 Months Access
                    </button>
                    <p className="text-center text-[10px] text-gray-500 mt-2">Perfect for long-term job hunting.</p>
                </div>

            </div>
        </section>
    );
}
