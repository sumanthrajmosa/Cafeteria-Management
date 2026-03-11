import { useState, useEffect } from 'react';
import { usersAPI } from '../services/api';

function Users() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('success');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const res = await usersAPI.getAll();
            setUsers(res.data || []);
        } catch (err) {
            console.error('Failed to fetch users:', err);
        } finally {
            setLoading(false);
        }
    };

    const showMessage = (text, type = 'success') => {
        setMessage(text);
        setMessageType(type);
        setTimeout(() => setMessage(''), 3000);
    };

    const handleBlock = async (id) => {
        if (!confirm('Are you sure you want to block this user?')) return;
        try {
            await usersAPI.block(id);
            showMessage('User blocked successfully');
            fetchUsers();
        } catch (err) {
            showMessage('Failed to block user', 'error');
        }
    };

    const handleUnblock = async (id) => {
        if (!confirm('Are you sure you want to unblock this user?')) return;
        try {
            await usersAPI.unblock(id);
            showMessage('User unblocked successfully');
            fetchUsers();
        } catch (err) {
            showMessage('Failed to unblock user', 'error');
        }
    };

    const handleRoleChange = async (id, newRole, currentRole) => {
        if (newRole === currentRole) return;
        const userName = users.find(u => u._id === id)?.name || 'this user';
        if (!confirm(`Change ${userName}'s role to ${newRole.toUpperCase()}?`)) return;
        try {
            await usersAPI.changeRole(id, newRole);
            showMessage(`Role updated to ${newRole}`);
            fetchUsers();
        } catch (err) {
            showMessage(err.response?.data?.error || 'Failed to change role', 'error');
        }
    };

    if (loading) return <div className="text-center">Loading...</div>;

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">User Management</h1>
                <p className="page-subtitle">Manage users, roles, and blocking status</p>
            </div>

            {message && (
                <div className={`badge ${messageType === 'error' ? 'badge-error' : 'badge-success'}`} style={{
                    width: '100%', justifyContent: 'center', padding: '0.75rem', marginBottom: '1rem'
                }}>
                    {message}
                </div>
            )}

            <div className="card">
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user._id}>
                                    <td>{user.name}</td>
                                    <td>{user.email}</td>
                                    <td>
                                        {user.role === 'admin' ? (
                                            <span className="badge badge-neutral">admin</span>
                                        ) : (
                                            <select
                                                value={user.role}
                                                onChange={(e) => handleRoleChange(user._id, e.target.value, user.role)}
                                                style={{
                                                    padding: '0.3rem 0.5rem',
                                                    borderRadius: '6px',
                                                    border: '1px solid var(--border-color)',
                                                    background: 'var(--bg-primary)',
                                                    color: 'var(--text-primary)',
                                                    fontSize: '0.85rem',
                                                    fontWeight: 600,
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                <option value="student">student</option>
                                                <option value="staff">staff</option>
                                                <option value="admin">admin</option>
                                            </select>
                                        )}
                                    </td>
                                    <td>
                                        {user.blocked ? (
                                            <span className="badge badge-error">Blocked</span>
                                        ) : (
                                            <span className="badge badge-success">Active</span>
                                        )}
                                    </td>
                                    <td>
                                        {user.role !== 'admin' && (
                                            user.blocked ? (
                                                <button className="btn btn-success btn-sm" onClick={() => handleUnblock(user._id)}>
                                                    Unblock
                                                </button>
                                            ) : (
                                                <button className="btn btn-error btn-sm" onClick={() => handleBlock(user._id)}>
                                                    Block
                                                </button>
                                            )
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default Users;
