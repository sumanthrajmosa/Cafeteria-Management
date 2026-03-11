import axios from 'axios';

/**
 * API Service Layer
 * Centralized Axios instance for communicating with the Go Backend.
 * Handles authentication header injection and standardizes response formats.
 */

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

/**
 * Request Interceptor
 * Automatically attaches the JWT Bearer Token from localStorage to every outgoing request.
 * This satisfies Epic 1 (Secure Access Control).
 */
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Authentication & Profile Services (Epic 1)
export const authAPI = {
    login: (credentials) => api.post('/auth/login', credentials),
    register: (data) => api.post('/auth/register', data),
    getProfile: () => api.get('/auth/me'),
    updateProfile: (data) => api.put('/auth/me', data),
    verifyTotp: (tempToken, code) => api.post('/auth/verify-totp', { tempToken, code }),
    forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
    resetPassword: (token, newPassword) => api.post('/auth/reset-password', { token, newPassword })
};

// TOTP / Two-Factor Authentication
export const totpAPI = {
    getStatus: () => api.get('/auth/totp/status'),
    setup: () => api.post('/auth/totp/setup'),
    confirm: (code) => api.post('/auth/totp/confirm', { code }),
    disable: (password, code) => api.delete('/auth/totp/disable', { data: { password, code } }),
    // Mandatory first-time setup during login (uses temp token, no JWT needed)
    firstSetup: (tempToken) => api.post('/auth/totp/first-setup', { tempToken }),
    firstConfirm: (tempToken, code) => api.post('/auth/totp/first-confirm', { tempToken, code })
};

// Audit Logs (admin only)
export const auditAPI = {
    getLogs: (params = {}) => api.get('/audit-logs', { params })
};

// User Profile Management (Epic 1)
export const usersAPI = {
    getAll: () => api.get('/users'),
    getById: (id) => api.get(`/users/${id}`),
    update: (id, data) => api.put(`/users/${id}`, data),
    delete: (id) => api.delete(`/users/${id}`),
    block: (id) => api.put(`/users/${id}/block`),
    unblock: (id) => api.put(`/users/${id}/unblock`),
    changeRole: (id, role) => api.put(`/users/${id}/role`, { role })
};

// Meal Booking Management (Epic 3)
export const bookingsAPI = {
    getAll: () => api.get('/bookings'),
    getAllAdmin: () => api.get('/bookings/all'),
    getById: (id) => api.get(`/bookings/${id}`),
    create: (data) => api.post('/bookings', data),
    update: (id, data) => api.put(`/bookings/${id}`, data),
    delete: (id) => api.delete(`/bookings/${id}`)
};

// Real-time Queue & Token Management (Epic 3 & 6)
// Enforces FIFO calling and provides position transparency.
export const queueAPI = {
    getStatus: () => api.get('/queue/status'),
    getMyToken: () => api.get('/queue/my-token'),
    callNext: (counterNumber) => api.post('/queue/call-next', { counterNumber }),
    serve: (id) => api.put(`/queue/${id}/serve`),
    getHistory: () => api.get('/queue/history'),
    getFairness: (days = 7) => api.get(`/queue/fairness?days=${days}`)
};

// Menu & Inventory Control (Epic 2)
export const menuAPI = {
    getAll: () => api.get('/menu'),
    toggleAvailability: (id, available) =>
        api.patch(`/menu/${id}/availability`, { available }),
    addItem: (data) => api.post('/menu', data),
    updateItem: (id, data) => api.put(`/menu/${id}`, data),
    deleteItem: (id) => api.delete(`/menu/${id}`)
};

// Time Slot Configuration (Epic 3)
export const slotsAPI = {
    getAll: () => api.get('/slots'),
    getToday: () => api.get('/slots/today'),
    getById: (id) => api.get(`/slots/${id}`),
    create: (data) => api.post('/slots', data),
    update: (id, data) => api.put(`/slots/${id}`, data),
    delete: (id) => api.delete(`/slots/${id}`),
    generate: (data) => api.post('/slots/generate', data)
};

