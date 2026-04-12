import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Pricing from '@/components/landing/Pricing';

// Mock AuthContext if needed (though Pricing doesnt use it directly, its good to have)
vi.mock('@/context/AuthContext', () => ({
    useAuth: vi.fn(() => ({
        user: null,
        signInWithGoogle: vi.fn(),
    })),
}));

describe('Pricing Component', () => {
    it('should render all three pricing plans', () => {
        render(<Pricing />);
        expect(screen.getByText(/free tier/i)).toBeInTheDocument();
        expect(screen.getByText(/pro monthly/i)).toBeInTheDocument();
        expect(screen.getByText(/pro saver/i)).toBeInTheDocument();
    });

    it('should show correct prices', () => {
        render(<Pricing />);
        expect(screen.getByText('₹0')).toBeInTheDocument();
        expect(screen.getByText('₹799')).toBeInTheDocument();
        expect(screen.getByText('₹2499')).toBeInTheDocument();
    });

    it('should show "Best Value" badge for Pro Saver', () => {
        render(<Pricing />);
        expect(screen.getByText(/best value/i)).toBeInTheDocument();
    });
});
