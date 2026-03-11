import { useState, useEffect } from 'react';
import { analyticsAPI, queueAPI, forecastsAPI, bookingsAPI } from '../services/api';
import SettingsModal from '../components/SettingsModal';

function AdminDashboard() {
    const [dashboard, setDashboard] = useState(null);
    const [queueStatus, setQueueStatus] = useState(null);
    const [forecasts, setForecasts] = useState([]);
    const [recentBookings, setRecentBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            const [dashboardRes, queueRes, forecastRes, bookingsRes] = await Promise.all([
                analyticsAPI.getDashboard(),
                queueAPI.getStatus(),
                forecastsAPI.getToday(),
                bookingsAPI.getAllAdmin()
            ]);

            setDashboard(dashboardRes.data);
            setQueueStatus(queueRes.data);
            setForecasts(forecastRes.data);
            setRecentBookings(bookingsRes.data.slice(0, 10));
        } catch (error) {
            console.error('Error loading dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="text-center py-10">Loading dashboard...</div>;
    }

    return (
        <div className="admin-dashboard">
            <div className="page-header flex justify-between items-center mb-2">
                <div>
                    <h1 className="page-title">Admin Dashboard</h1>
                    <p className="page-subtitle">Real-time system overview and management</p>
                </div>
                <button
                    className="btn btn-secondary flex items-center gap-1"
                    onClick={() => setIsSettingsOpen(true)}
                >
                    <span>System Settings</span>
                </button>
            </div>

            {/* Main Stats Row - 4 columns */}
            <div className="dashboard-grid">
                <div className="stat-card">
                    <div className="stat-card-label">Active Bookings</div>
                    <div className="stat-card-value primary">{dashboard?.today?.totalBookings || 0}</div>
                    <div className="stat-card-subtext">Booked for today</div>
                </div>

                <div className="stat-card">
                    <div className="stat-card-label">In Queue</div>
                    <div className="stat-card-value">{queueStatus?.waitingCount || 0}</div>
                    <div className="stat-card-subtext">Waiting students</div>
                </div>

                <div className="stat-card">
                    <div className="stat-card-label">Avg. Service</div>
                    <div className="stat-card-value">{dashboard?.today?.avgWaitTime || 0}m</div>
                    <div className="stat-card-subtext">Minutes per person</div>
                </div>

                <div className="stat-card">
                    <div className="stat-card-label">Served</div>
                    <div className="stat-card-value success">{dashboard?.today?.totalServed || 0}</div>
                    <div className="stat-card-subtext">Daily completion</div>
                </div>
            </div>

            {/* Content Row 1: Queue and Activity */}
            <div className="dashboard-grid-3">
                {/* Live Queue Overview - 1 column */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Live Queue</h3>
                        <span className="badge badge-info">Live</span>
                    </div>
                    <div className="queue-display">
                        <div className="queue-current-token">
                            {queueStatus?.currentlyServing?.tokenNumber || '--'}
                        </div>
                        <div className="queue-current-label">Currently Serving</div>

                        <div className="mt-2 text-center">
                            <div className="text-xs text-muted uppercase font-bold mb-1">Up Next</div>
                            <div className="flex gap-1 justify-center">
                                {queueStatus?.waitingTokens?.slice(0, 3).map(t => (
                                    <span key={t._id} className="badge badge-neutral">#{t.tokenNumber}</span>
                                )) || <span className="text-muted">Empty</span>}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Activity - 2 columns */}
                <div className="card" style={{ gridColumn: 'span 2' }}>
                    <div className="card-header">
                        <h3 className="card-title">Recent Activity</h3>
                    </div>
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Token</th>
                                    <th>Student</th>
                                    <th>Meal</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentBookings.map(booking => (
                                    <tr key={booking._id}>
                                        <td className="font-bold">#{booking.tokenNumber}</td>
                                        <td>{booking.user?.name || 'N/A'}</td>
                                        <td className="capitalize">{booking.slot?.mealType || 'N/A'}</td>
                                        <td>
                                            <span className={`badge badge-${booking.status === 'served' ? 'success' :
                                                booking.status === 'confirmed' ? 'info' :
                                                    booking.status === 'pending' ? 'warning' : 'neutral'
                                                }`}>
                                                {booking.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {recentBookings.length === 0 && (
                                    <tr><td colSpan="4" className="text-center py-4 text-muted">No recent activity</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Content Row 2: Forecast and Distribution */}
            <div className="dashboard-grid-3">
                {/* Forecasts - 2 columns */}
                <div className="card" style={{ gridColumn: 'span 2' }}>
                    <div className="card-header">
                        <h3 className="card-title">Demand Forecasts</h3>
                        <span className="text-xs text-muted">AI Predicted portions</span>
                    </div>
                    <div className="dashboard-grid-2" style={{ gap: '1rem', marginBottom: 0 }}>
                        {forecasts.map(f => (
                            <div key={f._id} className="forecast-card p-4">
                                <div className="flex justify-between items-center mb-1">
                                    <div className="forecast-meal primary text-bold" style={{ color: 'var(--primary-600)', fontWeight: 700 }}>{f.mealType}</div>
                                    <div className="font-bold text-xl">{f.predictedDemand} portions</div>
                                </div>
                                <div className="progress-bar">
                                    <div
                                        className="progress-bar-fill"
                                        style={{ width: `${f.confidence}%` }}
                                    ></div>
                                </div>
                                <div className="flex justify-between mt-1" style={{ fontSize: '0.7rem' }}>
                                    <span className="text-muted">Confidence Level</span>
                                    <span className="font-bold">{f.confidence}%</span>
                                </div>
                            </div>
                        ))}
                        {forecasts.length === 0 && (
                            <p className="text-center text-muted col-span-2 py-4">Generating forecasts...</p>
                        )}
                    </div>
                </div>

                {/* Demand Distribution - 1 column */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Distribution</h3>
                    </div>
                    <div className="p-2">
                        {['breakfast', 'lunch', 'dinner'].map(meal => {
                            const count = dashboard?.demandByMeal?.[meal] || 0;
                            const max = Math.max(...Object.values(dashboard?.demandByMeal || { b: 0 }), 1);
                            const percent = (count / max) * 100;
                            return (
                                <div key={meal} className="mb-2">
                                    <div className="flex justify-between mb-1 text-sm">
                                        <span className="capitalize">{meal}</span>
                                        <span className="font-bold">{count}</span>
                                    </div>
                                    <div className="progress-bar">
                                        <div className="progress-bar-fill" style={{ width: `${percent}%` }}></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <SettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
            />
        </div>
    );
}

export default AdminDashboard;
