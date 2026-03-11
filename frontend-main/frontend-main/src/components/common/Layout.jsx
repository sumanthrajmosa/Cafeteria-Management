import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useState, useEffect } from 'react';
import { queueAPI } from '../../services/api';

/* ────────────────────────────────────────────
   LIVE QUEUE VISUALISER
   Shows a counter box on the right, up to 3
   person-tokens walking toward it, and a +N
   stacked chip for overflow.
──────────────────────────────────────────── */
function QueueVisualiser() {
    const { user } = useAuth();
    const [queueStatus, setQueueStatus] = useState(null);
    const [myToken, setMyToken] = useState(null);

    const load = async () => {
        try {
            const [sq, mt] = await Promise.all([
                queueAPI.getStatus(),
                queueAPI.getMyToken()
            ]);
            setQueueStatus(sq.data);
            setMyToken(mt.data);
        } catch { /* silent – widget is non-critical */ }
    };

    useEffect(() => {
        load();
        const id = setInterval(load, 10000);
        return () => clearInterval(id);
    }, []);

    const waiting = queueStatus?.waitingTokens ?? [];
    const serving = queueStatus?.currentlyServing;
    const visible = waiting.slice(0, 3);        // max 3 persons shown
    const overflow = waiting.length - 3;          // remaining count
    const myId = myToken?.token?._id;

    /* SVG person icon with token badge */
    const Person = ({ token, isMe, index }) => (
        <div
            title={`Token #${token.tokenNumber}${isMe ? ' (You)' : ''}`}
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '3px',
                animation: `qBob ${1.2 + index * 0.2}s ease-in-out infinite alternate`,
                cursor: 'default',
                flexShrink: 0,
            }}
        >
            {/* Person silhouette */}
            <svg width="28" height="36" viewBox="0 0 28 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Head */}
                <circle cx="14" cy="8" r="6"
                    fill={isMe ? '#f59e0b' : '#c41e5c'}
                    stroke={isMe ? '#d97706' : '#9d174d'}
                    strokeWidth="1.5"
                />
                {/* Body */}
                <path d="M4 30 C4 20 8 16 14 16 C20 16 24 20 24 30"
                    fill={isMe ? '#fef3c7' : '#fce7f3'}
                    stroke={isMe ? '#f59e0b' : '#c41e5c'}
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                />
            </svg>
            {/* Token badge */}
            <span style={{
                background: isMe ? '#f59e0b' : '#c41e5c',
                color: '#fff',
                fontSize: '9px',
                fontWeight: 700,
                borderRadius: '999px',
                padding: '1px 6px',
                letterSpacing: '0.3px',
                minWidth: '20px',
                textAlign: 'center'
            }}>
                #{token.tokenNumber}
            </span>
        </div>
    );

    return (
        <div style={{
            background: 'var(--white)',
            borderRadius: 'var(--radius-lg)',
            border: '1.5px solid var(--gray-200)',
            boxShadow: 'var(--shadow-md)',
            padding: '14px 12px 10px',
            marginTop: '10px',
        }}>
            {/* Title row */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '10px',
            }}>
                <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    color: 'var(--gray-500)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.6px',
                }}>
                    🔴 Live Queue
                </span>
                <span style={{
                    fontSize: '0.68rem',
                    color: 'var(--gray-400)',
                    fontWeight: 500,
                }}>
                    {waiting.length} waiting
                </span>
            </div>

            {/* Scene: [overflow] [persons…] → [counter] */}
            <div style={{
                display: 'flex',
                alignItems: 'flex-end',
                gap: '4px',
                position: 'relative',
            }}>

                {/* Overflow stack chip */}
                {overflow > 0 && (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '2px',
                        flexShrink: 0,
                    }}>
                        {/* stacked small squares */}
                        {[2, 1, 0].map(i => (
                            <div key={i} style={{
                                width: '18px',
                                height: '10px',
                                background: i === 0 ? '#c41e5c' : i === 1 ? '#e879a8' : '#f9a8d4',
                                borderRadius: '3px',
                                marginTop: i === 0 ? 0 : '-6px',
                                border: '1px solid rgba(255,255,255,0.6)',
                            }} />
                        ))}
                        <span style={{
                            fontSize: '9px',
                            fontWeight: 700,
                            color: '#9d174d',
                            marginTop: '2px',
                        }}>+{overflow}</span>
                    </div>
                )}

                {/* Arrow / queue path */}
                <div style={{
                    flex: 1,
                    height: '2px',
                    background: 'linear-gradient(90deg, var(--gray-200), var(--primary-300))',
                    borderRadius: '1px',
                    alignSelf: 'center',
                    minWidth: '8px',
                }} />

                {/* Visible person-tokens (closest to counter on right) */}
                {[...visible].reverse().map((token, i) => (
                    <Person
                        key={token._id}
                        token={token}
                        isMe={token._id === myId}
                        index={i}
                    />
                ))}

                {/* Arrow to counter */}
                <div style={{
                    alignSelf: 'center',
                    fontSize: '14px',
                    color: 'var(--primary-400)',
                    flexShrink: 0,
                    lineHeight: 1,
                }}>→</div>

                {/* Counter box */}
                <div style={{
                    flexShrink: 0,
                    background: 'linear-gradient(135deg, #c41e5c 0%, #9d174d 100%)',
                    borderRadius: '10px',
                    padding: '8px 10px',
                    textAlign: 'center',
                    minWidth: '52px',
                    boxShadow: '0 4px 10px rgba(196,30,92,0.35)',
                    position: 'relative',
                }}>
                    {/* Window slits */}
                    <div style={{ display: 'flex', gap: '3px', justifyContent: 'center', marginBottom: '4px' }}>
                        {[0, 1, 2].map(i => (
                            <div key={i} style={{
                                width: '8px', height: '3px',
                                background: 'rgba(255,255,255,0.35)',
                                borderRadius: '1px',
                            }} />
                        ))}
                    </div>
                    <div style={{
                        fontSize: '0.65rem',
                        color: 'rgba(255,255,255,0.75)',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.4px',
                        marginBottom: '2px',
                    }}>Counter</div>
                    <div style={{
                        fontSize: '1rem',
                        fontWeight: 800,
                        color: '#fff',
                        lineHeight: 1,
                    }}>
                        {serving?.tokenNumber ?? '--'}
                    </div>
                    {/* Status dot */}
                    <div style={{
                        width: '7px', height: '7px',
                        borderRadius: '50%',
                        background: serving ? '#4ade80' : '#94a3b8',
                        position: 'absolute',
                        top: '7px', right: '7px',
                        boxShadow: serving ? '0 0 5px #4ade80' : 'none',
                    }} />
                </div>
            </div>

            {/* Empty state */}
            {waiting.length === 0 && !serving && (
                <p style={{
                    fontSize: '0.72rem',
                    color: 'var(--gray-400)',
                    textAlign: 'center',
                    marginTop: '6px',
                }}>No one in queue</p>
            )}

            {/* My token highlight */}
            {myToken?.token && (
                <div style={{
                    marginTop: '10px',
                    background: 'var(--warning-light)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '5px 8px',
                    fontSize: '0.72rem',
                    color: '#92400e',
                    fontWeight: 600,
                    display: 'flex',
                    justifyContent: 'space-between',
                }}>
                    <span>Your token</span>
                    <span>#{myToken.token.tokenNumber} — pos {myToken.position}</span>
                </div>
            )}

            <style>{`
                @keyframes qBob {
                    from { transform: translateY(0px); }
                    to   { transform: translateY(-4px); }
                }
            `}</style>
        </div>
    );
}

