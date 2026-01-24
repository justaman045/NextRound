"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    User,
    signInWithPopup,
    signOut,
    onAuthStateChanged,
    sendPasswordResetEmail
} from "firebase/auth";
import { auth, googleProvider, db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import posthog from "posthog-js";

interface AuthContextType {
    user: User | null;
    loading: boolean;
    signInWithGoogle: () => Promise<void>;
    logout: () => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setUser(user);
            setLoading(false);
            if (user) {
                // Set session cookie for Middleware
                const idToken = await user.getIdToken();
                const isLocal = window.location.hostname === 'localhost';
                document.cookie = `__session=${idToken}; path=/; samesite=lax${isLocal ? '' : '; secure'}`;

                posthog.identify(user.uid, {
                    email: user.email,
                    name: user.displayName,
                });
            } else {
                // Clear session cookie
                document.cookie = "__session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
            }
        });
        return () => unsubscribe();
    }, []);

    const router = useRouter();

    const signInWithGoogle = async () => {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;

            posthog.capture('user_logged_in', {
                method: 'google'
            });

            // Sync user to Firestore 'users' collection for Admin Directory
            if (user) {
                const userRef = doc(db, "users", user.uid);
                await setDoc(userRef, {
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName,
                    photoURL: user.photoURL,
                    lastLogin: new Date().toISOString(),
                    role: "user", // Default role
                }, { merge: true });

                router.push("/profile");
            }
        } catch (error: any) {
            console.error("Error signing in with Google", error);
            if (error.code === 'auth/unauthorized-domain') {
                alert(`Domain not authorized by Firebase.\n\nPlease go to your Firebase Console > Authentication > Settings > Authorized Domains and add this domain: ${window.location.hostname}`);
            } else {
                alert("Failed to sign in. Please try again.");
            }
        }
    };

    const logout = async () => {
        try {
            posthog.capture('user_logged_out');
            posthog.reset();
            // Clear cookie immediately
            document.cookie = "__session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
            await signOut(auth);
        } catch (error) {
            console.error("Error signing out", error);
        }
    };

    const resetPassword = async (email: string) => {
        try {
            await sendPasswordResetEmail(auth, email);
        } catch (error: any) {
            console.error("Error sending password reset email", error);
            throw error;
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, signInWithGoogle, logout, resetPassword }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
