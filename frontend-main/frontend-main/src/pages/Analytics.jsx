import { useState, useEffect } from 'react';
import { analyticsAPI, forecastsAPI, sustainabilityAPI } from '../services/api';

function Analytics() {
    const [summary, setSummary] = useState(null);
    const [wasteReport, setWasteReport] = useState(null);
    const [demandTrends, setDemandTrends] = useState(null);
    const [forecasts, setForecasts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(false);

    useEffect(() => {
        loadAnalytics();
    }, []);

    const loadAnalytics = async () => {
        try {
            const [summaryRes, wasteRes, trendsRes, forecastRes] = await Promise.all([
                analyticsAPI.getSummary(),
                analyticsAPI.getWasteReport(),
                analyticsAPI.getDemandTrends(),
                forecastsAPI.getWeek()
            ]);

            setSummary(summaryRes.data);
            setWasteReport(wasteRes.data);
            setDemandTrends(trendsRes.data);
            setForecasts(forecastRes.data);
        } catch (error) {
            console.error('Error loading analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadReport = async () => {
        setDownloading(true);
        try {
            const response = await sustainabilityAPI.downloadCSV();
            const blob = new Blob([response.data], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `sustainability_report_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error downloading report:', error);
            alert('Failed to download report. Please try again.');
        } finally {
            setDownloading(false);
        }
    };

    if (loading) {
        return <div className="text-center">Loading analytics...</div>;
    }

    return (
        <div>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1 className="page-title">Analytics Dashboard</h1>
                    <p className="page-subtitle">System performance and sustainability metrics</p>
                </div>
                <button
                    className="btn btn-primary"
                    onClick={handleDownloadReport}
                    disabled={downloading}
                    style={{ whiteSpace: 'nowrap' }}
                >
                    {downloading ? ' Generating...' : 'Download Sustainability Report'}
                </button>
            </div>

            {/* Summary Stats */}
            <div className="dashboard-grid">
                <div className="stat-card">
                    <div className="stat-card-label">Total Students</div>
                    <div className="stat-card-value">{summary?.totalUsers || 0}</div>
                    <div className="stat-card-subtext">Registered users</div>
                </div>

                <div className="stat-card">
                    <div className="stat-card-label">Total Bookings</div>
                    <div className="stat-card-value primary">{summary?.totalBookings || 0}</div>
                    <div className="stat-card-subtext">All time</div>
                </div>

                <div className="stat-card">
                    <div className="stat-card-label">Today's Bookings</div>
                    <div className="stat-card-value">{summary?.todayBookings || 0}</div>
                    <div className="stat-card-subtext">Reservations</div>
                </div>

                <div className="stat-card">
                    <div className="stat-card-label">Peak Hour</div>
                    <div className="stat-card-value">{summary?.peakHour || 'N/A'}</div>
                    <div className="stat-card-subtext">Busiest time</div>
                </div>
            </div>

            <div className="dashboard-grid-2">
                {/* Waste Report */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Waste Management</h3>
                        <span className={`badge ${wasteReport?.trend === 'good' ? 'badge-success' :
                            wasteReport?.trend === 'moderate' ? 'badge-warning' :
                                'badge-error'
                            }`}>
                            {wasteReport?.trend || 'N/A'}
                        </span>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <div className="text-sm text-muted">Average Waste Percentage</div>
                        <div className="font-bold" style={{ fontSize: '2rem' }}>
                            {wasteReport?.avgWastePercentage?.toFixed(1) || 0}%
                        </div>
                    </div>

                    <div className="text-sm text-muted mb-1">Last 7 Days Trend</div>
                    <div style={{ display: 'flex', gap: '0.25rem', height: '60px', alignItems: 'flex-end', overflow: 'hidden' }}>
                        {(() => {
                            const maxVal = Math.max(1, ...(wasteReport?.wasteData?.map(d => d.wastePercentage) || [1]));
                            return wasteReport?.wasteData?.map((data, idx) => (
                                <div
                                    key={idx}
                                    style={{
                                        flex: 1,
                                        backgroundColor: data.wastePercentage < 10 ? 'var(--success)' :
                                            data.wastePercentage < 20 ? 'var(--warning)' : 'var(--error)',
                                        height: `${Math.max(8, (data.wastePercentage / maxVal) * 55)}px`,
                                        borderRadius: '4px 4px 0 0',
                                        transition: 'height 0.3s ease'
                                    }}
                                    title={`${data.date}: ${data.wastePercentage?.toFixed(1)}%`}
                                />
                            ));
                        })()}
                    </div>
                    <div className="text-xs text-muted text-center mt-1">Past 7 days</div>
                </div>

                {/* Forecast Accuracy */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Forecast Performance</h3>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <div className="text-sm text-muted">Prediction Accuracy</div>
                        <div className="font-bold text-primary" style={{ fontSize: '2rem' }}>
                            {demandTrends?.forecastAccuracy || 0}%
                        </div>
                    </div>

                    <div className="progress-bar" style={{ height: '12px' }}>
                        <div
                            className="progress-bar-fill"
                            style={{ width: `${demandTrends?.forecastAccuracy || 0}%` }}
                        />
                    </div>
                    <div className="text-xs text-muted mt-1">
                        Based on predicted vs actual demand
                    </div>

                    <div style={{ marginTop: '1.5rem' }}>
                        <div className="text-sm text-muted mb-2">Day of Week Analysis</div>
                        {demandTrends?.dayOfWeekTrends && Object.entries(demandTrends.dayOfWeekTrends).slice(0, 5).map(([day, data]) => (
                            <div key={day} className="flex justify-between items-center mb-1">
                                <span className="text-sm" style={{ textTransform: 'capitalize' }}>{day}</span>
                                <span className="text-sm font-bold">
                                    {Math.round(data.predicted / data.count)} avg
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Weekly Forecast */}
            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">Weekly Demand Forecast</h3>
                </div>

                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Day</th>
                                <th>Meal</th>
                                <th>Predicted</th>
                                <th>Weather</th>
                                <th>Schedule</th>
                                <th>Confidence</th>
                            </tr>
                        </thead>
                        <tbody>
                            {forecasts.slice(0, 14).map(forecast => (
                                <tr key={forecast._id}>
                                    <td>{new Date(forecast.date).toLocaleDateString()}</td>
                                    <td style={{ textTransform: 'capitalize' }}>{forecast.dayOfWeek}</td>
                                    <td style={{ textTransform: 'capitalize' }}>{forecast.mealType}</td>
                                    <td className="font-bold">{forecast.predictedDemand}</td>
                                    <td style={{ textTransform: 'capitalize' }}>{forecast.weatherCondition}</td>
                                    <td style={{ textTransform: 'capitalize' }}>{forecast.academicSchedule}</td>
                                    <td>
                                        <div className="flex items-center gap-2">
                                            <div className="progress-bar" style={{ width: '60px', height: '6px' }}>
                                                <div className="progress-bar-fill" style={{ width: `${forecast.confidence}%` }} />
                                            </div>
                                            <span className="text-xs">{forecast.confidence}%</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Sustainability Metrics */}
            <div className="card" style={{ marginTop: 'var(--spacing-lg)' }}>
                <div className="card-header">
                    <h3 className="card-title">Sustainability Insights</h3>
                </div>

                <div className="dashboard-grid-3" style={{ marginBottom: 0 }}>
                    <div>
                        <div className="text-sm text-muted mb-1">Food Waste Reduction</div>
                        <div className="font-bold" style={{ fontSize: '1.5rem', color: 'var(--success)' }}>
                            {100 - (wasteReport?.avgWastePercentage || 0)}%
                        </div>
                        <div className="text-xs text-muted">Utilization rate</div>
                    </div>

                    <div>
                        <div className="text-sm text-muted mb-1">Avg Daily Bookings</div>
                        <div className="font-bold" style={{ fontSize: '1.5rem' }}>
                            {summary?.avgDailyBookings || 0}
                        </div>
                        <div className="text-xs text-muted">Per day average</div>
                    </div>

                    <div>
                        <div className="text-sm text-muted mb-1">Allocation Fairness</div>
                        <div className="font-bold" style={{ fontSize: '1.5rem', color: 'var(--primary-600)' }}>
                            High
                        </div>
                        <div className="text-xs text-muted">Token-based queue</div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Analytics;
