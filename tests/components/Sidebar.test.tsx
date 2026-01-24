import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Sidebar from '@/components/dashboard/Sidebar';

// Mock AuthContext
const mockLogout = vi.fn();
vi.mock('@/context/AuthContext', () => ({
    useAuth: vi.fn(() => ({
        user: { email: 'user@example.com' },
        logout: mockLogout,
    })),
}));

describe('Sidebar Component', () => {
    const mockSetActiveTab = vi.fn();

    it('should render navigation links', () => {
        render(<Sidebar activeTab="overview" setActiveTab={mockSetActiveTab} isGithubConnected={false} />);
        expect(screen.getByText(/overview/i)).toBeInTheDocument();
        expect(screen.getByText(/master profile/i)).toBeInTheDocument();
        expect(screen.getByText(/settings/i)).toBeInTheDocument();
    });

    it('should call setActiveTab when a link is clicked', () => {
        render(<Sidebar activeTab="overview" setActiveTab={mockSetActiveTab} isGithubConnected={false} />);
        fireEvent.click(screen.getByText(/master profile/i));
        expect(mockSetActiveTab).toHaveBeenCalledWith('profile');
    });

    it('should call logout when logout button is clicked', () => {
        render(<Sidebar activeTab="overview" setActiveTab={mockSetActiveTab} isGithubConnected={false} />);
        fireEvent.click(screen.getByText(/logout/i));
        expect(mockLogout).toHaveBeenCalled();
    });
});
