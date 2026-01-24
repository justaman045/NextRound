import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";

// Config hardcoded to prevent env var loading issues
const firebaseConfig = {
    apiKey: "AIzaSyAiOz5I4Qs9Ale3pDdhaRfxDUfNAcn9xRk",
    authDomain: "nextround-e9bee.firebaseapp.com",
    projectId: "nextround-e9bee",
    storageBucket: "nextround-e9bee.firebasestorage.app",
    messagingSenderId: "65745714984",
    appId: "1:65745714984:web:faef1dd432d47b2f365a1d",
    measurementId: "G-GTC1YD25S2"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// Initialize Analytics only on client side
let analytics;
if (typeof window !== "undefined") {
    isSupported().then((supported) => {
        if (supported) {
            analytics = getAnalytics(app);
        }
    });
}

export { auth, db, googleProvider, analytics };
