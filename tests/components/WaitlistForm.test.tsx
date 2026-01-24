import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import WaitlistForm from '@/components/WaitlistForm';
import { saveWaitlistEmail } from '@/lib/firestore';

// Mock the firestore helper instead of the low-level firebase sdk
vi.mock('@/lib/firestore', () => ({
    saveWaitlistEmail: vi.fn(),
}));

describe('WaitlistForm Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render the input and submit button', () => {
        render(<WaitlistForm />);
        expect(screen.getByPlaceholderText(/early access/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /join/i })).toBeInTheDocument();
    });

    it('should call saveWaitlistEmail on valid submission', async () => {
        (saveWaitlistEmail as any).mockResolvedValueOnce(undefined);

        render(<WaitlistForm />);
        const input = screen.getByPlaceholderText(/early access/i);
        const form = screen.getByRole('textbox').closest('form')!;

        fireEvent.change(input, { target: { value: 'test@example.com' } });
        fireEvent.submit(form);

        await waitFor(() => {
            expect(saveWaitlistEmail).toHaveBeenCalledWith('test@example.com');
            expect(screen.getByText(/you're on the list/i)).toBeInTheDocument();
        });
    });

    it('should not submit for invalid email', async () => {
        // Mock window.alert
        const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => { });

        render(<WaitlistForm />);
        const input = screen.getByPlaceholderText(/early access/i);
        const form = screen.getByRole('textbox').closest('form')!;

        fireEvent.change(input, { target: { value: 'invalid' } });
        fireEvent.submit(form);

        expect(saveWaitlistEmail).not.toHaveBeenCalled();
        expect(alertMock).toHaveBeenCalledWith('Please enter a valid email.');

        alertMock.mockRestore();
    });
});
