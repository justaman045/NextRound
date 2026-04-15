"use client";

import posthog from "posthog-js";
import { Subscription } from "@/types";
import { Zap, Loader2, Sparkles, X, Check, Star } from "lucide-react";
import { useState, useEffect } from "react";
import { upgradeToPro, cancelSubscription, getBillingHistory } from "@/lib/firestore";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { PRICING_CONFIG, Currency, DEFAULT_CURRENCY, getCurrencyFromLocale } from "@/config/pricing";
import { toast } from "sonner";

interface SubscriptionViewProps {
    subscription: Subscription;
}

declare global {
    interface Window {
        Razorpay: any;
    }
}

export default function SubscriptionView({ subscription }: SubscriptionViewProps) {
    const { user } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState<string | null>(null);
    const [currency, setCurrency] = useState<Currency>(DEFAULT_CURRENCY);
    const [history, setHistory] = useState<any[]>([]);
    const { currencies, plans } = PRICING_CONFIG;

    useEffect(() => {
        const browserLocale = navigator.language.toUpperCase();
        const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        setCurrency(getCurrencyFromLocale(browserLocale, timeZone));

        if (user) {
            getBillingHistory(user.uid).then(setHistory);
        }
    }, [user]);

    const currencySymbol = currencies[currency].symbol;
    const percentage = Math.min((subscription.usage.resumesGenerated / subscription.usage.limit) * 100, 100);

    const handleCancelClick = async () => {
        if (!user) return;
        if (!confirm("Are you sure you want to cancel your PRO subscription? You will maintain access until the end of your current period.")) return;
        
        setLoading('canceling');
        try {
            await cancelSubscription(user.uid);
            toast.success("Subscription canceled successfully.");
            window.location.reload();
        } catch (error) {
            toast.error("Failed to cancel subscription.");
        } finally {
            setLoading(null);
        }
    };

    const handleSwitchPlan = async (planType: 'pro' | 'pro_saver' | 'free') => {
        if (!user) return;
        setLoading(planType);

        try {
            if (planType === 'free') {
                await cancelSubscription(user.uid);
                posthog.capture('subscription_cancelled', { plan: 'free' });
                router.refresh();
                window.location.reload();
            } else {
                // Determine amount and currency from centralized config and local detection
                const planDetails = plans[planType];
                const pricing = planDetails.pricing[currency];
                const amount = pricing.amount;

                // 1. Create Order on Backend
                const orderRes = await fetch('/api/razorpay/order', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        amount,
                        currency,
                        userId: user.uid,
                        billingCycle: planType === 'pro_saver' ? 'semiannual' : 'monthly',
                        receipt: `res_${user.uid.slice(0, 8)}`
                    })
                });

                const orderData = await orderRes.json();
                if (!orderRes.ok) {
                    const errorMsg = orderData.error || 'Failed to create order';
                    const details = orderData.details ? ` (${orderData.details})` : '';
                    throw new Error(`${errorMsg}${details}`);
                }

                // 2. Open Razorpay Checkout
                const options = {
                    key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                    amount: orderData.amount,
                    currency: orderData.currency,
                    name: "NextRound Pro",
                    description: `${planDetails.name} Subscription`,
                    order_id: orderData.id,
                    handler: async function (response: any) {
                        try {
                            setLoading('verifying');
                            // 3. Verify Payment on Backend
                            const verifyRes = await fetch('/api/razorpay/verify', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    razorpay_order_id: response.razorpay_order_id,
                                    razorpay_payment_id: response.razorpay_payment_id,
                                    razorpay_signature: response.razorpay_signature,
                                })
                            });

                            const verifyData = await verifyRes.json();
                            if (verifyRes.ok && verifyData.success) {
                                // 4. Update Database
                                await upgradeToPro(
                                    user.uid,
                                    planType === 'pro_saver' ? 'semiannual' : 'monthly',
                                    response.razorpay_order_id,
                                    response.razorpay_payment_id
                                );

                                posthog.capture('upgrade_success', { plan: planType });
                                router.refresh();
                                window.location.reload();
                            } else {
                                throw new Error(verifyData.message || 'Payment verification failed');
                            }
                        } catch (err: any) {
                            alert(err.message || "Verification failed");
                        } finally {
                            setLoading(null);
                        }
                    },
                    prefill: {
                        name: user.displayName || '',
                        email: user.email || '',
                    },
                    theme: { color: "#9333ea" },
                };

                const rzp = new window.Razorpay(options);
                rzp.open();
            }
        } catch (error: any) {
            console.error("Plan switch failed:", error);
            alert(`Failed: ${error.message || "Please try again."}`);
        } finally {
            if (planType === 'free') setLoading(null);
        }
    };

    const isProMonthly = subscription.plan === 'pro' && (subscription.billingCycle === 'monthly' || !subscription.billingCycle);
    const isProSaver = subscription.plan === 'pro' && subscription.billingCycle === 'semiannual';

    return (
        <div className="space-y-8 animate-fade-in-up">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-white">Subscription & Billing</h2>
                    <p className="text-gray-400 text-sm">Manage your plan and usage limits.</p>
                </div>
            </div>

            {/* Usage Progress - Keep this as it's useful */}
            <div className="glass-panel p-6 rounded-2xl border-purple-500/30 relative overflow-hidden flex flex-col md:flex-row items-center gap-6">
                <div className="absolute top-0 right-0 p-4 opacity-10 md:opacity-50 pointer-events-none">
                    <Zap className="w-48 h-48 text-purple-900" />
                </div>

                <div className="flex-1 w-full relative z-10">
                    <h3 className="text-lg font-bold text-white mb-4">Current Usage</h3>
                    <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-300">Resumes Generated</span>
                        <span className="text-white font-bold">{subscription.usage.resumesGenerated} / {subscription.usage.limit > 1000 ? "Unlimited" : subscription.usage.limit}</span>
                    </div>
                    <div className="h-4 bg-white/10 rounded-full overflow-hidden mb-2">
                        <div
                            className={`h-full rounded-full transition-all duration-1000 ${percentage > 80 ? subscription.usage.limit > 1000 ? "bg-emerald-500" : "bg-red-500" : "bg-purple-500"}`}
                            style={{ width: `${percentage}%` }}
                        />
                    </div>
                    <p className="text-xs text-gray-500">
                        {subscription.plan === 'pro'
                            ? `You are on the ${isProSaver ? plans.pro_saver.name : plans.pro.name} plan with unlimited generations.`
                            : `You have ${Math.max(0, subscription.usage.limit - subscription.usage.resumesGenerated)} generations left.`}
                    </p>
                </div>

                <div className="relative z-10 bg-white/5 p-4 rounded-xl border border-white/10 min-w-[200px] text-center">
                    <p className="text-gray-400 text-xs uppercase tracking-wider font-bold mb-1">Current Plan</p>
                    <p className="text-2xl font-bold text-white capitalize">
                        {subscription.plan === 'pro' ? (isProSaver ? plans.pro_saver.name : plans.pro.name) : plans.free.name}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{subscription.plan === 'pro' ? (subscription.currentPeriodEnd && subscription.currentPeriodEnd !== 'N/A' ? `Renews: ${new Date(subscription.currentPeriodEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}` : 'Active subscription') : 'Forever free'}</p>
                </div>
            </div>

            <h3 className="text-xl font-bold text-white pt-4">Available Plans</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* FREE TIER */}
                <div className={`filter ${subscription.plan === 'free' ? 'border-2 border-gray-500 bg-white/5' : 'border border-white/5 bg-transparent opacity-70 hover:opacity-100'} p-6 rounded-3xl transition-all flex flex-col relative`}>
                    {subscription.plan === 'free' && <div className="absolute top-0 right-0 bg-gray-600 text-white text-[10px] uppercase font-bold px-3 py-1 rounded-bl-xl">Current</div>}
                    <div className="mb-6">
                        <h3 className="text-lg font-bold text-gray-200 mb-2">{plans.free.name}</h3>
                        <div className="text-3xl font-bold text-white mb-2">{currencySymbol}{plans.free.pricing[currency].display}</div>
                        <p className="text-gray-400 text-xs">Forever free.</p>
                    </div>
                    <ul className="space-y-3 mb-8 flex-1 text-sm">
                        {plans.free.features.map((feature, i) => (
                            <li key={i} className="flex items-center gap-3 text-gray-300"><Check className="w-4 h-4 text-gray-500" /> {feature}</li>
                        ))}
                    </ul>
                    <button
                        onClick={() => handleSwitchPlan('free')}
                        disabled={subscription.plan === 'free' || loading !== null}
                        className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${subscription.plan === 'free' ? 'bg-white/10 text-gray-400 cursor-default' : 'border border-white/20 hover:bg-white/5 text-white'}`}
                    >
                        {subscription.plan === 'free' ? "Active Plan" : loading === 'free' ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Downgrade"}
                    </button>
                </div>

                {/* PRO MONTHLY */}
                <div className={`filter ${isProMonthly ? 'border-2 border-purple-500 bg-purple-900/10' : 'border border-purple-500/30 bg-transparent opacity-70 hover:opacity-100'} p-6 rounded-3xl transition-all flex flex-col relative`}>
                    {isProMonthly && <div className="absolute top-0 right-0 bg-purple-600 text-white text-[10px] uppercase font-bold px-3 py-1 rounded-bl-xl">Current</div>}
                    <div className="mb-6">
                        <h3 className="text-lg font-bold text-white mb-2">{plans.pro.name}</h3>
                        <div className="text-3xl font-bold text-white mb-2">{currencySymbol}{plans.pro.pricing[currency].display}<span className="text-sm font-normal text-gray-400">/{plans.pro.billingInterval}</span></div>
                        <p className="text-gray-400 text-xs">Flexible. Cancel anytime.</p>
                    </div>
                    <ul className="space-y-3 mb-8 flex-1 text-sm">
                        {plans.pro.features.map((feature, i) => (
                            <li key={i} className="flex items-center gap-3 text-white"><Check className="w-4 h-4 text-purple-400" /> {feature}</li>
                        ))}
                    </ul>
                    <button
                        onClick={() => handleSwitchPlan('pro')}
                        disabled={isProMonthly || loading !== null}
                        className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${isProMonthly ? 'bg-purple-600/30 text-purple-200 cursor-default' : 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg'}`}
                    >
                        {isProMonthly ? "Active Plan" : loading === 'pro' ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : (isProSaver ? "Switch to Monthly" : "Upgrade")}
                    </button>
                </div>

                {/* PRO SAVER */}
                <div className={`filter ${isProSaver ? 'border-2 border-blue-500 bg-blue-900/10' : 'border-2 border-blue-500/50 bg-blue-900/10'} p-6 rounded-3xl transition-all flex flex-col relative scale-[1.02] shadow-2xl shadow-blue-900/10 z-10`}>
                    {isProSaver && <div className="absolute top-0 right-16 bg-blue-600 text-white text-[10px] uppercase font-bold px-3 py-1 rounded-b-xl">Current</div>}
                    <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl">BEST VALUE</div>
                    <div className="mb-6">
                        <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-bold text-white">{plans.pro_saver.name}</h3>
                            <Sparkles className="w-4 h-4 text-blue-400 animate-pulse" />
                        </div>
                        <div className="text-3xl font-bold text-white mb-1">{currencySymbol}{plans.pro_saver.pricing[currency].display}<span className="text-sm font-normal text-gray-400">/{plans.pro_saver.billingInterval}</span></div>
                        <p className="text-blue-200/70 text-xs">Equals <strong>{currencySymbol}{plans.pro_saver.pricing[currency].monthlyEquivalent}/mo</strong>.</p>
                    </div>
                    <ul className="space-y-3 mb-8 flex-1 text-sm">
                        {plans.pro_saver.features.map((feature, i) => (
                            <li key={i} className="flex items-center gap-3 text-white"><Check className="w-4 h-4 text-blue-400" /> {i === 0 ? <strong>{feature}</strong> : feature}</li>
                        ))}
                    </ul>
                    <button
                        onClick={() => handleSwitchPlan('pro_saver')}
                        disabled={isProSaver || loading !== null}
                        className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${isProSaver ? 'bg-blue-600/30 text-blue-200 cursor-default' : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg'}`}
                    >
                        {isProSaver ? "Active Plan" : loading === 'pro_saver' ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Get Saver Deal"}
                    </button>
                    <p className="text-center text-[10px] text-gray-500 mt-2">Billed {currencySymbol}{plans.pro_saver.pricing[currency].display} every 6 months.</p>
                </div>

            </div>

            {/* Billing History & Management */}
            <div className="mt-12 space-y-6">
                <div className="flex justify-between items-end">
                    <div>
                        <h3 className="text-xl font-bold text-white">Billing History</h3>
                        <p className="text-gray-400 text-sm">View your recent transactions and invoices.</p>
                    </div>
                    {subscription.plan !== 'free' && subscription.status === 'active' && (
                        <button 
                            onClick={handleCancelClick}
                            disabled={loading !== null}
                            className="text-red-400 text-xs font-bold hover:text-red-300 transition-colors flex items-center gap-1 border border-red-400/20 px-3 py-1.5 rounded-lg hover:bg-red-400/5"
                        >
                            {loading === 'canceling' ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
                            Cancel Subscription
                        </button>
                    )}
                </div>

                <div className="glass-panel overflow-hidden border-white/5 bg-white/5 rounded-2xl">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-white/5 text-gray-400 text-[10px] uppercase font-bold tracking-widest">
                            <tr>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Order ID</th>
                                <th className="px-6 py-4">Amount</th>
                                <th className="px-6 py-4">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {history.length > 0 ? history.map((inv) => (
                                <tr key={inv.id} className="text-gray-300 hover:bg-white/[0.02] transition-colors">
                                    <td className="px-6 py-4">{new Date(inv.date).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 font-mono text-xs">{inv.orderId}</td>
                                    <td className="px-6 py-4 font-bold text-white">{inv.amount}</td>
                                    <td className="px-6 py-4">
                                        <span className="bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded-md text-[10px] uppercase font-bold border border-emerald-500/20">
                                            {inv.status}
                                        </span>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                                        No billing history found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
