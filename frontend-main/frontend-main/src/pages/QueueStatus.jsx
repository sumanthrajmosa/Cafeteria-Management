import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { queueAPI } from '../services/api';

function QueueStatus() {
    const { isAdmin, isStaff } = useAuth();
    const [queueStatus, setQueueStatus] = useState(null);
    const [myToken, setMyToken] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadQueueData();
        const interval = setInterval(loadQueueData, 10000); // Refresh every 10 seconds
        return () => clearInterval(interval);
    }, []);

    const loadQueueData = async () => {
        try {
            const [statusRes, tokenRes] = await Promise.all([
                queueAPI.getStatus(),
                queueAPI.getMyToken()
            ]);
            setQueueStatus(statusRes.data);
            setMyToken(tokenRes.data);
        } catch (error) {
            console.error('Error loading queue:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCallNext = async () => {
        try {
            await queueAPI.callNext(1);
            loadQueueData();
        } catch (error) {
            console.error('Error calling next:', error);
        }
    };

    const handleServe = async (id) => {
        try {
            await queueAPI.serve(id);
            loadQueueData();
        } catch (error) {
            console.error('Error serving:', error);
        }
    };

    if (loading) {
        return <div className="text-center">Loading queue status...</div>;
    }

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Queue Status</h1>
                <p className="page-subtitle">Real-time queue information</p>
            </div>

            {/* Current Status */}
            <div className="dashboard-grid">
                <div className="stat-card">
                    <div className="stat-card-label">Currently Serving</div>
                    <div className="stat-card-value primary">
                        {queueStatus?.currentlyServing?.tokenNumber || '--'}
                    </div>
                    <div className="stat-card-subtext">Counter 1</div>
                </div>

                <div className="stat-card">
                    <div className="stat-card-label">In Queue</div>
                    <div className="stat-card-value">{queueStatus?.waitingCount || 0}</div>
                    <div className="stat-card-subtext">Tokens waiting</div>
                </div>

                <div className="stat-card">
                    <div className="stat-card-label">Avg Wait Time</div>
                    <div className="stat-card-value">{queueStatus?.avgWaitTime || 0}</div>
                    <div className="stat-card-subtext">Minutes</div>
                </div>

                {!isAdmin && (
                    <div className="stat-card">
                        <div className="stat-card-label">Your Token</div>
                        <div className="stat-card-value primary">
                            {myToken?.token?.tokenNumber || '--'}
                        </div>
                        <div className="stat-card-subtext">
                            {myToken?.token ? `Position: ${myToken.position}` : 'No active token'}
                        </div>
                    </div>
                )}
            </div>

            <div className="dashboard-grid-2">
                {/* Queue Display */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Queue</h3>
                        {(isAdmin || isStaff) && (
                            <button className="btn btn-primary btn-sm" onClick={handleCallNext}>
                                Call Next
                            </button>
                        )}
                    </div>

                    <div className="queue-list">
                        {queueStatus?.waitingTokens?.map((token, index) => (
                            <div
                                key={token._id}
                                className={`queue-item ${myToken?.token?._id === token._id ? 'current' : ''}`}
                            >
                                <div>
                                    <span className="queue-token">{token.tokenNumber}</span>
                                    {token.user?.name && (
                                        <span className="text-xs text-muted" style={{ marginLeft: '0.5rem' }}>
                                            {token.user.name}
                                        </span>
                                    )}
                                </div>
                                <span className="queue-wait">{token.estimatedWaitTime} min</span>
                            </div>
                        ))}
                        {(!queueStatus?.waitingTokens || queueStatus.waitingTokens.length === 0) && (
                            <p className="text-muted text-center" style={{ padding: '2rem' }}>
                                No tokens in queue
                            </p>
                        )}
                    </div>
                </div>

                {/* Recently Called */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Recently Called</h3>
                    </div>

                    <div className="queue-list">
                        {queueStatus?.recentlyCalled?.map(token => (
                            <div key={token._id} className="queue-item">
                                <div>
                                    <span className="queue-token">{token.tokenNumber}</span>
                                    <span className="badge badge-warning" style={{ marginLeft: '0.5rem' }}>
                                        Called
                                    </span>
                                </div>
                                {(isAdmin || isStaff) && (
                                    <button
                                        className="btn btn-sm btn-primary"
                                        onClick={() => handleServe(token._id)}
                                    >
                                        Mark Served
                                    </button>
                                )}
                            </div>
                        ))}
                        {(!queueStatus?.recentlyCalled || queueStatus.recentlyCalled.length === 0) && (
                            <p className="text-muted text-center" style={{ padding: '2rem' }}>
                                No recently called tokens
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Your Token Details (for students) */}
            {!isAdmin && myToken?.token && (
                <div className="card" style={{ marginTop: 'var(--spacing-lg)' }}>
                    <div className="card-header">
                        <h3 className="card-title">Your Token Details</h3>
                    </div>

                    <div className="dashboard-grid">
                        <div>
                            <div className="text-sm text-muted">Token Number</div>
                            <div className="font-bold text-primary" style={{ fontSize: '1.5rem' }}>
                                {myToken.token.tokenNumber}
                            </div>
                        </div>
                        <div>
                            <div className="text-sm text-muted">Position in Queue</div>
                            <div className="font-bold" style={{ fontSize: '1.5rem' }}>
                                {myToken.position}
                            </div>
                        </div>
                        <div>
                            <div className="text-sm text-muted">Estimated Wait</div>
                            <div className="font-bold" style={{ fontSize: '1.5rem' }}>
                                {myToken.estimatedWait} min
                            </div>
                        </div>
                        <div>
                            <div className="text-sm text-muted">Status</div>
                            <span className={`badge ${myToken.token.status === 'called' ? 'badge-success' :
                                myToken.token.status === 'waiting' ? 'badge-info' :
                                    'badge-neutral'
                                }`} style={{ fontSize: '1rem', padding: '0.5rem 1rem' }}>
                                {myToken.token.status}
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default QueueStatus;
