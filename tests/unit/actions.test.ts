import { describe, it, expect, vi } from 'vitest';
import { tailorResume } from '@/actions/generateResume';

process.env.OPENROUTER_API_KEY = 'test-key';

vi.mock('openai', () => {
    return {
        default: class MockOpenAI {
            chat = {
                completions: {
                    create: vi.fn().mockResolvedValue({
                        choices: [{
                            message: {
                                content: JSON.stringify({
                                    data: {
                                        summary: 'Tailored summary',
                                        experience: [],
                                        skills: 'Mocked skills'
                                    },
                                    score: 95,
                                    analysis: 'Looks great'
                                })
                            }
                        }]
                    })
                }
            };
        }
    };
});

describe('AI Actions', () => {
    it('tailorResume should call AI and return parsed result', async () => {
        const mockProfile = { fullName: 'Test', experience: [], skills: '' };
        const mockJobDesc = 'React Developer at Google';

        const result = await tailorResume(mockProfile as any, mockJobDesc, 'google/gemma-3-12b-it:free');

        expect(result.data.summary).toBe('Tailored summary');
        expect(result.data.skills).toBe('Mocked skills');
        expect(result.score).toBe(95);
    });
});
