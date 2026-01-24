import { describe, it, expect, vi } from 'vitest';
import { tailorResume } from '@/actions/generateResume';

process.env.GEMINI_API_KEY = 'test-key';

// Mock the AI SDK as a class
vi.mock('@google/generative-ai', () => {
    class MockGoogleGenerativeAI {
        generateContent = vi.fn().mockResolvedValue({
            response: {
                text: () => JSON.stringify({
                    summary: 'Tailored summary',
                    experience: [],
                    skills: 'Mocked skills'
                })
            }
        });

        getGenerativeModel = vi.fn().mockImplementation(() => ({
            generateContent: this.generateContent
        }));
    }

    return {
        GoogleGenerativeAI: MockGoogleGenerativeAI
    };
});

describe('AI Actions', () => {
    it('tailorResume should call AI and return parsed result', async () => {
        const mockProfile = { fullName: 'Test', experience: [], skills: '' };
        const mockJobDesc = 'React Developer at Google';

        const result = await tailorResume(mockProfile as any, mockJobDesc, 'gemini-pro');

        expect(result.summary).toBe('Tailored summary');
        expect(result.skills).toBe('Mocked skills');
    });
});