/* ────────────────────────────────────────────
   LAYOUT
──────────────────────────────────────────── */
function Layout({ children }) {
    const { user, logout, isAdmin, isStaff, isStudent, sessionWarning, extendSession } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    let mainLinks = [];
    let mgmtLinks = [];

    if (isAdmin) {
        mainLinks = [
            { path: '/admin', label: 'Dashboard' },
            { path: '/queue', label: 'Queue' },
            { path: '/menu', label: 'Menu' }
        ];
        mgmtLinks = [
            { path: '/admin/slots', label: 'Slots' },
            { path: '/forecast', label: 'Forecast' },
            { path: '/analytics', label: 'Analytics' },
            { path: '/admin/incentives', label: 'Incentives' },
            { path: '/admin/audit-logs', label: 'Audit Logs' },
            { path: '/security', label: 'Security' },
            { path: '/ethics', label: 'Ethics & Rules' },
            { path: '/admin/users', label: 'Users' }
        ];
    } else if (isStaff) {
        mainLinks = [
            { path: '/staff', label: 'Dashboard' },
            { path: '/queue', label: 'Queue' },
            { path: '/menu', label: 'Menu' },
            { path: '/staff/forecast', label: 'Forecast' },
            { path: '/security', label: 'Security' },
            { path: '/ethics', label: 'Ethics & Rules' }
        ];
    } else if (isStudent) {
        mainLinks = [
            { path: '/dashboard', label: 'Dashboard' },
            { path: '/booking', label: 'Book Meal' },
            { path: '/queue', label: 'Queue Status' },
            { path: '/menu', label: 'Menu' },
            { path: '/incentives', label: 'Rewards' },
            { path: '/addons', label: 'Free Add-ons' },
            { path: '/security', label: 'Security' },
            { path: '/ethics', label: 'Ethics & Rules' }
        ];
    }

    return (
        <div className="app-container">
            {/* ── TOP HEADER ── */}
            <header className="header">
                <div className="header-logo">Smart Cafeteria</div>

                <nav className="header-nav">
                    {mainLinks.map(link => (
                        <NavLink
                            key={link.path}
                            to={link.path}
                            className={({ isActive }) => isActive ? 'active' : ''}
                        >
                            {link.label}
                        </NavLink>
                    ))}

                    {mgmtLinks.length > 0 && (
                        <div className="nav-dropdown">
                            <button className="nav-dropdown-btn">Management ▾</button>
                            <div className="nav-dropdown-content">
                                {mgmtLinks.map(link => (
                                    <NavLink
                                        key={link.path}
                                        to={link.path}
                                        className={({ isActive }) => isActive ? 'active' : ''}
                                    >
                                        {link.label}
                                    </NavLink>
                                ))}
                            </div>
                        </div>
                    )}
                </nav>

                <div className="header-user">
                    <button
                        className="theme-toggle"
                        onClick={toggleTheme}
                        title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
                    >
                        {theme === 'light' ? '🌙' : '☀️'}
                    </button>
                    <div className="header-user-info">
                        <div className="header-user-name">{user?.name}</div>
                        <div className="header-user-role">{user?.role?.toUpperCase()}</div>
                    </div>
                    <button className="btn btn-secondary btn-sm" onClick={handleLogout}>
                        Logout
                    </button>
                </div>
            </header>

            {/* ── SESSION WARNING ── */}
            {sessionWarning && (
                <div style={{
                    background: 'linear-gradient(90deg, #f59e0b, #d97706)',
                    color: '#fff',
                    padding: '0.75rem 1.5rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.9rem',
                    fontWeight: 500,
                    zIndex: 1000
                }}>
                    <span>Your session will expire in less than 1 minute due to inactivity.</span>
                    <button
                        onClick={extendSession}
                        style={{
                            background: '#fff',
                            color: '#d97706',
                            border: 'none',
                            padding: '0.4rem 1rem',
                            borderRadius: '6px',
                            fontWeight: 600,
                            cursor: 'pointer'
                        }}
                    >
                        Stay Logged In
                    </button>
                </div>
            )}

            {/* ── BODY: main content + right queue sidebar ── */}
            <div style={{
                display: 'flex',
                flex: 1,
                gap: '0',
                alignItems: 'flex-start',
                maxWidth: '1500px',
                margin: '0 auto',
                width: '100%',
            }}>
                {/* Page content */}
                <main className="main-content" style={{ flex: 1, minWidth: 0 }}>
                    {children}
                </main>

                {/* Right queue panel */}
                <aside style={{
                    width: '200px',
                    flexShrink: 0,
                    padding: '0.5rem 1rem 1.5rem 0',
                    position: 'sticky',
                    top: 0,
                    maxHeight: '100vh',
                    overflowY: 'auto',
                }}>
                    {/* Queue visualiser – no profile card */}
                    <QueueVisualiser />
                </aside>
            </div>
        </div>
    );
}

export default Layout;
