import { useEffect, useState } from 'react';
import { queueAPI, menuAPI, bookingsAPI } from '../services/api';

function StaffDashboard() {
    const [queueStatus, setQueueStatus] = useState(null);
    const [menuItems, setMenuItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        loadData();
        const interval = setInterval(loadQueue, 8000);
        return () => clearInterval(interval);
    }, []);

    const loadData = async () => {
        try {
            const [queueRes, menuRes] = await Promise.all([
                queueAPI.getStatus(),
                menuAPI.getAll()
            ]);
            setQueueStatus(queueRes.data);
            setMenuItems(menuRes.data);
        } catch (error) {
            console.error('Error loading staff data:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadQueue = async () => {
        try {
            const res = await queueAPI.getStatus();
            setQueueStatus(res.data);
        } catch (error) {
            console.error('Error refreshing queue:', error);
        }
    };

    const callNext = async () => {
        try {
            setProcessing(true);
            await queueAPI.callNext(1);
            await loadQueue();
        } catch (error) {
            console.error('Error calling next token:', error);
            alert(error.response?.data?.error || 'Failed to call next token');
        } finally {
            setProcessing(false);
        }
    };

    const markServed = async (tokenId) => {
        try {
            setProcessing(true);
            await queueAPI.serve(tokenId);
            await loadQueue();
        } catch (error) {
            console.error('Error marking served:', error);
        } finally {
            setProcessing(false);
        }
    };

    const markNoShow = async (bookingId) => {
        if (!confirm('Mark this booking as no-show? This will apply a -10 point penalty.')) {
            return;
        }
        try {
            setProcessing(true);
            await bookingsAPI.update(bookingId, { status: 'no-show' });
            await loadQueue();
        } catch (error) {
            console.error('Error marking no-show:', error);
            alert(error.response?.data?.error || 'Failed to mark as no-show');
        } finally {
            setProcessing(false);
        }
    };

    const toggleAvailability = async (item) => {
        try {
            await menuAPI.toggleAvailability(item.id, !item.available);
            setMenuItems(prev =>
                prev.map(i =>
                    i.id === item.id ? { ...i, available: !i.available } : i
                )
            );
        } catch (error) {
            console.error('Error updating menu availability:', error);
        }
    };

    if (loading) {
        return <div className="text-center">Loading staff dashboard...</div>;
    }

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Staff Dashboard</h1>
                <p className="page-subtitle">Service control & menu availability</p>
            </div>

            {/* CURRENT QUEUE STATUS */}
            <div className="dashboard-grid">
                <div className="stat-card">
                    <div className="stat-card-label">Currently Serving</div>
                    <div className="stat-card-value primary">
                        {queueStatus?.currentlyServing?.tokenNumber || '--'}
                    </div>
                    <div className="stat-card-subtext">Counter 1</div>
                </div>

                <div className="stat-card">
                    <div className="stat-card-label">Waiting Tokens</div>
                    <div className="stat-card-value">
                        {queueStatus?.waitingCount || 0}
                    </div>
                    <div className="stat-card-subtext">In queue</div>
                </div>
            </div>

            {/* SERVICE CONTROLS */}
            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">Service Controls</h3>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                        className="btn btn-primary"
                        onClick={callNext}
                        disabled={processing}
                    >
                        Call Next
                    </button>

                    {queueStatus?.currentlyServing && (
                        <>
                            <button
                                className="btn btn-success"
                                onClick={() =>
                                    markServed(queueStatus.currentlyServing._id)
                                }
                                disabled={processing}
                            >
                                Mark Served
                            </button>

                            <button
                                className="btn btn-error"
                                onClick={() =>
                                    markNoShow(queueStatus.currentlyServing.bookingId)
                                }
                                disabled={processing}
                            >
                                Mark as No-Show
                            </button>
                        </>
                    )}
                </div>
            </div>




            {/* QUEUE LIST (READ ONLY) */}
            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">Queue (Read Only)</h3>
                </div>

                <div className="queue-list">
                    {queueStatus?.waitingTokens?.map(token => (
                        <div key={token._id} className="queue-item">
                            <span className="queue-token">
                                {token.tokenNumber}
                            </span>
                            <span className="queue-wait">
                                {token.estimatedWaitTime} min
                            </span>
                        </div>
                    ))}

                    {queueStatus?.waitingTokens?.length === 0 && (
                        <p className="text-muted text-center">
                            No tokens waiting
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

export default StaffDashboard;
