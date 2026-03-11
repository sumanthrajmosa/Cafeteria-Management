import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { authAPI, totpAPI } from '../services/api';

const AuthContext = createContext(null);

// Session configuration
const SESSION_TIMEOUT_MS = 15 * 60 * 1000;   // 15 minutes of inactivity
const WARNING_BEFORE_MS = 60 * 1000;          // Show warning 1 minute before logout

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sessionWarning, setSessionWarning] = useState(false);

    const timeoutRef = useRef(null);
    const warningRef = useRef(null);

    // --- Logout function (defined early so timer can use it) ---
    const logout = useCallback(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('lastActivity');
        setUser(null);
        setSessionWarning(false);
    }, []);

    // --- Session Timer Logic ---
    const clearTimers = useCallback(() => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        if (warningRef.current) clearTimeout(warningRef.current);
    }, []);

    const resetTimer = useCallback(() => {
        if (!user) return;

        clearTimers();
        setSessionWarning(false);
        localStorage.setItem('lastActivity', Date.now().toString());

        // Warning timer — fires 1 minute before auto-logout
        warningRef.current = setTimeout(() => {
            setSessionWarning(true);
        }, SESSION_TIMEOUT_MS - WARNING_BEFORE_MS);

        // Logout timer — fires after full inactivity period
        timeoutRef.current = setTimeout(() => {
            setSessionWarning(false);
            logout();
        }, SESSION_TIMEOUT_MS);
    }, [user, logout, clearTimers]);

    // --- Track user activity ---
    useEffect(() => {
        if (!user) return;

        const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove'];

        // Throttle: only reset timer once per 30 seconds to avoid performance issues
        let lastReset = Date.now();
        const handleActivity = () => {
            if (Date.now() - lastReset > 30000) {
                lastReset = Date.now();
                resetTimer();
            }
        };

        activityEvents.forEach(event =>
            window.addEventListener(event, handleActivity, { passive: true })
        );

        // Start the initial timer
        resetTimer();

        // Check if session expired while tab was inactive (e.g., laptop sleep)
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && user) {
                const lastActivity = parseInt(localStorage.getItem('lastActivity') || '0');
                if (Date.now() - lastActivity > SESSION_TIMEOUT_MS) {
                    logout();
                } else {
                    resetTimer();
                }
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            activityEvents.forEach(event =>
                window.removeEventListener(event, handleActivity)
            );
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            clearTimers();
        };
    }, [user, resetTimer, logout, clearTimers]);

    // --- Initial load ---
    useEffect(() => {
        const token = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');
        const lastActivity = parseInt(localStorage.getItem('lastActivity') || '0');

        if (token && savedUser) {
            // Check if session has expired since last visit
            if (lastActivity && Date.now() - lastActivity > SESSION_TIMEOUT_MS) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                localStorage.removeItem('lastActivity');
            } else {
                setUser(JSON.parse(savedUser));
            }
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        try {
            const response = await authAPI.login({ email, password });
            const data = response.data;

            if (data.totp_setup_required) {
                return { success: false, totpSetupRequired: true, tempToken: data.temp_token };
            }
            if (data.totp_required) {
                return { success: false, totpRequired: true, tempToken: data.temp_token };
            }

            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data));
            localStorage.setItem('lastActivity', Date.now().toString());
            setUser(data);
            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || error.response?.data?.message || 'Login failed'
            };
        }
    };

    const firstSetupTotp = async (tempToken) => {
        try {
            const response = await totpAPI.firstSetup(tempToken);
            return { success: true, qrCode: response.data.qrCode, secret: response.data.secret };
        } catch (error) {
            return { success: false, error: error.response?.data?.error || 'Failed to initiate 2FA setup' };
        }
    };

    const firstConfirmTotp = async (tempToken, code) => {
        try {
            const response = await totpAPI.firstConfirm(tempToken, code);
            const data = response.data;
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data));
            localStorage.setItem('lastActivity', Date.now().toString());
            setUser(data);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.response?.data?.error || 'Invalid OTP code' };
        }
    };

    const verifyTotp = async (tempToken, code) => {
        try {
            const response = await authAPI.verifyTotp(tempToken, code);
            const data = response.data;

            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data));
            localStorage.setItem('lastActivity', Date.now().toString());
            setUser(data);
            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || 'Invalid OTP code'
            };
        }
    };

    const register = async (userData) => {
        try {
            const response = await authAPI.register(userData);
            const data = response.data;

            if (data.token) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data));
                localStorage.setItem('lastActivity', Date.now().toString());
                setUser(data);
            }

            return { success: true, data };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || error.response?.data?.message || 'Registration failed'
            };
        }
    };

    const extendSession = () => {
        resetTimer();
    };

    const value = {
        user,
        login,
        verifyTotp,
        firstSetupTotp,
        firstConfirmTotp,
        register,
        logout,
        extendSession,
        loading,
        sessionWarning,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        isStaff: user?.role === 'staff',
        isStudent: user?.role === 'student'
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
