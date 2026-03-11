import { useState, useEffect } from 'react';
import { incentivesAPI } from '../services/api';

function IncentiveConfig() {
    const [rules, setRules] = useState([]);
    const [abuseReport, setAbuseReport] = useState(null);
    const [behaviorTrends, setBehaviorTrends] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingRule, setEditingRule] = useState(null);
    const [applyingIncentives, setApplyingIncentives] = useState(false);
    const [message, setMessage] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        slotType: '',
        maxOccupancyPct: 50,
        bonusPoints: 10,
        baseAttendPoints: 5,
        noShowPenalty: 10,
        isActive: true
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [rulesRes, abuseRes, trendsRes] = await Promise.all([
                incentivesAPI.getRules(),
                incentivesAPI.getAbuseReport(),
                incentivesAPI.getBehaviorTrends(30)
            ]);
            setRules(rulesRes.data || []);
            setAbuseReport(abuseRes.data);
            setBehaviorTrends(trendsRes.data);
        } catch (err) {
            console.error('Failed to fetch data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : (type === 'number' ? parseInt(value) || 0 : value)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingRule) {
                await incentivesAPI.updateRule(editingRule.id, formData);
                setMessage('Rule updated successfully');
            } else {
                await incentivesAPI.createRule(formData);
                setMessage('Rule created successfully');
            }
            setShowForm(false);
            setEditingRule(null);
            resetForm();
            fetchData();
        } catch (err) {
            setMessage('Failed to save rule');
        }
        setTimeout(() => setMessage(''), 3000);
    };

    const handleEdit = (rule) => {
        setEditingRule(rule);
        setFormData({
            name: rule.name,
            description: rule.description || '',
            slotType: rule.slotType || '',
            maxOccupancyPct: rule.maxOccupancyPct,
            bonusPoints: rule.bonusPoints,
            baseAttendPoints: rule.baseAttendPoints,
            noShowPenalty: rule.noShowPenalty,
            isActive: rule.isActive
        });
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this incentive rule?')) return;
        try {
            await incentivesAPI.deleteRule(id);
            setMessage('Rule deleted');
            fetchData();
        } catch (err) {
            setMessage('Failed to delete rule');
        }
        setTimeout(() => setMessage(''), 3000);
    };

    const handleApplyToSlots = async () => {
        try {
            setApplyingIncentives(true);
            const res = await incentivesAPI.applyToSlots();
            setMessage(`Applied incentives: ${res.data.slotsUpdated} slots updated`);
        } catch (err) {
            setMessage('Failed to apply incentives');
        } finally {
            setApplyingIncentives(false);
        }
        setTimeout(() => setMessage(''), 3000);
    };

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            slotType: '',
            maxOccupancyPct: 50,
            bonusPoints: 10,
            baseAttendPoints: 5,
            noShowPenalty: 10,
            isActive: true
        });
    };

    if (loading) {
        return <div className="text-center">Loading...</div>;
    }

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Incentive Configuration</h1>
                <p className="page-subtitle">Manage incentive rules and view behavior reports</p>
            </div>

            {message && (
                <div className="badge badge-success" style={{
                    width: '100%', justifyContent: 'center', padding: '0.75rem', marginBottom: '1rem'
                }}>
                    {message}
                </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 mb-2">
                <button className="btn btn-primary" onClick={() => { resetForm(); setEditingRule(null); setShowForm(true); }}>
                    Add New Rule
                </button>
                <button
                    className="btn btn-secondary"
                    onClick={handleApplyToSlots}
                    disabled={applyingIncentives}
                >
                    {applyingIncentives ? 'Applying...' : 'Apply to Slots'}
                </button>
            </div>

            {/* Modal Form */}
            {showForm && (
                <div className="modal-overlay">
                    <div className="modal">
                        <h3>{editingRule ? 'Edit Rule' : 'New Incentive Rule'}</h3>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">Name *</label>
                                <input
                                    type="text"
                                    name="name"
                                    className="form-input"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    required
                                    placeholder="e.g., Off-Peak Lunch Bonus"
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Description</label>
                                <input
                                    type="text"
                                    name="description"
                                    className="form-input"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    placeholder="Describe when this rule applies"
                                />
                            </div>

                            <div className="dashboard-grid-2" style={{ marginBottom: 0 }}>
                                <div className="form-group">
                                    <label className="form-label">Slot Type</label>
                                    <select name="slotType" className="form-select" value={formData.slotType} onChange={handleInputChange}>
                                        <option value="">All Types</option>
                                        <option value="breakfast">Breakfast</option>
                                        <option value="lunch">Lunch</option>
                                        <option value="dinner">Dinner</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Max Occupancy %</label>
                                    <input
                                        type="number"
                                        name="maxOccupancyPct"
                                        className="form-input"
                                        value={formData.maxOccupancyPct}
                                        onChange={handleInputChange}
                                        min="0"
                                        max="100"
                                    />
                                    <span className="text-xs text-muted">Slots below this % get incentive</span>
                                </div>
                            </div>

                            <div className="dashboard-grid-3" style={{ marginBottom: 0 }}>
                                <div className="form-group">
                                    <label className="form-label">Bonus Points</label>
                                    <input
                                        type="number"
                                        name="bonusPoints"
                                        className="form-input"
                                        value={formData.bonusPoints}
                                        onChange={handleInputChange}
                                        min="0"
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Base Attend Points</label>
                                    <input
                                        type="number"
                                        name="baseAttendPoints"
                                        className="form-input"
                                        value={formData.baseAttendPoints}
                                        onChange={handleInputChange}
                                        min="0"
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">No-Show Penalty</label>
                                    <input
                                        type="number"
                                        name="noShowPenalty"
                                        className="form-input"
                                        value={formData.noShowPenalty}
                                        onChange={handleInputChange}
                                        min="0"
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        name="isActive"
                                        checked={formData.isActive}
                                        onChange={handleInputChange}
                                        style={{ margin: 0 }}
                                    />
                                    <span>Rule is Active</span>
                                </label>
                            </div>

                            <div className="flex" style={{ justifyContent: 'flex-end', gap: 'var(--spacing-md)' }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    {editingRule ? 'Update' : 'Create'} Rule
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Rules Table */}
            <div className="card" style={{ marginBottom: 'var(--spacing-xl)' }}>
                <div className="card-header">
                    <h3 className="card-title">Incentive Rules</h3>
                </div>

                {rules.length === 0 ? (
                    <p className="text-muted text-center">No incentive rules configured yet.</p>
                ) : (
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Slot Type</th>
                                    <th>Max Occ. %</th>
                                    <th>Bonus</th>
                                    <th>Base</th>
                                    <th>Penalty</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rules.map(rule => (
                                    <tr key={rule.id}>
                                        <td className="font-bold">{rule.name}</td>
                                        <td style={{ textTransform: 'capitalize' }}>{rule.slotType || 'All'}</td>
                                        <td>{rule.maxOccupancyPct}%</td>
                                        <td>+{rule.bonusPoints}</td>
                                        <td>+{rule.baseAttendPoints}</td>
                                        <td>-{rule.noShowPenalty}</td>
                                        <td>
                                            <span className={`badge ${rule.isActive ? 'badge-success' : 'badge-neutral'}`}>
                                                {rule.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="flex gap-1">
                                                <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(rule)}>
                                                    Edit
                                                </button>
                                                <button className="btn btn-secondary btn-sm" onClick={() => handleDelete(rule.id)}>
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Abuse Report */}
            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">Abuse Detection Report</h3>
                </div>
                <p className="text-muted mb-2">
                    Users with high no-show rates ({abuseReport?.threshold})
                </p>

                {!abuseReport?.abuseRecords || abuseReport.abuseRecords.length === 0 ? (
                    <div className="badge badge-success" style={{ padding: '0.75rem 1rem' }}>
                        No abuse patterns detected
                    </div>
                ) : (
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>User</th>
                                    <th>Total Bookings</th>
                                    <th>No Shows</th>
                                    <th>No-Show Rate</th>
                                </tr>
                            </thead>
                            <tbody>
                                {abuseReport.abuseRecords.map((record, idx) => (
                                    <tr key={idx}>
                                        <td>{record.userName}</td>
                                        <td>{record.totalBookings}</td>
                                        <td>{record.noShows}</td>
                                        <td>
                                            <span className="badge badge-error">{record.noShowRate.toFixed(1)}%</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Behavior Trends (US-IN-8) */}
            <div className="card" style={{ marginTop: 'var(--spacing-xl)' }}>
                <div className="card-header">
                    <h3 className="card-title">Behavior Trends</h3>
                    <span className={`badge ${behaviorTrends?.summary?.trendDirection === 'improving' ? 'badge-success' : behaviorTrends?.summary?.trendDirection === 'declining' ? 'badge-error' : 'badge-warning'}`}>
                        {behaviorTrends?.summary?.trendDirection || 'stable'}
                    </span>
                </div>

                {/* Summary Stats */}
                <div className="dashboard-grid" style={{ marginBottom: 'var(--spacing-lg)' }}>
                    <div className="stat-card">
                        <div className="stat-card-label">Active Users</div>
                        <div className="stat-card-value">{behaviorTrends?.summary?.totalUsers || 0}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-card-label">Avg Attendance</div>
                        <div className="stat-card-value" style={{ color: 'var(--success)' }}>
                            {behaviorTrends?.summary?.avgAttendanceRate?.toFixed(1) || 0}%
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-card-label">Total No-Shows</div>
                        <div className="stat-card-value" style={{ color: 'var(--error)' }}>
                            {behaviorTrends?.summary?.totalNoShows || 0}
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-card-label">Points Awarded</div>
                        <div className="stat-card-value primary">{behaviorTrends?.summary?.totalPointsAwarded || 0}</div>
                    </div>
                </div>

                {/* Weekly Chart */}
                <div className="text-sm text-muted mb-1">Weekly Attendance Rate</div>
                <div style={{ display: 'flex', gap: '0.5rem', height: '80px', alignItems: 'flex-end', marginBottom: '0.5rem' }}>
                    {behaviorTrends?.weeklyTrends?.map((week, idx) => (
                        <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                            <span className="text-xs">{week.attendanceRate?.toFixed(0)}%</span>
                            <div
                                style={{
                                    width: '100%',
                                    backgroundColor: week.attendanceRate >= 80 ? 'var(--success)' :
                                        week.attendanceRate >= 50 ? 'var(--warning)' : 'var(--error)',
                                    height: `${Math.max(4, (week.attendanceRate / 100) * 55)}px`,
                                    borderRadius: '4px 4px 0 0',
                                    transition: 'height 0.3s ease'
                                }}
                                title={`${week.weekStart}: ${week.attended}/${week.totalBookings} attended`}
                            />
                        </div>
                    ))}
                </div>

                {/* Weekly Table */}
                {behaviorTrends?.weeklyTrends?.length > 0 && (
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Week</th>
                                    <th>Bookings</th>
                                    <th>Attended</th>
                                    <th>No-Shows</th>
                                    <th>Points</th>
                                    <th>Rate</th>
                                </tr>
                            </thead>
                            <tbody>
                                {behaviorTrends.weeklyTrends.map((week, idx) => (
                                    <tr key={idx}>
                                        <td>{week.weekStart}</td>
                                        <td>{week.totalBookings}</td>
                                        <td>{week.attended}</td>
                                        <td>
                                            {week.noShows > 0 ? (
                                                <span className="badge badge-error">{week.noShows}</span>
                                            ) : (
                                                <span className="badge badge-success">0</span>
                                            )}
                                        </td>
                                        <td>+{week.pointsAwarded}</td>
                                        <td>
                                            <div className="flex items-center gap-2">
                                                <div className="progress-bar" style={{ width: '50px', height: '6px' }}>
                                                    <div className="progress-bar-fill" style={{ width: `${week.attendanceRate}%` }} />
                                                </div>
                                                <span className="text-xs">{week.attendanceRate?.toFixed(0)}%</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                {(!behaviorTrends?.weeklyTrends || behaviorTrends.weeklyTrends.length === 0) && (
                    <p className="text-muted text-center">No behavior data available yet.</p>
                )}
            </div>
        </div>
    );
}

export default IncentiveConfig;
