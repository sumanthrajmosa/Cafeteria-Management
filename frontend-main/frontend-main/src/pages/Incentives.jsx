import { useState, useEffect } from 'react';
import { incentivesAPI } from '../services/api';

function Incentives() {
    const [points, setPoints] = useState(0);
    const [history, setHistory] = useState([]);
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [pointsRes, historyRes, statusRes] = await Promise.all([
                incentivesAPI.getMyPoints(),
                incentivesAPI.getHistory(),
                incentivesAPI.getStatus()
            ]);
            setPoints(pointsRes.data?.totalPoints || 0);
            setHistory(historyRes.data || []);
            setStatus(statusRes.data);
        } catch (err) {
            console.error('Failed to load incentive data:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="text-center">Loading...</div>;
    }

    // Map backend fields to display names
    const attended = status?.attendedBookings || 0;
    const noShows = status?.noShowBookings || 0;
    const totalBookings = status?.totalBookings || 0;
    const attendanceRate = status?.attendanceRate?.toFixed(0) || 0;

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">My Rewards</h1>
                <p className="page-subtitle">Track your points and attendance</p>
            </div>

            {/* Stats */}
            <div className="dashboard-grid">
                <div className="stat-card">
                    <div className="stat-card-label">Total Points</div>
                    <div className="stat-card-value primary">{points}</div>
                    <div className="stat-card-subtext">Points earned</div>
                </div>

                <div className="stat-card">
                    <div className="stat-card-label">Attended</div>
                    <div className="stat-card-value">{attended}</div>
                    <div className="stat-card-subtext">Bookings attended</div>
                </div>

                <div className="stat-card">
                    <div className="stat-card-label">No Shows</div>
                    <div className="stat-card-value">{noShows}</div>
                    <div className="stat-card-subtext">Missed bookings</div>
                </div>

                <div className="stat-card">
                    <div className="stat-card-label">Attendance Rate</div>
                    <div className="stat-card-value">{attendanceRate}%</div>
                    <div className="stat-card-subtext">Your reliability</div>
                </div>
            </div>

            <div className="dashboard-grid-2">
                {/* How to Earn */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">How to Earn Points</h3>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div className="queue-item">
                            <div>
                                <div className="font-bold">Attend Your Booking</div>
                                <div className="text-xs text-muted">Show up and get served</div>
                            </div>
                            <div>
                                <span className="badge badge-success">+5 pts</span>
                            </div>
                        </div>

                        <div className="queue-item">
                            <div>
                                <div className="font-bold">Book Off-Peak Slots</div>
                                <div className="text-xs text-muted">Choose less busy times for bonus</div>
                            </div>
                            <div>
                                <span className="badge badge-info">+10 pts</span>
                            </div>
                        </div>

                        <div className="queue-item">
                            <div>
                                <div className="font-bold">Avoid No-Shows</div>
                                <div className="text-xs text-muted">Missing bookings costs points</div>
                            </div>
                            <div>
                                <span className="badge badge-error">-10 pts</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Incentive Tip */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Off-Peak Bonus</h3>
                    </div>
                    <p className="text-muted mb-2">
                        Look for slots marked with bonus points on the booking page. These are
                        less crowded time slots where you can earn extra points!
                    </p>
                    <p className="text-sm">
                        Slots with low occupancy will show a <span className="badge badge-info">+X pts</span> badge.
                        Book these to earn bonus points on top of your attendance points.
                    </p>
                    <div style={{ marginTop: '1rem' }}>
                        <a href="/booking" className="btn btn-primary">Book a Meal</a>
                    </div>
                </div>
            </div>

            {/* Transaction History */}
            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">Recent Point History</h3>
                </div>

                {history.length === 0 ? (
                    <p className="text-muted text-center">No transactions yet. Start booking meals!</p>
                ) : (
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Type</th>
                                    <th>Description</th>
                                    <th>Points</th>
                                </tr>
                            </thead>
                            <tbody>
                                {history.slice(0, 10).map((tx, idx) => (
                                    <tr key={idx}>
                                        <td>{new Date(tx.createdAt).toLocaleDateString()}</td>
                                        <td style={{ textTransform: 'capitalize' }}>{tx.type}</td>
                                        <td>{tx.description || '-'}</td>
                                        <td>
                                            <span className={`badge ${tx.points >= 0 ? 'badge-success' : 'badge-error'}`}>
                                                {tx.points >= 0 ? '+' : ''}{tx.points}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Incentives;
