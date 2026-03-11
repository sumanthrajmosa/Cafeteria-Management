import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useTheme } from '../context/ThemeContext';

function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [resetToken, setResetToken] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [step, setStep] = useState('request'); // 'request' | 'reset' | 'done'
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { theme, toggleTheme } = useTheme();

    const handleRequestReset = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setLoading(true);

        try {
            const response = await authAPI.forgotPassword(email);
            const data = response.data;

            if (data.resetToken) {
                setResetToken(data.resetToken);
                setMessage('Reset token generated! Enter your new password below.');
                setStep('reset');
            } else {
                setMessage(data.message || 'If an account with that email exists, a reset token has been generated.');
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to process request. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);

        try {
            const response = await authAPI.resetPassword(resetToken, newPassword);
            setMessage(response.data.message || 'Password reset successfully!');
            setStep('done');
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to reset password. Token may have expired.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <button
                className="theme-toggle"
                onClick={toggleTheme}
                title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
                style={{ position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 10 }}
            >
                {theme === 'light' ? '🌙' : '☀️'}
            </button>

            <div className="login-card">
                <h1 className="login-title">Smart Cafeteria</h1>

                {/* Step 1: Request Reset */}
                {step === 'request' && (
                    <>
                        <p className="login-subtitle">Forgot Password</p>
                        <p className="text-sm text-muted" style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
                            Enter your registered email address to receive a password reset token.
                        </p>

                        {error && (
                            <div className="badge badge-error" style={{ width: '100%', justifyContent: 'center', padding: '0.75rem', marginBottom: '1rem' }}>
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleRequestReset}>
                            <div className="form-group">
                                <label className="form-label" htmlFor="email">Email Address</label>
                                <input id="email" type="email" className="form-input"
                                    value={email} onChange={e => setEmail(e.target.value)}
                                    placeholder="Enter your registered email" required autoFocus />
                            </div>
                            <button type="submit" className="btn btn-primary login-btn" disabled={loading}>
                                {loading ? 'Processing...' : 'Generate Reset Token'}
                            </button>
                        </form>

                        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                            <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '0.9rem' }}>
                                ← Back to Login
                            </Link>
                        </div>
                    </>
                )}

                {/* Step 2: Enter New Password */}
                {step === 'reset' && (
                    <>
                        <p className="login-subtitle">Reset Password</p>

                        {message && (
                            <div style={{
                                padding: '0.75rem 1rem',
                                background: 'rgba(16, 185, 129, 0.1)',
                                border: '1px solid rgba(16, 185, 129, 0.3)',
                                borderRadius: 'var(--radius-md)',
                                marginBottom: '1.25rem',
                                color: '#065f46',
                                fontSize: '0.88rem'
                            }}>
                                {message}
                            </div>
                        )}

                        {error && (
                            <div className="badge badge-error" style={{ width: '100%', justifyContent: 'center', padding: '0.75rem', marginBottom: '1rem' }}>
                                {error}
                            </div>
                        )}

                        <div style={{
                            padding: '0.75rem 1rem',
                            background: 'var(--gray-50)',
                            borderRadius: 'var(--radius-md)',
                            marginBottom: '1.25rem'
                        }}>
                            <p className="text-xs text-muted" style={{ marginBottom: 4 }}>Reset Token (auto-filled):</p>
                            <code style={{ fontSize: '0.75rem', wordBreak: 'break-all' }}>{resetToken}</code>
                        </div>

                        <form onSubmit={handleResetPassword}>
                            <div className="form-group">
                                <label className="form-label" htmlFor="newPassword">New Password</label>
                                <input id="newPassword" type="password" className="form-input"
                                    value={newPassword} onChange={e => setNewPassword(e.target.value)}
                                    placeholder="Minimum 6 characters" required autoFocus />
                            </div>
                            <div className="form-group">
                                <label className="form-label" htmlFor="confirmPassword">Confirm Password</label>
                                <input id="confirmPassword" type="password" className="form-input"
                                    value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                                    placeholder="Re-enter your new password" required />
                            </div>
                            <button type="submit" className="btn btn-primary login-btn" disabled={loading}>
                                {loading ? 'Resetting...' : 'Reset Password'}
                            </button>
                        </form>
                    </>
                )}

                {/* Step 3: Success */}
                {step === 'done' && (
                    <>
                        <p className="login-subtitle">Password Reset Complete</p>

                        <div style={{
                            padding: '1.5rem',
                            textAlign: 'center',
                            background: 'rgba(16, 185, 129, 0.08)',
                            borderRadius: 'var(--radius-md)',
                            marginBottom: '1.5rem'
                        }}>
                            <div style={{ fontSize: '1.5rem', marginBottom: '0.75rem', fontWeight: 700, color: '#10b981' }}>Password Updated</div>
                            <p style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                                {message}
                            </p>
                            <p className="text-sm text-muted">
                                You can now sign in with your new password.
                            </p>
                        </div>

                        <Link to="/login" className="btn btn-primary login-btn" style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}>
                            Go to Login
                        </Link>
                    </>
                )}
            </div>
        </div>
    );
}

export default ForgotPassword;
