import admin from 'firebase-admin';

const getFirebaseAdmin = () => {
    if (!admin.apps.length) {
        if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
            try {
                admin.initializeApp({
                    credential: admin.credential.cert({
                        projectId: process.env.FIREBASE_PROJECT_ID,
                        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
                    }),
                });
            } catch (error) {
                console.error('Firebase Admin initialization error', error);
            }
        }
    }
    return admin;
};

// Initialize
getFirebaseAdmin();

// Lazy exports to prevent build-time crashes
export const adminAuth = {
    get instance() {
        if (!admin.apps.length) return null;
        return admin.auth();
    },
    verifyIdToken: async (token: string) => {
        const auth = admin.apps.length ? admin.auth() : null;
        if (!auth) throw new Error("Firebase Auth not initialized");
        return auth.verifyIdToken(token);
    },
    deleteUser: async (uid: string) => {
        const auth = admin.apps.length ? admin.auth() : null;
        if (!auth) throw new Error("Firebase Auth not initialized");
        return auth.deleteUser(uid);
    }
} as any;

export const adminDb = {
    get instance() {
        if (!admin.apps.length) return null;
        return admin.firestore();
    },
    collection: (path: string) => {
        if (!admin.apps.length) throw new Error("Firebase Firestore not initialized");
        return admin.firestore().collection(path);
    },
    batch: () => {
        if (!admin.apps.length) throw new Error("Firebase Firestore not initialized");
        return admin.firestore().batch();
    }
} as any;
