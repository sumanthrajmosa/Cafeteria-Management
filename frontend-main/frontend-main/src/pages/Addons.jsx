import { useEffect, useState } from 'react';
import { addonsAPI, incentivesAPI } from '../services/api';
import '../styles/global.css';

function Addons() {
    const [addons, setAddons] = useState([]);
    const [redemptions, setRedemptions] = useState([]);
    const [points, setPoints] = useState(0);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [activeTab, setActiveTab] = useState('addons'); // 'addons' or 'history'

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [addonsRes, pointsRes, redemptionsRes] = await Promise.all([
                addonsAPI.getAll(),
                incentivesAPI.getMyPoints(),
                addonsAPI.getMyRedemptions()
            ]);
            setAddons(addonsRes.data || []);
            setPoints(pointsRes.data?.totalPoints || 0);
            setRedemptions(redemptionsRes.data || []);
        } catch (error) {
            console.error('Error loading data:', error);
            setMessage({ type: 'error', text: 'Failed to load addons' });
        } finally {
            setLoading(false);
        }
    };

    const handleRedeem = async (addon) => {
        if (points < addon.pointsCost) {
            setMessage({ type: 'error', text: 'Not enough points!' });
            return;
        }

        try {
            const res = await addonsAPI.redeem(addon.id);
            setMessage({
                type: 'success',
                text: `Redeemed ${addon.name}! Your code: ${res.data.redemption.code}`
            });
            setPoints(res.data.newBalance);
            loadData();
        } catch (error) {
            setMessage({
                type: 'error',
                text: error.response?.data?.error || 'Redemption failed'
            });
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString();
    };

    if (loading) {
        return <div className="text-center">Loading...</div>;
    }

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Free Add-ons</h1>
                <p className="page-subtitle">Redeem your points for free items</p>
            </div>

            {/* Points Balance */}
            <div className="stat-card" style={{ marginBottom: 'var(--spacing-xl)', maxWidth: '300px' }}>
                <div className="stat-card-label">Your Points</div>
                <div className="stat-card-value primary">{points}</div>
                <div className="stat-card-subtext">Available to spend</div>
            </div>

            {message.text && (
                <div className={`alert alert-${message.type}`} style={{ marginBottom: 'var(--spacing-lg)' }}>
                    {message.text}
                </div>
            )}

            {/* Tabs */}
            <div className="tabs" style={{ marginBottom: 'var(--spacing-lg)' }}>
                <button
                    className={`tab ${activeTab === 'addons' ? 'active' : ''}`}
                    onClick={() => setActiveTab('addons')}
                >
                    Available Add-ons
                </button>
                <button
                    className={`tab ${activeTab === 'history' ? 'active' : ''}`}
                    onClick={() => setActiveTab('history')}
                >
                    My Redemptions
                </button>
            </div>

            {activeTab === 'addons' && (
                <div className="menu-grid">
                    {addons.length === 0 ? (
                        <p className="text-muted">No add-ons available at the moment.</p>
                    ) : (
                        addons.map(addon => (
                            <div key={addon.id} className="card">
                                <div className="card-header">
                                    <h3 className="card-title">{addon.name}</h3>
                                    <span className="badge badge-primary">{addon.pointsCost} pts</span>
                                </div>
                                <div style={{ padding: 'var(--spacing-md)' }}>
                                    <p className="text-muted" style={{ marginBottom: 'var(--spacing-sm)' }}>
                                        {addon.description || 'Delicious free add-on!'}
                                    </p>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--gray-500)', marginBottom: 'var(--spacing-md)' }}>
                                        Category: {addon.category || 'General'}
                                    </p>
                                    <button
                                        className={`btn ${points >= addon.pointsCost ? 'btn-primary' : 'btn-secondary'}`}
                                        onClick={() => handleRedeem(addon)}
                                        disabled={points < addon.pointsCost}
                                        style={{ width: '100%' }}
                                    >
                                        {points >= addon.pointsCost ? 'Redeem Now' : 'Not Enough Points'}
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {activeTab === 'history' && (
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Redemption History</h3>
                    </div>
                    {redemptions.length === 0 ? (
                        <div style={{ padding: 'var(--spacing-lg)', textAlign: 'center' }}>
                            <p className="text-muted">No redemptions yet. Redeem an add-on to get started!</p>
                        </div>
                    ) : (
                        <div className="table-container" style={{ overflow: 'auto' }}>
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Add-on</th>
                                        <th>Points Spent</th>
                                        <th>Code</th>
                                        <th>Status</th>
                                        <th>Redeemed At</th>
                                        <th>Expires</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {redemptions.map(redemption => (
                                        <tr key={redemption.id}>
                                            <td className="font-bold">{redemption.addon?.name || 'Unknown'}</td>
                                            <td>{redemption.pointsSpent}</td>
                                            <td>
                                                <code style={{
                                                    background: 'var(--primary-100)',
                                                    color: 'var(--primary-700)',
                                                    padding: '0.25rem 0.5rem',
                                                    borderRadius: 'var(--radius-sm)',
                                                    fontWeight: '600',
                                                    letterSpacing: '0.1em'
                                                }}>
                                                    {redemption.code}
                                                </code>
                                            </td>
                                            <td>
                                                <span className={`status-badge status-${redemption.status}`}>
                                                    {redemption.status}
                                                </span>
                                            </td>
                                            <td>{formatDate(redemption.createdAt)}</td>
                                            <td>{formatDate(redemption.expiresAt)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Instructions */}
            <div className="card" style={{ marginTop: 'var(--spacing-xl)' }}>
                <div className="card-header">
                    <h3 className="card-title">How to Claim</h3>
                </div>
                <div style={{ padding: 'var(--spacing-lg)' }}>
                    <ol style={{ lineHeight: '1.8', paddingLeft: 'var(--spacing-lg)' }}>
                        <li>Redeem an add-on using your points</li>
                        <li>Show your redemption code to the staff at the counter</li>
                        <li>Staff will verify and mark it as claimed</li>
                        <li>Enjoy your free item!</li>
                    </ol>
                    <p className="text-muted" style={{ marginTop: 'var(--spacing-md)' }}>
                        Note: Redemption codes expire after 24 hours.
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Addons;
