"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

import { ShieldAlert, Trash2, Eraser, Sparkles, Loader2, Key, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { getUserProfile, saveUserProfile, getUserSubscription } from "@/lib/firestore";
import { removeDuplicates } from "@/lib/profile-utils";
import { useState, useEffect } from "react";
import { Subscription } from "@/types";

export default function Settings() {
    const { user, resetPassword } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [billingLoading, setBillingLoading] = useState(false);
    const [resetLoading, setResetLoading] = useState(false);
    const [subscription, setSubscription] = useState<Subscription | null>(null);

    useEffect(() => {
        const fetchSub = async () => {
            if (user) {
                const sub = await getUserSubscription(user.uid);
                setSubscription(sub);
            }
        };
        fetchSub();
    }, [user]);

    const handleManageSubscription = () => {
        router.push("/profile?tab=subscription");
    };

    const handleResetPassword = async () => {
        if (!user?.email) return;
        setResetLoading(true);
        try {
            await resetPassword(user.email);
            toast.success("Password reset email sent! Please check your inbox.");
        } catch (error: any) {
            toast.error(error.message || "Failed to send reset email.");
        } finally {
            setResetLoading(false);
        }
    };

    const handleRemoveDuplicates = async () => {
        if (!user) return;
        setLoading(true);
        try {
            // toast.loading("Scanning profile..."); // Loading state handles UI, toast might simply stack if success comes fast

            const currentProfile = await getUserProfile(user.uid);
            if (!currentProfile) {
                toast.error("Profile not found.");
                setLoading(false);
                return;
            }

            const cleanedProfile = removeDuplicates(currentProfile);

            // Calculate diff
            const expRemoved = (currentProfile.experience?.length || 0) - (cleanedProfile.experience?.length || 0);
            const eduRemoved = (currentProfile.education?.length || 0) - (cleanedProfile.education?.length || 0);
            const projRemoved = (currentProfile.projects?.length || 0) - (cleanedProfile.projects?.length || 0);

            const totalRemoved = expRemoved + eduRemoved + projRemoved;

            if (totalRemoved === 0) {
                toast.info("No duplicates found. Your profile is clean!");
            } else {
                await saveUserProfile(user.uid, cleanedProfile);
                toast.success(`Removed ${totalRemoved} duplicates (${expRemoved} Exp, ${eduRemoved} Edu, ${projRemoved} Proj).`);
                // reload to reflect changes
                window.location.reload();
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to clean profile.");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (!confirm("Are you ABSOLUTELY sure? This will permanently delete your account and all data.")) return;
        if (!user) return;

        try {
            const token = await user.getIdToken();
            const res = await fetch('/api/user/delete', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (res.ok) {
                toast.success("Account deleted. Resigning out...");
                router.push('/');
                window.location.reload();
            } else {
                const data = await res.json();
                toast.error("Failed to delete: " + data.error);
            }
        } catch (err) {
            console.error(err);
            toast.error("Error deleting account.");
        }
    };

    return (
        <div className="space-y-6 animate-fade-in-up">
            <h2 className="text-2xl font-bold text-white mb-6">Settings</h2>

            {/* Account Security */}
            <div className="border border-purple-500/20 rounded-2xl overflow-hidden bg-purple-500/5 mb-6">
                <div className="p-6 border-b border-purple-500/10">
                    <h3 className="text-purple-400 font-bold flex items-center gap-2">
                        <Key className="w-5 h-5" /> Account Security
                    </h3>
                    <p className="text-gray-400 text-sm mt-2">
                        Manage your password and authentication settings.
                    </p>
                </div>

                <div className="p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                        <h4 className="text-white font-bold text-sm">Reset Password</h4>
                        <p className="text-gray-400 text-xs mt-1 max-w-md">
                            We'll send a password recovery email to <strong>{user?.email}</strong>.
                        </p>
                    </div>
                    <button
                        onClick={handleResetPassword}
                        disabled={resetLoading}
                        className="bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 px-6 py-3 rounded-xl text-sm font-bold transition-colors whitespace-nowrap flex items-center gap-2 disabled:opacity-50"
                    >
                        {resetLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
                        Send Reset Email
                    </button>
                </div>
            </div>

            {/* Subscription Management */}
            {subscription?.plan !== 'free' && (
                <div className="border border-green-500/20 rounded-2xl overflow-hidden bg-green-500/5 mb-6">
                    <div className="p-6 border-b border-green-500/10">
                        <h3 className="text-green-400 font-bold flex items-center gap-2">
                            <CreditCard className="w-5 h-5" /> Subscription & Billing
                        </h3>
                        <p className="text-gray-400 text-sm mt-2">
                            Manage your plan, update payment methods, or download invoices.
                        </p>
                    </div>

                    <div className="p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div>
                            <h4 className="text-white font-bold text-sm">Billing Management</h4>
                            <p className="text-gray-400 text-xs mt-1 max-w-md">
                                Access your secure Razorpay portal or contact support to manage your current <strong>{subscription?.plan?.toUpperCase()}</strong> subscription.
                            </p>
                        </div>
                        <button
                            onClick={handleManageSubscription}
                            disabled={billingLoading}
                            className="bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 px-6 py-3 rounded-xl text-sm font-bold transition-colors whitespace-nowrap flex items-center gap-2 disabled:opacity-50"
                        >
                            {billingLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                            Manage Billing
                        </button>
                    </div>
                </div>
            )}

            {/* Data Management */}
            <div className="border border-blue-500/20 rounded-2xl overflow-hidden bg-blue-500/5">
                <div className="p-6 border-b border-blue-500/10">
                    <h3 className="text-blue-400 font-bold flex items-center gap-2">
                        <Sparkles className="w-5 h-5" /> Data Management
                    </h3>
                    <p className="text-gray-400 text-sm mt-2">
                        Manage your profile data and perform cleanup operations.
                    </p>
                </div>

                <div className="p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                        <h4 className="text-white font-bold text-sm">Remove Duplicates</h4>
                        <p className="text-gray-400 text-xs mt-1 max-w-md">
                            Scan your profile for duplicate entries in Experience, Education, and Projects caused by multiple imports, and remove them.
                        </p>
                    </div>
                    <button
                        onClick={handleRemoveDuplicates}
                        disabled={loading}
                        className="bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 px-6 py-3 rounded-xl text-sm font-bold transition-colors whitespace-nowrap flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eraser className="w-4 h-4" />}
                        Clean Up Duplicates
                    </button>
                </div>
            </div>

            {/* Danger Zone */}
            <div className="border border-red-500/20 rounded-2xl overflow-hidden bg-red-500/5">
                <div className="p-6 border-b border-red-500/10">
                    <h3 className="text-red-500 font-bold flex items-center gap-2">
                        <ShieldAlert className="w-5 h-5" /> Danger Zone
                    </h3>
                    <p className="text-gray-400 text-sm mt-2">
                        Irreversible actions related to your account security and data.
                    </p>
                </div>

                <div className="p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                        <h4 className="text-white font-bold text-sm">Delete Account</h4>
                        <p className="text-gray-400 text-xs mt-1 max-w-md">
                            Permanently delete your account and all associated data, including resumes, subscription, and profile information.
                            <strong> This action cannot be undone.</strong>
                        </p>
                    </div>
                    <button
                        onClick={handleDeleteAccount}
                        className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 px-6 py-3 rounded-xl text-sm font-bold transition-colors whitespace-nowrap flex items-center gap-2"
                    >
                        <Trash2 className="w-4 h-4" />
                        Delete My Account
                    </button>
                </div>
            </div>
        </div>
    );
}
