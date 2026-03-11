import { useState, useEffect } from 'react';
import { slotsAPI } from '../services/api';

function Slots() {
    const [slots, setSlots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [message, setMessage] = useState('');
    const [showForm, setShowForm] = useState(false);

    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        mealTypes: ['breakfast', 'lunch', 'dinner'],
        defaultCapacity: 50
    });

    useEffect(() => {
        loadSlots();
    }, []);

    const loadSlots = async () => {
        try {
            const res = await slotsAPI.getAll();
            // Sort by date descending, then by meal type
            const sorted = (res.data || []).sort((a, b) => {
                const dateCompare = new Date(b.date) - new Date(a.date);
                if (dateCompare !== 0) return dateCompare;
                const order = { breakfast: 1, lunch: 2, dinner: 3 };
                return (order[a.mealType] || 0) - (order[b.mealType] || 0);
            });
            setSlots(sorted);
        } catch (err) {
            console.error('Failed to load slots:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerate = async (e) => {
        e.preventDefault();
        try {
            setGenerating(true);
            // Backend expects startDate and endDate
            await slotsAPI.generate({
                startDate: formData.date,
                endDate: formData.date,
                capacity: formData.defaultCapacity
            });
            setMessage('Slots generated successfully');
            setShowForm(false);
            loadSlots();
        } catch (err) {
            setMessage(err.response?.data?.error || 'Failed to generate slots');
        } finally {
            setGenerating(false);
        }
        setTimeout(() => setMessage(''), 3000);
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this slot?')) return;
        try {
            await slotsAPI.delete(id);
            setMessage('Slot deleted');
            loadSlots();
        } catch (err) {
            setMessage('Failed to delete slot');
        }
        setTimeout(() => setMessage(''), 3000);
    };

    const handleMealTypeToggle = (mealType) => {
        setFormData(prev => ({
            ...prev,
            mealTypes: prev.mealTypes.includes(mealType)
                ? prev.mealTypes.filter(m => m !== mealType)
                : [...prev.mealTypes, mealType]
        }));
    };

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    };

    const isToday = (dateStr) => {
        const today = new Date().toISOString().split('T')[0];
        return dateStr.split('T')[0] === today;
    };

    if (loading) {
        return <div className="text-center">Loading...</div>;
    }

    // Group slots by date
    const slotsByDate = slots.reduce((acc, slot) => {
        const date = slot.date.split('T')[0];
        if (!acc[date]) acc[date] = [];
        acc[date].push(slot);
        return acc;
    }, {});

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Slot Management</h1>
                <p className="page-subtitle">Generate and manage meal time slots</p>
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
                <button className="btn btn-primary" onClick={() => setShowForm(true)}>
                    Generate Slots
                </button>
            </div>

            {/* Generate Form Modal */}
            {showForm && (
                <div className="modal-overlay">
                    <div className="modal">
                        <h3>Generate Slots</h3>
                        <form onSubmit={handleGenerate}>
                            <div className="form-group">
                                <label className="form-label">Date</label>
                                <input
                                    type="date"
                                    className="form-input"
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    min={new Date().toISOString().split('T')[0]}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Meal Types</label>
                                <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                                    {['breakfast', 'lunch', 'dinner'].map(type => (
                                        <label key={type} className="flex items-center gap-1" style={{ cursor: 'pointer' }}>
                                            <input
                                                type="checkbox"
                                                checked={formData.mealTypes.includes(type)}
                                                onChange={() => handleMealTypeToggle(type)}
                                            />
                                            <span style={{ textTransform: 'capitalize' }}>{type}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Default Capacity</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={formData.defaultCapacity}
                                    onChange={(e) => setFormData({ ...formData, defaultCapacity: parseInt(e.target.value) || 50 })}
                                    min="1"
                                    max="500"
                                />
                                <span className="text-xs text-muted">Maximum students per slot</span>
                            </div>

                            <div className="flex" style={{ justifyContent: 'flex-end', gap: 'var(--spacing-md)' }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={generating}>
                                    {generating ? 'Generating...' : 'Generate'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Slots by Date */}
            {Object.keys(slotsByDate).length === 0 ? (
                <div className="card">
                    <p className="text-muted text-center">No slots found. Generate slots to get started.</p>
                </div>
            ) : (
                Object.entries(slotsByDate).map(([date, dateSlots]) => (
                    <div key={date} className="card" style={{ marginBottom: 'var(--spacing-lg)' }}>
                        <div className="card-header">
                            <h3 className="card-title">
                                {formatDate(date)}
                                {isToday(date) && (
                                    <span className="badge badge-info" style={{ marginLeft: '0.5rem' }}>Today</span>
                                )}
                            </h3>
                        </div>

                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Meal</th>
                                        <th>Time</th>
                                        <th>Capacity</th>
                                        <th>Booked</th>
                                        <th>Available</th>
                                        <th>Status</th>
                                        <th>Incentive</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {dateSlots.map(slot => (
                                        <tr key={slot.id}>
                                            <td className="font-bold" style={{ textTransform: 'capitalize' }}>
                                                {slot.mealType}
                                            </td>
                                            <td>{slot.startTime} - {slot.endTime}</td>
                                            <td>{slot.capacity}</td>
                                            <td>{slot.bookedCount}</td>
                                            <td>
                                                <span className={`badge ${slot.capacity - slot.bookedCount > 20 ? 'badge-success' :
                                                    slot.capacity - slot.bookedCount > 0 ? 'badge-warning' : 'badge-error'
                                                    }`}>
                                                    {slot.capacity - slot.bookedCount}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`badge ${slot.status === 'available' ? 'badge-success' : 'badge-neutral'}`}>
                                                    {slot.status}
                                                </span>
                                            </td>
                                            <td>
                                                {slot.hasIncentive ? (
                                                    <span className="badge badge-info">+{slot.incentivePoints} pts</span>
                                                ) : (
                                                    <span className="text-muted">-</span>
                                                )}
                                            </td>
                                            <td>
                                                <button
                                                    className="btn btn-secondary btn-sm"
                                                    onClick={() => handleDelete(slot.id)}
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}

export default Slots;
