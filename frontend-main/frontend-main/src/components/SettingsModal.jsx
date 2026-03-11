import { useState, useEffect } from 'react';
import { operatingHoursAPI, systemAPI } from '../services/api';
import './SettingsModal.css';

function SettingsModal({ isOpen, onClose }) {
    const [hours, setHours] = useState([]);
    const [health, setHealth] = useState(null);
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('hours'); // 'hours', 'general', or 'health'

    useEffect(() => {
        if (isOpen) {
            loadData();
        }
    }, [isOpen]);

    const loadData = async () => {
        setLoading(true);
        try {
            // Load each data source independently to prevent one failure from blocking others
            const [hoursRes, healthRes, settingsRes] = await Promise.allSettled([
                operatingHoursAPI.getAll(),
                systemAPI.getHealth(),
                systemAPI.getSettings()
            ]);

            if (hoursRes.status === 'fulfilled') setHours(hoursRes.value.data);
            if (healthRes.status === 'fulfilled') setHealth(healthRes.value.data);
            if (settingsRes.status === 'fulfilled') setSettings(settingsRes.value.data);

            if (hoursRes.status === 'rejected') console.error('Hours load failed:', hoursRes.reason);
            if (healthRes.status === 'rejected') console.error('Health load failed:', healthRes.reason);
            if (settingsRes.status === 'rejected') console.error('Settings load failed:', settingsRes.reason);
        } catch (error) {
            console.error('Core loading error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateSettings = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await systemAPI.updateSettings(settings);
            setSettings(res.data);
            alert('System settings updated successfully');
        } catch (error) {
            console.error('Error updating settings:', error);
            alert('Failed to update system settings');
        } finally {
            setSaving(false);
        }
    };

    const handleUpdateHours = async (id, data) => {
        setSaving(true);
        try {
            await operatingHoursAPI.update(id, data);
            setHours(hours.map(h => h.id === id ? { ...h, ...data } : h));
        } catch (error) {
            console.error('Error updating hours:', error);
            alert('Failed to update operating hours');
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">System Settings</h2>
                    <button className="modal-close" onClick={onClose}>&times;</button>
                </div>

                <div className="modal-tabs">
                    <button
                        className={`modal-tab ${activeTab === 'hours' ? 'active' : ''}`}
                        onClick={() => setActiveTab('hours')}
                    >
                        Operating Hours
                    </button>
                    <button
                        className={`modal-tab ${activeTab === 'general' ? 'active' : ''}`}
                        onClick={() => setActiveTab('general')}
                    >
                        General
                    </button>
                    <button
                        className={`modal-tab ${activeTab === 'health' ? 'active' : ''}`}
                        onClick={() => setActiveTab('health')}
                    >
                        System Health
                    </button>
                </div>

                <div className="modal-body">
                    {loading ? (
                        <div className="text-center py-10">
                            <div className="loading-spinner mb-2"></div>
                            <p>Loading settings...</p>
                        </div>
                    ) : activeTab === 'hours' ? (
                        <div className="settings-section">
                            <p className="settings-desc">Configure when each meal is served across the week.</p>
                            <div className="hours-table-container">
                                <table className="hours-table">
                                    <thead>
                                        <tr>
                                            <th>Day</th>
                                            <th>Meal</th>
                                            <th>Start</th>
                                            <th>End</th>
                                            <th>Status</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {hours.map(h => (
                                            <OperatingHourRow
                                                key={h.id}
                                                hour={h}
                                                onSave={(data) => handleUpdateHours(h.id, data)}
                                                disabled={saving}
                                            />
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : activeTab === 'general' ? (
                        settings ? (
                            <form onSubmit={handleUpdateSettings} className="settings-section">
                                <div className="form-group">
                                    <label>Sustainability Score Goal</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        value={settings?.sustainabilityGoal || ''}
                                        onChange={e => setSettings({ ...settings, sustainabilityGoal: parseFloat(e.target.value) })}
                                    />
                                    <small className="text-muted">Target score to achieve green status (0-100)</small>
                                </div>
                                <div className="form-group">
                                    <label>Incentive Multiplier</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        className="form-input"
                                        value={settings?.incentiveMultiplier || ''}
                                        onChange={e => setSettings({ ...settings, incentiveMultiplier: parseFloat(e.target.value) })}
                                    />
                                    <small className="text-muted">Global multiplier for point earnings</small>
                                </div>
                                <div className="form-group">
                                    <label>Max Active Bookings</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        value={settings?.maxBookingsPerUser || ''}
                                        onChange={e => setSettings({ ...settings, maxBookingsPerUser: parseInt(e.target.value) })}
                                    />
                                    <small className="text-muted">Maximum concurrent bookings per student</small>
                                </div>
                                <div className="form-group">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={settings?.maintenanceMode || false}
                                            onChange={e => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                                        />
                                        <span>System Maintenance Mode</span>
                                    </label>
                                </div>
                                <div className="mt-4">
                                    <button type="submit" className="btn btn-primary" disabled={saving}>
                                        {saving ? 'Saving...' : 'Save Global Settings'}
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="text-center py-10">
                                <p className="text-muted mb-4">Settings data unavailable. Please check backend connection.</p>
                                <button className="btn btn-secondary" onClick={loadData}>Retry</button>
                            </div>
                        )
                    ) : activeTab === 'hours' ? (
                        <div className="settings-section">
                            <p className="settings-desc">Configure when each meal is served across the week.</p>
                            <div className="hours-table-container">
                                <table className="hours-table">
                                    <thead>
                                        <tr>
                                            <th>Day</th>
                                            <th>Meal</th>
                                            <th>Start</th>
                                            <th>End</th>
                                            <th>Status</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {hours.map(h => (
                                            <OperatingHourRow
                                                key={h.id}
                                                hour={h}
                                                onSave={(data) => handleUpdateHours(h.id, data)}
                                                disabled={saving}
                                            />
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className="settings-section">
                            <div className="health-grid">
                                <div className="health-card">
                                    <div className="health-label">Uptime</div>
                                    <div className="health-value">{health?.uptime || 'N/A'}</div>
                                </div>
                                <div className="health-card">
                                    <div className="health-label">Database</div>
                                    <div className={`health-value ${health?.dbStatus === 'OK' ? 'text-success' : 'text-error'}`}>
                                        {health?.dbStatus || 'Unknown'}
                                    </div>
                                </div>
                                <div className="health-card">
                                    <div className="health-label">Memory Allocation</div>
                                    <div className="health-value">{health?.memory || 'N/A'}</div>
                                </div>
                                <div className="health-card">
                                    <div className="health-label">Active Goroutines</div>
                                    <div className="health-value">{health?.goroutines || 'N/A'}</div>
                                </div>
                            </div>
                            <div className="mt-4 text-center">
                                <button className="btn btn-secondary" onClick={loadData}>Refresh Metrics</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function OperatingHourRow({ hour, onSave, disabled }) {
    const [startTime, setStartTime] = useState(hour.startTime);
    const [endTime, setEndTime] = useState(hour.endTime);
    const [isClosed, setIsClosed] = useState(hour.isClosed);
    const [isEditing, setIsEditing] = useState(false);

    const hasChanges = startTime !== hour.startTime || endTime !== hour.endTime || isClosed !== hour.isClosed;

    const handleSave = () => {
        onSave({ startTime, endTime, isClosed });
        setIsEditing(false);
    };

    return (
        <tr>
            <td>{hour.dayOfWeek}</td>
            <td style={{ textTransform: 'capitalize' }}>{hour.mealType}</td>
            <td>
                {isEditing ? (
                    <input
                        type="time"
                        value={startTime}
                        onChange={e => setStartTime(e.target.value)}
                        className="hour-input"
                    />
                ) : hour.startTime}
            </td>
            <td>
                {isEditing ? (
                    <input
                        type="time"
                        value={endTime}
                        onChange={e => setEndTime(e.target.value)}
                        className="hour-input"
                    />
                ) : hour.endTime}
            </td>
            <td>
                {isEditing ? (
                    <label className="switch">
                        <input
                            type="checkbox"
                            checked={!isClosed}
                            onChange={e => setIsClosed(!e.target.checked)}
                        />
                        <span className="slider round"></span>
                        <span className="ml-2">{isClosed ? 'Closed' : 'Open'}</span>
                    </label>
                ) : (
                    <span className={`badge ${hour.isClosed ? 'badge-error' : 'badge-success'}`}>
                        {hour.isClosed ? 'Closed' : 'Open'}
                    </span>
                )}
            </td>
            <td>
                {isEditing ? (
                    <div className="flex gap-2">
                        <button
                            className="btn btn-sm btn-primary"
                            onClick={handleSave}
                            disabled={disabled || !hasChanges}
                        >
                            Save
                        </button>
                        <button
                            className="btn btn-sm btn-neutral"
                            onClick={() => {
                                setStartTime(hour.startTime);
                                setEndTime(hour.endTime);
                                setIsClosed(hour.isClosed);
                                setIsEditing(false);
                            }}
                        >
                            Cancel
                        </button>
                    </div>
                ) : (
                    <button className="btn btn-sm btn-secondary" onClick={() => setIsEditing(true)}>Edit</button>
                )}
            </td>
        </tr>
    );
}

export default SettingsModal;
