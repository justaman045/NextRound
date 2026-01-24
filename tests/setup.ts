import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: vi.fn(),
        replace: vi.fn(),
        prefetch: vi.fn(),
    }),
    useSearchParams: () => ({
        get: vi.fn(),
    }),
    usePathname: () => '/',
}));

// Mock PostHog
vi.mock('posthog-js', () => ({
    default: {
        identify: vi.fn(),
        capture: vi.fn(),
        reset: vi.fn(),
        init: vi.fn(),
    },
}));

// Mock Sonner
vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
        info: vi.fn(),
        warning: vi.fn(),
    },
}));

// Mock Firebase Auth
vi.mock('firebase/auth', () => ({
    getAuth: vi.fn(),
    signInWithPopup: vi.fn(),
    signOut: vi.fn(),
    onAuthStateChanged: vi.fn(() => () => { }),
    GoogleAuthProvider: vi.fn(),
}));

// Mock Firebase Firestore
vi.mock('firebase/firestore', () => ({
    getFirestore: vi.fn(),
    collection: vi.fn(),
    doc: vi.fn(),
    getDoc: vi.fn(),
    getDocs: vi.fn(),
    setDoc: vi.fn(),
    updateDoc: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
}));
