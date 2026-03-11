import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Link, useNavigate } from 'react-router-dom';

function Signup() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [studentId, setStudentId] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);

        const result = await register({ name, email, password, studentId, role: 'student' });

        if (!result.success) {
            setError(result.error);
            setLoading(false);
        } else {
            // Registration successful
            // If the register function logs the user in (which we implemented to do),
            // simply navigate to dashboard.
            // If not, navigate to login.
            // Based on our implementation, it logs in automatically if token is present.
            navigate('/dashboard');
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
                <p className="login-subtitle">Create your account</p>

                {error && (
                    <div className="badge badge-error" style={{
                        width: '100%',
                        justifyContent: 'center',
                        padding: '0.75rem',
                        marginBottom: '1rem'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label" htmlFor="name">Full Name</label>
                        <input
                            id="name"
                            type="text"
                            className="form-input"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter your full name"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="email">Email</label>
                        <input
                            id="email"
                            type="email"
                            className="form-input"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="studentId">Student ID</label>
                        <input
                            id="studentId"
                            type="text"
                            className="form-input"
                            value={studentId}
                            onChange={(e) => setStudentId(e.target.value)}
                            placeholder="e.g. STU001"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="password">Password</label>
                        <input
                            id="password"
                            type="password"
                            className="form-input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Create a password"
                            minLength={6}
                            required
                        />
                        <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                            Must be at least 6 characters
                        </small>
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="confirmPassword">Confirm Password</label>
                        <input
                            id="confirmPassword"
                            type="password"
                            className="form-input"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm your password"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary login-btn"
                        disabled={loading}
                    >
                        {loading ? 'Creating Account...' : 'Sign Up'}
                    </button>
                </form>

                <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                    <p className="text-sm text-muted">
                        Already have an account?{' '}
                        <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>
                            Sign In
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Signup;