// AI Demand Forecasting (Epic 4)
// Fetches week-ahead predictions from the ML service via the Go Backend.
export const forecastsAPI = {
    getToday: () => api.get('/forecasts/today'),
    getWeek: () => api.get('/forecasts/week'),
    getAll: () => api.get('/forecasts'),
    getAccuracy: (days = 30) => api.get(`/forecasts/accuracy?days=${days}`),
    predict: (data) => api.post('/forecasts/predict', data),
    updateActual: (id, actualDemand) => api.put(`/forecasts/${id}/actual`, { actualDemand }),
    recordActualFromBookings: (date, mealType) => api.post('/forecasts/record-actual', { date, mealType })
};

// Waste Tracking & Sustainability Logs (Epic 4)
export const wasteAPI = {
    getAll: (params = {}) => api.get('/waste', { params }),
    getSummary: (days = 30) => api.get(`/waste/summary?days=${days}`),
    create: (data) => api.post('/waste', data),
    update: (id, data) => api.put(`/waste/${id}`, data),
    delete: (id) => api.delete(`/waste/${id}`)
};

// Sustainability Metrics (Epic 4.8)
export const sustainabilityAPI = {
    getMetrics: () => api.get('/sustainability/metrics'),
    getReport: (period = '30d', startDate, endDate) => {
        let url = `/sustainability/report?period=${period}`;
        if (period === 'custom' && startDate) url += `&startDate=${startDate}`;
        if (period === 'custom' && endDate) url += `&endDate=${endDate}`;
        return api.get(url);
    },
    downloadCSV: (period = '30d') => api.get(`/sustainability/report/csv?period=${period}`, { responseType: 'blob' })
};

// AI-Driven Preparation Recommendations (Epic 4.5)
export const preparationAPI = {
    getRecommendations: (date) => api.get(`/preparation/recommendations${date ? `?date=${date}` : ''}`)
};

// Operational Dashboards & Analytics (Epic 2)
export const analyticsAPI = {
    getDashboard: () => api.get('/analytics/dashboard'),
    getWasteReport: () => api.get('/analytics/waste-report'),
    getDemandTrends: () => api.get('/analytics/demand-trends'),
    getSummary: () => api.get('/analytics/summary')
};

// Point-Based Incentives (Epic 5)
// Tracks and awards points for attendance and off-peak slot booking.
export const incentivesAPI = {
    // User endpoints
    getMyPoints: () => api.get('/incentives/my-points'),
    getHistory: () => api.get('/incentives/my-history'),
    getStatus: () => api.get('/incentives/status'),

    // Admin endpoints
    getRules: () => api.get('/incentives/rules'),
    createRule: (data) => api.post('/incentives/rules', data),
    updateRule: (id, data) => api.put(`/incentives/rules/${id}`, data),
    deleteRule: (id) => api.delete(`/incentives/rules/${id}`),
    getAbuseReport: () => api.get('/incentives/abuse-report'),
    getBehaviorTrends: (days = 30) => api.get(`/incentives/behavior-trends?days=${days}`),
    applyToSlots: () => api.post('/incentives/apply-to-slots')
};

// Addon Redemptions (Epic 5)
export const addonsAPI = {
    // User endpoints
    getAll: () => api.get('/addons'),
    redeem: (id) => api.post(`/addons/${id}/redeem`),
    getMyRedemptions: () => api.get('/addons/my-redemptions'),

    // Admin endpoints
    create: (data) => api.post('/addons', data),
    update: (id, data) => api.put(`/addons/${id}`, data),
    delete: (id) => api.delete(`/addons/${id}`),
    claim: (code) => api.post('/addons/claim', { code })
};

// Operating Hours Configuration (US-AM-4)
export const operatingHoursAPI = {
    getAll: () => api.get('/operating-hours'),
    update: (id, data) => api.put(`/operating-hours/${id}`, data)
};

// System Health Monitoring (US-AM-5)
export const systemAPI = {
    getHealth: () => api.get('/health'),
    getSettings: () => api.get('/system/settings'),
    updateSettings: (data) => api.put('/system/settings', data)
};

export default api;
