import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const STEP_PASSWORD = 'password';
const STEP_SETUP = 'setup';    // mandatory first-time 2FA enrollment
const STEP_OTP = 'otp';      // returning user OTP verification

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [code, setCode] = useState('');
    const [tempToken, setTempToken] = useState('');
    const [qrCode, setQrCode] = useState('');
    const [secret, setSecret] = useState('');
    const [step, setStep] = useState(STEP_PASSWORD);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login, verifyTotp, firstSetupTotp, firstConfirmTotp } = useAuth();
    const { theme, toggleTheme } = useTheme();

    // Step 1 — password
    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const result = await login(email, password);

        if (result.totpSetupRequired) {
            // Account exists but has never completed 2FA enrollment
            setTempToken(result.tempToken);
            const setup = await firstSetupTotp(result.tempToken);
            if (setup.success) {
                setQrCode(setup.qrCode);
                setSecret(setup.secret);
                setStep(STEP_SETUP);
            } else {
                setError(setup.error || 'Failed to start 2FA setup. Please try again.');
            }
        } else if (result.totpRequired) {
            setTempToken(result.tempToken);
            setStep(STEP_OTP);
        } else if (!result.success) {
            setError(result.error || 'Login failed');
        }

        setLoading(false);
    };

    // Step 2a — first-time TOTP enrollment confirmation
    const handleFirstConfirm = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const result = await firstConfirmTotp(tempToken, code);
        if (!result.success) {
            setError(result.error || 'Invalid code. Please try again.');
        }

        setLoading(false);
    };

    // Step 2b — OTP verification for accounts that already have 2FA
    const handleTotpSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const result = await verifyTotp(tempToken, code);
        if (!result.success) {
            setError(result.error || 'Invalid verification code');
        }

        setLoading(false);
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

                {/* ── Step 1: Password ── */}
                {step === STEP_PASSWORD && (
                    <>
                        <p className="login-subtitle">Sign in to your account</p>

                        {error && (
                            <div className="badge badge-error" style={{ width: '100%', justifyContent: 'center', padding: '0.75rem', marginBottom: '1rem' }}>
                                {error}
                            </div>
                        )}

                        <form onSubmit={handlePasswordSubmit}>
                            <div className="form-group">
                                <label className="form-label" htmlFor="email">Email</label>
                                <input id="email" type="email" className="form-input"
                                    value={email} onChange={e => setEmail(e.target.value)}
                                    placeholder="Enter your email" required />
                            </div>
                            <div className="form-group">
                                <label className="form-label" htmlFor="password">Password</label>
                                <input id="password" type="password" className="form-input"
                                    value={password} onChange={e => setPassword(e.target.value)}
                                    placeholder="Enter your password" required />
                            </div>
                            <button type="submit" className="btn btn-primary login-btn" disabled={loading}>
                                {loading ? 'Signing in...' : 'Sign In'}
                            </button>
                        </form>

                        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                            <p className="text-sm text-muted">
                                Don't have an account?{' '}
                                <Link to="/signup" style={{ color: 'var(--primary)', fontWeight: 600 }}>Sign Up</Link>
                            </p>
                            <p className="text-sm text-muted" style={{ marginTop: '0.5rem' }}>
                                <Link to="/forgot-password" style={{ color: 'var(--primary)', fontWeight: 600 }}>Forgot Password?</Link>
                            </p>
                        </div>

                        <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: 'var(--gray-50)', borderRadius: 'var(--radius-md)' }}>
                            <p className="text-sm text-muted" style={{ marginBottom: '0.5rem' }}>Demo credentials:</p>
                            <p className="text-xs">Admin: admin@cafeteria.com / admin123</p>
                            <p className="text-xs">Student: john.keller@university.edu / john123</p>
                            <p className="text-xs">Staff: staff@cafeteria.com / staff123</p>
                        </div>
                    </>
                )}

                {/* ── Step 2a: Mandatory 2FA enrolment (first-time) ── */}
                {step === STEP_SETUP && (
                    <>
                        <p className="login-subtitle">Set Up Two-Factor Authentication</p>

                        <div style={{
                            padding: '0.85rem 1rem',
                            background: 'rgba(220,38,38,0.07)',
                            border: '1px solid rgba(220,38,38,0.25)',
                            borderRadius: 'var(--radius-md)',
                            marginBottom: '1.25rem'
                        }}>
                            <p className="text-sm" style={{ margin: 0, lineHeight: 1.6, color: '#991b1b' }}>
                                <strong>Two-factor authentication is required</strong> for all accounts.
                                Scan the QR code below with Google Authenticator, Authy, or any TOTP app,
                                then enter the 6-digit code to complete sign-in.
                                You will not need to repeat this step on future logins.
                            </p>
                        </div>

                        {error && (
                            <div className="badge badge-error" style={{ width: '100%', justifyContent: 'center', padding: '0.75rem', marginBottom: '1rem' }}>
                                {error}
                            </div>
                        )}

                        {qrCode && (
                            <div style={{ display: 'flex', justifyContent: 'center', margin: '1rem 0' }}>
                                <img src={qrCode} alt="Two-factor authentication QR code"
                                    style={{ width: 200, height: 200, border: '4px solid white', borderRadius: 8, boxShadow: '0 4px 24px rgba(0,0,0,0.15)' }} />
                            </div>
                        )}

                        {secret && (
                            <div style={{ padding: '0.75rem 1rem', background: 'var(--gray-50)', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem' }}>
                                <p className="text-xs text-muted" style={{ marginBottom: 4 }}>Cannot scan? Enter this key manually in your app:</p>
                                <code style={{ fontSize: '0.88rem', letterSpacing: '0.12rem', wordBreak: 'break-all' }}>{secret}</code>
                            </div>
                        )}

                        <form onSubmit={handleFirstConfirm}>
                            <div className="form-group">
                                <label className="form-label" htmlFor="setupCode">Verification Code</label>
                                <input id="setupCode" type="text" inputMode="numeric" maxLength={6}
                                    className="form-input"
                                    value={code}
                                    onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
                                    placeholder="000000"
                                    style={{ letterSpacing: '0.5rem', fontSize: '1.5rem', textAlign: 'center' }}
                                    autoFocus required />
                            </div>
                            <button type="submit" className="btn btn-primary login-btn"
                                disabled={loading || code.length !== 6}>
                                {loading ? 'Verifying...' : 'Confirm and Sign In'}
                            </button>
                        </form>
                    </>
                )}

                {/* ── Step 2b: OTP for users with 2FA already configured ── */}
                {step === STEP_OTP && (
                    <>
                        <p className="login-subtitle">Two-Factor Authentication</p>
                        <p className="text-sm text-muted" style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
                            Enter the 6-digit code from your authenticator app.
                        </p>

                        {error && (
                            <div className="badge badge-error" style={{ width: '100%', justifyContent: 'center', padding: '0.75rem', marginBottom: '1rem' }}>
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleTotpSubmit}>
                            <div className="form-group">
                                <label className="form-label" htmlFor="totpCode">Verification Code</label>
                                <input id="totpCode" type="text" inputMode="numeric" maxLength={6}
                                    className="form-input"
                                    value={code}
                                    onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
                                    placeholder="000000"
                                    style={{ letterSpacing: '0.5rem', fontSize: '1.5rem', textAlign: 'center' }}
                                    autoFocus required />
                            </div>
                            <button type="submit" className="btn btn-primary login-btn"
                                disabled={loading || code.length !== 6}>
                                {loading ? 'Verifying...' : 'Sign In'}
                            </button>
                        </form>

                        <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                            <button className="btn btn-ghost text-sm"
                                onClick={() => { setStep(STEP_PASSWORD); setCode(''); setError(''); }}>
                                Back to login
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default Login;
