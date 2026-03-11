import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../App';

describe('App', () => {
    it('renders without crashing', () => {
        const { container } = render(<App />);
        expect(container).toBeTruthy();
    });

    it('shows login page by default', () => {
        render(<App />);
        // The default route redirects to /login — "Smart Cafeteria" title is unique
        expect(screen.getByText('Smart Cafeteria')).toBeInTheDocument();
    });
});
