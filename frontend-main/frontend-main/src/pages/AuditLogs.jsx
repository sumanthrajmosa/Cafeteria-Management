import { useState, useEffect, useCallback } from 'react';
import { auditAPI } from '../services/api';

const ACTION_LABEL = {
    LOGIN_SUCCESS: 'Login Success',
    LOGIN_FAILED: 'Login Failed',
    LOGIN_TOTP_REQUIRED: 'Login - OTP Required',
    LOGIN_TOTP_FAILED: 'Login - OTP Failed',
    REGISTER: 'Register',
    TOTP_ENABLED: '2FA Enabled',
    TOTP_DISABLED: '2FA Disabled',
    TOTP_SETUP_INITIATED: '2FA Setup Started',
    TOTP_CONFIRM_FAILED: '2FA Confirm Failed',
    TOTP_DISABLE_FAILED: '2FA Disable Failed',
    TOTP_FIRST_SETUP_INITIATED: '2FA First Setup',
    TOTP_FIRST_CONFIRM_FAILED: '2FA First Confirm Failed',
};

const ACTION_COLOR = {
    LOGIN_SUCCESS: '#16a34a',
    LOGIN_FAILED: '#dc2626',
    LOGIN_TOTP_REQUIRED: '#ca8a04',
    LOGIN_TOTP_FAILED: '#dc2626',
    REGISTER: '#2563eb',
    TOTP_ENABLED: '#7c3aed',
    TOTP_DISABLED: '#6b7280',
    TOTP_SETUP_INITIATED: '#7c3aed',
    TOTP_CONFIRM_FAILED: '#dc2626',
    TOTP_DISABLE_FAILED: '#dc2626',
    TOTP_FIRST_SETUP_INITIATED: '#7c3aed',
    TOTP_FIRST_CONFIRM_FAILED: '#dc2626',
};

const ACTIONS = [
    '', 'LOGIN_SUCCESS', 'LOGIN_FAILED', 'LOGIN_TOTP_REQUIRED', 'LOGIN_TOTP_FAILED',
    'REGISTER', 'TOTP_ENABLED', 'TOTP_DISABLED', 'TOTP_SETUP_INITIATED',
    'TOTP_CONFIRM_FAILED', 'TOTP_DISABLE_FAILED',
];

