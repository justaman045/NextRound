import { db } from "./firebase";
import { doc, getDoc, setDoc, collection, query, orderBy, getDocs, deleteDoc, updateDoc, increment, getCountFromServer, deleteField } from "firebase/firestore";
import { UserProfile, Subscription } from "@/types";

export { deleteField };

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
    const docRef = doc(db, "users", userId, "profile", "master");
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        return docSnap.data() as UserProfile;
    } else {
        return null;
    }
};

export const saveUserProfile = async (userId: string, data: UserProfile) => {
    const docRef = doc(db, "users", userId, "profile", "master");
    await setDoc(docRef, data, { merge: true });
};

export const saveWaitlistEmail = async (email: string) => {
    // Use email as doc ID to prevent duplicates
    const docRef = doc(db, "waitlist", email);
    await setDoc(docRef, {
        email,
        joinedAt: new Date().toISOString()
    });
};

// Resume Management
export const saveUserResume = async (userId: string, resume: any) => {
    const docRef = doc(db, "users", userId, "resumes", resume.id);
    await setDoc(docRef, resume, { merge: true });
};

export const getUserResumes = async (userId: string): Promise<any[]> => {
    const colRef = collection(db, "users", userId, "resumes");
    const q = query(colRef, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data());
};

export const deleteUserResume = async (userId: string, resumeId: string) => {
    const docRef = doc(db, "users", userId, "resumes", resumeId);
    await deleteDoc(docRef);
};

// Versioning / History
export const saveResumeVersion = async (userId: string, resumeId: string, data: any) => {
    const historyRef = collection(db, "users", userId, "resumes", resumeId, "history");
    const newVersionRef = doc(historyRef);
    await setDoc(newVersionRef, {
        id: newVersionRef.id,
        data: data.data,
        templateId: data.templateId,
        timestamp: new Date().toISOString(),
        label: data.label || "Auto-match Save"
    });
};

export const getResumeHistory = async (userId: string, resumeId: string): Promise<any[]> => {
    const historyRef = collection(db, "users", userId, "resumes", resumeId, "history");
    const q = query(historyRef, orderBy("timestamp", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data());
};

export const getUserSubscription = async (userId: string): Promise<Subscription> => {
    const docRef = doc(db, "users", userId, "subscription", "details");
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        return docSnap.data() as Subscription;
    } else {
        // Fallback: Sync with actual resume count if subscription record is missing
        const resumesCol = collection(db, "users", userId, "resumes");
        const snapshot = await getCountFromServer(resumesCol);
        const actualCount = snapshot.data().count;

        // Return default free tier with synced count
        return {
            id: "free_tier",
            plan: "free",
            status: "active",
            currentPeriodEnd: "N/A",
            usage: {
                resumesGenerated: actualCount,
                limit: 1 // Free tier limited to 1 resume
            }
        };
    }
};

export const incrementGlobalStat = async (field: string) => {
    const docRef = doc(db, "system", "stats");
    await setDoc(docRef, { [field]: increment(1) }, { merge: true });
};

export const incrementResumeUsage = async (userId: string) => {
    const docRef = doc(db, "users", userId, "subscription", "details");
    const docSnap = await getDoc(docRef);

    // Increment global counter
    await incrementGlobalStat("resumesGenerated");

    if (docSnap.exists()) {
        await updateDoc(docRef, {
            "usage.resumesGenerated": increment(1)
        });
    } else {
        // Create initial record if it doesn't exist
        await setDoc(docRef, {
            id: "sub_" + Date.now(),
            plan: "free",
            status: "active",
            currentPeriodEnd: "N/A",
            usage: {
                resumesGenerated: 1, // Start at 1
                limit: 1 // Free tier limited to 1 resume
            }
        });
    }
};

export const upgradeToPro = async (userId: string, billingCycle: 'monthly' | 'semiannual' = 'monthly', razorpayOrderId?: string, razorpayPaymentId?: string) => {
    const docRef = doc(db, "users", userId, "subscription", "details");

    await setDoc(docRef, {
        id: "sub_pro_" + Date.now(),
        plan: "pro",
        status: "active",
        billingCycle, // Save the cycle
        razorpayOrderId,
        razorpayPaymentId,
        currentPeriodEnd: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(), // 1 year from now
    }, { merge: true });

    // Explicitly update the limit and plan to be sure, using updateDoc which allows dot notation for nested fields
    await updateDoc(docRef, {
        plan: "pro",
        billingCycle,
        "usage.limit": 10000 // Effectively unlimited
    });
};

export const toggleIntegration = async (userId: string, platform: string, isConnected: boolean) => {
    const docRef = doc(db, "users", userId, "profile", "master");

    // Use setDoc with merge to update the nested integrations field
    const updateData = {
        integrations: {
            [platform]: isConnected
        }
    };

    await setDoc(docRef, updateData, { merge: true });
};

// System Configuration
export const getSystemConfig = async () => {
    const docRef = doc(db, "system", "config");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return docSnap.data();
    }
    // Default config if missing
    return { mode: "production" };
};

export const updateSystemConfig = async (data: any) => {
    const docRef = doc(db, "system", "config");
    await setDoc(docRef, data, { merge: true });
};

// Cancel Subscription (Downgrade to free)
export const cancelSubscription = async (uid: string) => {
    try {
        const subRef = doc(db, "users", uid, "subscription", "details");
        // We set to plan: free, limit: 1
        // We do NOT reset resumesGenerated because that is lifetime usage.
        await updateDoc(subRef, {
            plan: "free",
            status: "active",
            "usage.limit": 1
        });
        return true;
    } catch (error) {
        console.error("Error canceling subscription:", error);
        throw error;
    }
};


