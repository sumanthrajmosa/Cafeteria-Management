import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { addonsAPI, incentivesAPI } from '../services/api';

function AddonClaim() {
    const location = useLocation();
    const navigate = useNavigate();
    const [addons, setAddons] = useState([]);
    const [points, setPoints] = useState(0);
    const [loading, setLoading] = useState(true);
    const [claiming, setClaiming] = useState(false);
    const [claimedAddon, setClaimedAddon] = useState(null);
    const [error, setError] = useState('');

    // Get booking ID from URL params or location state
    const searchParams = new URLSearchParams(location.search);
    const bookingId = searchParams.get('bookingId') || location.state?.bookingId;

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [addonsRes, pointsRes] = await Promise.all([
                addonsAPI.getAll(),
                incentivesAPI.getMyPoints()
            ]);
            setAddons(addonsRes.data || []);
            setPoints(pointsRes.data?.totalPoints || 0);
        } catch (err) {
            console.error('Failed to load data:', err);
            setError('Failed to load addons');
        } finally {
            setLoading(false);
        }
    };

    const handleClaim = async (addonId) => {
        setClaiming(true);
        setError('');

        try {
            const response = await addonsAPI.redeem(addonId);
            setClaimedAddon(response.data.redemption);
            setPoints(response.data.newBalance);

            // Show success message
            setTimeout(() => {
                navigate('/dashboard');
            }, 5000);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to claim addon');
        } finally {
            setClaiming(false);
        }
    };

    const handleSkip = () => {
        navigate('/dashboard');
    };

    if (loading) {
        return <div className="text-center">Loading...</div>;
    }

    // Show redemption code if claimed
    if (claimedAddon) {
        return (
            <div>
                <div className="page-header">
                    <h1 className="page-title">Addon Claimed!</h1>
                    <p className="page-subtitle">Show this code to claim your addon</p>
                </div>

                <div className="card" style={{ maxWidth: '500px', margin: '0 auto' }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{
                            fontSize: '3rem',
                            fontWeight: 'bold',
                            color: 'var(--primary-500)',
                            letterSpacing: '0.5rem',
                            margin: '1rem 0'
                        }}>
                            {claimedAddon.code}
                        </div>

                        <div className="stat-card" style={{ marginTop: '2rem' }}>
                            <div className="stat-card-label">{claimedAddon.addon?.name}</div>
                            <div className="stat-card-value" style={{ color: 'var(--error-500)' }}>
                                -{claimedAddon.pointsSpent} pts
                            </div>
                            <div className="stat-card-subtext">Points spent</div>
                        </div>

                        <div className="stat-card" style={{ marginTop: '1rem' }}>
                            <div className="stat-card-label">New Balance</div>
                            <div className="stat-card-value primary">{points}</div>
                            <div className="stat-card-subtext">Points remaining</div>
                        </div>

                        <p className="text-muted" style={{ marginTop: '2rem', fontSize: '0.875rem' }}>
                            This code expires in 24 hours. Show it to the cafeteria staff to claim your addon.
                        </p>

                        <button
                            className="btn btn-primary"
                            style={{ width: '100%', marginTop: '2rem' }}
                            onClick={() => navigate('/dashboard')}
                        >
                            Go to Dashboard
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Show addons selection
    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Claim Free Addons</h1>
                <p className="page-subtitle">Use your points to get free extras!</p>
            </div>

            {error && (
                <div className="badge badge-error" style={{
                    width: '100%', justifyContent: 'center', padding: '0.75rem', marginBottom: '1rem'
                }}>
                    {error}
                </div>
            )}

            {/* Points Balance */}
            <div className="stat-card" style={{ marginBottom: '2rem' }}>
                <div className="stat-card-label">Your Points Balance</div>
                <div className="stat-card-value primary">{points}</div>
                <div className="stat-card-subtext">Available to spend</div>
            </div>

            {/* Skip Button */}
            <div style={{ textAlign: 'right', marginBottom: '1rem' }}>
                <button className="btn btn-secondary" onClick={handleSkip}>
                    Skip for Now
                </button>
            </div>

            {/* Available Addons */}
            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">Available Addons</h3>
                </div>

                {addons.length === 0 ? (
                    <p className="text-muted text-center">No addons available at the moment.</p>
                ) : (
                    <div className="menu-grid">
                        {addons.map(addon => {
                            const canAfford = points >= addon.pointsCost;
                            return (
                                <div
                                    key={addon._id}
                                    className="menu-item-card"
                                    style={{
                                        opacity: canAfford ? 1 : 0.6,
                                        position: 'relative'
                                    }}
                                >
                                    {addon.imageUrl && (
                                        <div style={{
                                            width: '100%',
                                            height: '120px',
                                            backgroundColor: 'var(--gray-100)',
                                            borderRadius: '0.5rem',
                                            marginBottom: '0.75rem',
                                            backgroundImage: `url(${addon.imageUrl})`,
                                            backgroundSize: 'cover',
                                            backgroundPosition: 'center'
                                        }} />
                                    )}

                                    <div className="menu-item-name">{addon.name}</div>

                                    {addon.description && (
                                        <div className="text-xs text-muted" style={{ marginBottom: '0.5rem' }}>
                                            {addon.description}
                                        </div>
                                    )}

                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        marginTop: '0.75rem'
                                    }}>
                                        <span className="badge badge-info">
                                            {addon.pointsCost} pts
                                        </span>

                                        <button
                                            className="btn btn-primary btn-sm"
                                            onClick={() => handleClaim(addon._id)}
                                            disabled={!canAfford || claiming}
                                        >
                                            {claiming ? 'Claiming...' : 'Claim'}
                                        </button>
                                    </div>

                                    {!canAfford && (
                                        <div style={{
                                            position: 'absolute',
                                            top: '0.5rem',
                                            right: '0.5rem',
                                            backgroundColor: 'var(--error-500)',
                                            color: 'white',
                                            padding: '0.25rem 0.5rem',
                                            borderRadius: '0.25rem',
                                            fontSize: '0.75rem',
                                            fontWeight: 'bold'
                                        }}>
                                            Need {addon.pointsCost - points} more pts
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Information Card */}
            <div className="card" style={{ marginTop: '2rem' }}>
                <div className="card-header">
                    <h3 className="card-title">How It Works</h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div className="queue-item">
                        <div>
                            <div className="font-bold">1. Choose an Addon</div>
                            <div className="text-xs text-muted">Select any addon you can afford with your points</div>
                        </div>
                    </div>
                    <div className="queue-item">
                        <div>
                            <div className="font-bold">2. Get Redemption Code</div>
                            <div className="text-xs text-muted">You'll receive a unique code valid for 24 hours</div>
                        </div>
                    </div>
                    <div className="queue-item">
                        <div>
                            <div className="font-bold">3. Show to Staff</div>
                            <div className="text-xs text-muted">Present your code to cafeteria staff to claim your addon</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AddonClaim;