function AuditLogs() {
    const [logs, setLogs] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ action: '', email: '', success: '', from: '', to: '' });
    const [applied, setApplied] = useState({});

    const fetchLogs = useCallback(async (activeFilters = {}) => {
        setLoading(true);
        try {
            const params = {};
            Object.entries(activeFilters).forEach(([k, v]) => { if (v !== '') params[k] = v; });
            const res = await auditAPI.getLogs(params);
            setLogs(res.data.logs || []);
            setTotal(res.data.total || 0);
        } catch {
            setLogs([]);
        }
        setLoading(false);
    }, []);

    useEffect(() => { fetchLogs(); }, [fetchLogs]);

    const handleApply = (e) => {
        e.preventDefault();
        setApplied(filters);
        fetchLogs(filters);
    };

    const handleReset = () => {
        const empty = { action: '', email: '', success: '', from: '', to: '' };
        setFilters(empty);
        setApplied({});
        fetchLogs({});
    };

    const formatDate = (dateStr) => {
        const d = new Date(dateStr);
        return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
    };

    const parseDetails = (details) => {
        try {
            const obj = JSON.parse(details);
            return Object.entries(obj).map(([k, v]) => `${k}: ${v}`).join('  |  ');
        } catch {
            return details || '-';
        }
    };

    return (
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>Audit Logs</h1>
                    <p className="text-muted text-sm">{total} entries recorded</p>
                </div>
                <button className="btn btn-ghost" onClick={() => fetchLogs(applied)} disabled={loading}>
                    {loading ? 'Loading...' : 'Refresh'}
                </button>
            </div>

            {/* Filters */}
            <form onSubmit={handleApply} style={{
                display: 'flex', flexWrap: 'wrap', gap: '0.75rem',
                padding: '1rem 1.25rem', background: 'var(--gray-50)',
                borderRadius: 'var(--radius-md)', marginBottom: '1.5rem',
                border: '1px solid var(--border)'
            }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: '1 1 160px' }}>
                    <label className="text-xs text-muted" style={{ fontWeight: 600 }}>Action</label>
                    <select className="form-input" style={{ padding: '0.4rem 0.6rem' }}
                        value={filters.action}
                        onChange={e => setFilters(f => ({ ...f, action: e.target.value }))}>
                        {ACTIONS.map(a => (
                            <option key={a} value={a}>{a ? (ACTION_LABEL[a] || a) : 'All actions'}</option>
                        ))}
                    </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: '1 1 200px' }}>
                    <label className="text-xs text-muted" style={{ fontWeight: 600 }}>Email</label>
                    <input className="form-input" style={{ padding: '0.4rem 0.6rem' }}
                        placeholder="Search by email..." value={filters.email}
                        onChange={e => setFilters(f => ({ ...f, email: e.target.value }))} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: '1 1 130px' }}>
                    <label className="text-xs text-muted" style={{ fontWeight: 600 }}>Result</label>
                    <select className="form-input" style={{ padding: '0.4rem 0.6rem' }}
                        value={filters.success}
                        onChange={e => setFilters(f => ({ ...f, success: e.target.value }))}>
                        <option value="">All</option>
                        <option value="true">Success</option>
                        <option value="false">Failed</option>
                    </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: '1 1 150px' }}>
                    <label className="text-xs text-muted" style={{ fontWeight: 600 }}>From</label>
                    <input type="date" className="form-input" style={{ padding: '0.4rem 0.6rem' }}
                        value={filters.from} onChange={e => setFilters(f => ({ ...f, from: e.target.value }))} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: '1 1 150px' }}>
                    <label className="text-xs text-muted" style={{ fontWeight: 600 }}>To</label>
                    <input type="date" className="form-input" style={{ padding: '0.4rem 0.6rem' }}
                        value={filters.to} onChange={e => setFilters(f => ({ ...f, to: e.target.value }))} />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
                    <button type="submit" className="btn btn-primary" style={{ padding: '0.45rem 1rem' }}>Apply</button>
                    <button type="button" className="btn btn-ghost" style={{ padding: '0.45rem 0.8rem' }} onClick={handleReset}>Reset</button>
                </div>
            </form>

            {/* Table */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--gray-400)' }}>Loading...</div>
            ) : logs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--gray-400)' }}>No audit log entries found.</div>
            ) : (
                <div style={{ overflowX: 'auto', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                        <thead>
                            <tr style={{ background: 'var(--gray-50)', textAlign: 'left' }}>
                                {['Timestamp', 'Action', 'User', 'IP Address', 'Details', 'Result'].map(h => (
                                    <th key={h} style={{ padding: '0.75rem 1rem', fontWeight: 600, color: 'var(--gray-600)', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map((log, i) => (
                                <tr key={log.id} style={{ background: i % 2 === 0 ? 'transparent' : 'var(--gray-50)' }}>
                                    <td style={{ padding: '0.6rem 1rem', whiteSpace: 'nowrap', color: 'var(--gray-500)' }}>
                                        {formatDate(log.createdAt)}
                                    </td>
                                    <td style={{ padding: '0.6rem 1rem', whiteSpace: 'nowrap' }}>
                                        <span style={{
                                            display: 'inline-block',
                                            padding: '0.2rem 0.6rem',
                                            borderRadius: 999,
                                            background: (ACTION_COLOR[log.action] || '#6b7280') + '18',
                                            color: ACTION_COLOR[log.action] || '#6b7280',
                                            fontWeight: 600,
                                            fontSize: '0.78rem'
                                        }}>
                                            {ACTION_LABEL[log.action] || log.action}
                                        </span>
                                    </td>
                                    <td style={{ padding: '0.6rem 1rem', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {log.userEmail || <span className="text-muted">anonymous</span>}
                                    </td>
                                    <td style={{ padding: '0.6rem 1rem', color: 'var(--gray-500)', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                                        {log.ipAddress || '-'}
                                    </td>
                                    <td style={{ padding: '0.6rem 1rem', color: 'var(--gray-500)', maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {parseDetails(log.details)}
                                    </td>
                                    <td style={{ padding: '0.6rem 1rem' }}>
                                        <span style={{
                                            padding: '0.15rem 0.5rem', borderRadius: 999, fontSize: '0.75rem', fontWeight: 600,
                                            background: log.success ? '#dcfce7' : '#fee2e2',
                                            color: log.success ? '#16a34a' : '#dc2626'
                                        }}>
                                            {log.success ? 'OK' : 'FAIL'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default AuditLogs;
