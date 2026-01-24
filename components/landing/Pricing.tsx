import { Check, X, Sparkles } from "lucide-react";
import Link from "next/link";
import { PRICING_CONFIG, getCurrencyFromLocale, Currency, DEFAULT_CURRENCY } from "@/config/pricing";
import { useState, useEffect } from "react";

export default function Pricing() {
    const [currency, setCurrency] = useState<Currency>(DEFAULT_CURRENCY);
    const { currencies, plans } = PRICING_CONFIG;

    useEffect(() => {
        // Simple detection based on locale
        // In a real app, you might use a geolocation API or Cloudflare headers
        const browserLocale = navigator.language.toUpperCase();
        const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        setCurrency(getCurrencyFromLocale(browserLocale, timeZone));
    }, []);

    const currencySymbol = currencies[currency].symbol;

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
                        <h3 className="text-lg font-bold text-gray-200 mb-2">{plans.free.name}</h3>
                        <div className="text-3xl font-bold text-white mb-2">{currencySymbol}{plans.free.pricing[currency].display}</div>
                        <p className="text-gray-400 text-xs">Forever free.</p>
                    </div>

                    <ul className="space-y-3 mb-6 flex-1 text-sm">
                        {plans.free.features.map((feature, i) => (
                            <li key={i} className="flex items-center gap-3 text-gray-300">
                                <Check className="w-4 h-4 text-gray-500" /> {feature}
                            </li>
                        ))}
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
                        <h3 className="text-lg font-bold text-white mb-2">{plans.pro.name}</h3>
                        <div className="text-3xl font-bold text-white mb-2">{currencySymbol}{plans.pro.pricing[currency].display}<span className="text-sm font-normal text-gray-400">/{plans.pro.billingInterval}</span></div>
                        <p className="text-gray-400 text-xs">Cancel anytime.</p>
                    </div>

                    <ul className="space-y-3 mb-6 flex-1 text-sm">
                        {plans.pro.features.map((feature, i) => (
                            <li key={i} className="flex items-center gap-3 text-white">
                                <Check className="w-4 h-4 text-purple-400" /> {feature}
                            </li>
                        ))}
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
                            <h3 className="text-lg font-bold text-white">{plans.pro_saver.name}</h3>
                            <Sparkles className="w-4 h-4 text-blue-400 animate-pulse" />
                        </div>
                        <div className="text-3xl font-bold text-white mb-1">{currencySymbol}{plans.pro_saver.pricing[currency].display}<span className="text-sm font-normal text-gray-400">/{plans.pro_saver.billingInterval}</span></div>
                        <p className="text-blue-200/70 text-xs">Equals <strong>{currencySymbol}{plans.pro_saver.pricing[currency].monthlyEquivalent}/mo</strong>. Huge savings!</p>
                    </div>

                    <ul className="space-y-3 mb-6 flex-1 text-sm">
                        {plans.pro_saver.features.map((feature, i) => (
                            <li key={i} className="flex items-center gap-3 text-white">
                                <Check className="w-4 h-4 text-blue-400" /> {i === 0 ? <strong>{feature}</strong> : feature}
                            </li>
                        ))}
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
