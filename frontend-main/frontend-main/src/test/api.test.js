import { describe, it, expect } from 'vitest';
import api, { authAPI, menuAPI, bookingsAPI } from '../services/api';

describe('API Service', () => {
    it('has the correct base URL', () => {
        expect(api.defaults.baseURL).toBe('/api');
    });

    it('sets Content-Type to application/json', () => {
        expect(api.defaults.headers['Content-Type']).toBe('application/json');
    });

    it('attaches auth token from localStorage', async () => {
        localStorage.setItem('token', 'test-jwt-123');

        // Manually run the request interceptor
        const interceptor = api.interceptors.request.handlers[0];
        const config = { headers: {} };
        const result = interceptor.fulfilled(config);

        expect(result.headers.Authorization).toBe('Bearer test-jwt-123');
        localStorage.removeItem('token');
    });

    it('does not attach auth header when no token exists', () => {
        localStorage.removeItem('token');

        const interceptor = api.interceptors.request.handlers[0];
        const config = { headers: {} };
        const result = interceptor.fulfilled(config);

        expect(result.headers.Authorization).toBeUndefined();
    });
});

describe('API Modules Export', () => {
    it('authAPI has login and register methods', () => {
        expect(typeof authAPI.login).toBe('function');
        expect(typeof authAPI.register).toBe('function');
        expect(typeof authAPI.getProfile).toBe('function');
    });

    it('menuAPI has getAll and addItem methods', () => {
        expect(typeof menuAPI.getAll).toBe('function');
        expect(typeof menuAPI.addItem).toBe('function');
    });

    it('bookingsAPI has CRUD methods', () => {
        expect(typeof bookingsAPI.getAll).toBe('function');
        expect(typeof bookingsAPI.create).toBe('function');
        expect(typeof bookingsAPI.update).toBe('function');
        expect(typeof bookingsAPI.delete).toBe('function');
    });
});
