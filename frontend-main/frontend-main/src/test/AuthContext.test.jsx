import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AuthProvider, useAuth } from '../context/AuthContext';

// Helper component that displays auth state
function AuthConsumer() {
    const auth = useAuth();
    return (
        <div>
            <span data-testid="authenticated">{String(auth.isAuthenticated)}</span>
            <span data-testid="admin">{String(auth.isAdmin)}</span>
            <span data-testid="staff">{String(auth.isStaff)}</span>
            <span data-testid="loading">{String(auth.loading)}</span>
        </div>
    );
}

describe('AuthContext', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('throws when useAuth is used outside AuthProvider', () => {
        // Suppress React error boundary console noise
        const spy = vi.spyOn(console, 'error').mockImplementation(() => { });
        expect(() => render(<AuthConsumer />)).toThrow('useAuth must be used within an AuthProvider');
        spy.mockRestore();
    });

    it('defaults to unauthenticated state', () => {
        render(
            <AuthProvider>
                <AuthConsumer />
            </AuthProvider>
        );
        expect(screen.getByTestId('authenticated').textContent).toBe('false');
        expect(screen.getByTestId('admin').textContent).toBe('false');
        expect(screen.getByTestId('staff').textContent).toBe('false');
    });

    it('loads user from localStorage if token exists', () => {
        const fakeUser = { name: 'Test', role: 'admin', token: 'abc' };
        localStorage.setItem('token', 'abc');
        localStorage.setItem('user', JSON.stringify(fakeUser));
        localStorage.setItem('lastActivity', Date.now().toString());

        render(
            <AuthProvider>
                <AuthConsumer />
            </AuthProvider>
        );

        expect(screen.getByTestId('authenticated').textContent).toBe('true');
        expect(screen.getByTestId('admin').textContent).toBe('true');
        expect(screen.getByTestId('staff').textContent).toBe('false');
    });

    it('recognises staff role correctly', () => {
        const fakeUser = { name: 'Staff', role: 'staff', token: 'xyz' };
        localStorage.setItem('token', 'xyz');
        localStorage.setItem('user', JSON.stringify(fakeUser));
        localStorage.setItem('lastActivity', Date.now().toString());

        render(
            <AuthProvider>
                <AuthConsumer />
            </AuthProvider>
        );

        expect(screen.getByTestId('staff').textContent).toBe('true');
        expect(screen.getByTestId('admin').textContent).toBe('false');
    });
});
