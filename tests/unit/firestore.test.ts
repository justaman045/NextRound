import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getUserProfile, saveUserProfile } from '@/lib/firestore';
import { getDoc, setDoc } from 'firebase/firestore';

vi.mock('firebase/firestore');

describe('Firestore Helpers', () => {
    const mockUid = 'test-uid';
    const mockProfile = {
        fullName: 'Test User',
        email: 'test@example.com',
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('getUserProfile should fetch and return profile data', async () => {
        const mockSnap = {
            exists: () => true,
            data: () => mockProfile,
        };
        (getDoc as any).mockResolvedValue(mockSnap);

        const result = await getUserProfile(mockUid);
        expect(result).toEqual(mockProfile);
        expect(getDoc).toHaveBeenCalled();
    });

    it('saveUserProfile should call setDoc with correct data', async () => {
        (setDoc as any).mockResolvedValue(undefined);

        await saveUserProfile(mockUid, mockProfile as any);
        expect(setDoc).toHaveBeenCalledWith(undefined, mockProfile, { merge: true });
    });
});
