import { useState, useEffect } from 'react';
import { forecastsAPI, wasteAPI, sustainabilityAPI, preparationAPI } from '../services/api';
import '../styles/global.css';

const StaffForecast = () => {
    const [forecasts, setForecasts] = useState([]);
    const [accuracy, setAccuracy] = useState(null);
    const [wasteSummary, setWasteSummary] = useState(null);
    const [sustainability, setSustainability] = useState(null);
    const [preparations, setPreparations] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('forecasts');
    const [selectedDate, setSelectedDate] = useState(
        new Date(Date.now() + 86400000).toISOString().split('T')[0]
    );
    const [showWasteModal, setShowWasteModal] = useState(false);
    const [wasteLogs, setWasteLogs] = useState([]);
    const [wasteForm, setWasteForm] = useState({
        date: new Date().toISOString().split('T')[0],
        mealType: 'lunch',
        category: 'prepared',
        foodItem: '',
        preparedQuantity: 0,
        wastedQuantity: 0,
        wasteWeight: 0,
        reason: '',
        notes: ''
    });

    useEffect(() => {
        fetchData();
        fetchWasteLogs();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [forecastRes, accuracyRes, wasteRes, sustainRes, prepRes] = await Promise.all([
                forecastsAPI.getWeek(),
                forecastsAPI.getAccuracy(30),
                wasteAPI.getSummary(30),
                sustainabilityAPI.getMetrics(),
                preparationAPI.getRecommendations(selectedDate)
            ]);

            // Deduplicate forecasts mapping by Date + Meal
            const uniqueMap = new Map();
            forecastRes.data.forEach(f => {
                const key = `${f.date.split('T')[0]}_${f.mealType}`;
                if (!uniqueMap.has(key)) {
                    uniqueMap.set(key, f);
                }
            });
            setForecasts(Array.from(uniqueMap.values()));

            setAccuracy(accuracyRes.data);
            setWasteSummary(wasteRes.data);
            setSustainability(sustainRes.data);
            setPreparations(prepRes.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchWasteLogs = async () => {
        try {
            const res = await wasteAPI.getAll();
            setWasteLogs(res.data);
        } catch (error) {
            console.error('Error fetching waste logs:', error);
        }
    };

    const handleDateChange = async (e) => {
        setSelectedDate(e.target.value);
        try {
            const prepRes = await preparationAPI.getRecommendations(e.target.value);
            setPreparations(prepRes.data);
        } catch (error) {
            console.error('Error fetching preparations:', error);
        }
    };

    const handleWasteSubmit = async (e) => {
        e.preventDefault();
        try {
            await wasteAPI.create(wasteForm);
            setShowWasteModal(false);
            fetchData();
            fetchWasteLogs();
            setWasteForm({
                date: new Date().toISOString().split('T')[0],
                mealType: 'lunch',
                category: 'prepared',
                foodItem: '',
                preparedQuantity: 0,
                wastedQuantity: 0,
                wasteWeight: 0,
                reason: '',
                notes: ''
            });
            alert('Waste log recorded successfully!');
        } catch (error) {
            console.error('Error recording waste:', error);
            alert('Failed to record waste log');
        }
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading forecast data...</p>
            </div>
        );
    }

    return (
        <div className="staff-forecast-page">
            <div className="page-header">
                <h1>Demand Forecasting & Sustainability</h1>
                <p>View predictions, waste metrics, and preparation recommendations</p>
            </div>

            {/* Tabs */}
            <div className="tabs">
                <button
                    className={`tab ${activeTab === 'forecasts' ? 'active' : ''}`}
                    onClick={() => setActiveTab('forecasts')}
                >
                    Forecasts
                </button>
                <button
                    className={`tab ${activeTab === 'preparation' ? 'active' : ''}`}
                    onClick={() => setActiveTab('preparation')}
                >
                    Preparation
                </button>
                <button
                    className={`tab ${activeTab === 'waste' ? 'active' : ''}`}
                    onClick={() => setActiveTab('waste')}
                >
                    Waste Tracking
                </button>
                <button
                    className={`tab ${activeTab === 'sustainability' ? 'active' : ''}`}
                    onClick={() => setActiveTab('sustainability')}
                >
                    Sustainability
                </button>
            </div>

            {/* Forecasts Tab */}
            {activeTab === 'forecasts' && (
                <div className="tab-content">
                    {/* Accuracy Card */}
                    {accuracy && (
                        <div className="metrics-grid">
                            <div className="metric-card highlight">
                                <div className="metric-value">{accuracy.accuracy?.toFixed(1)}%</div>
                                <div className="metric-label">Forecast Accuracy</div>
                                <div className="metric-sublabel">{accuracy.period}</div>
                            </div>
                            <div className="metric-card">
                                <div className="metric-value">{accuracy.forecastsWithData}</div>
                                <div className="metric-label">Forecasts Evaluated</div>
                            </div>
                            <div className="metric-card">
                                <div className="metric-value">{accuracy.meanAbsoluteError?.toFixed(1)}</div>
                                <div className="metric-label">Mean Absolute Error</div>
                            </div>
                            <div className="metric-card">
                                <div className="metric-value">{accuracy.mape?.toFixed(1)}%</div>
                                <div className="metric-label">MAPE</div>
                            </div>
                        </div>
                    )}

                    {/* Weekly Forecasts */}
                    <div className="card">
                        <h2>Weekly Demand Forecasts</h2>
                        <div className="forecast-table-container">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Day</th>
                                        <th>Meal</th>
                                        <th>Predicted Demand</th>
                                        <th>Weather</th>
                                        <th>Schedule</th>
                                        <th>Confidence</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {forecasts.slice(0, 21).map((forecast, index) => (
                                        <tr key={forecast._id || index}>
                                            <td>{new Date(forecast.date).toLocaleDateString()}</td>
                                            <td style={{ textTransform: 'capitalize' }}>{forecast.dayOfWeek}</td>
                                            <td style={{ textTransform: 'capitalize' }}>{forecast.mealType}</td>
                                            <td className="font-bold">{forecast.predictedDemand}</td>
                                            <td style={{ textTransform: 'capitalize' }}>{forecast.weatherCondition}</td>
                                            <td style={{ textTransform: 'capitalize' }}>{forecast.academicSchedule}</td>
                                            <td>
                                                <div className="confidence-bar">
                                                    <div
                                                        className="confidence-fill"
                                                        style={{
                                                            width: `${forecast.confidence}%`,
                                                            backgroundColor: forecast.confidence >= 80 ? 'var(--success)' :
                                                                forecast.confidence >= 60 ? 'var(--warning)' : 'var(--error)'
                                                        }}
                                                    ></div>
                                                </div>
                                                <span className="confidence-text">{forecast.confidence}%</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Preparation Tab */}
            {activeTab === 'preparation' && (
                <div className="tab-content">
                    <div className="card">
                        <div className="card-header-row">
                            <h2>Preparation Recommendations</h2>
                            <div className="flex gap-2 align-center">
                                <span className="text-sm text-muted">For Date:</span>
                                <input
                                    type="date"
                                    value={selectedDate}
                                    onChange={handleDateChange}
                                    className="form-input"
                                    style={{ width: 'auto', padding: '0.25rem 0.5rem' }}
                                />
                            </div>
                        </div>

                        {preparations && (
                            <>
                                <p className="mb-2 text-sm">
                                    AI-driven guidance for <strong>{preparations.dayOfWeek}, {preparations.date}</strong>
                                </p>

                                <div className="prep-grid">
                                    {preparations.recommendations?.map((rec, index) => (
                                        <div key={index} className={`prep-card ${rec.foodItem.includes('Total') ? 'highlight' : ''}`}>
                                            <div className="prep-meal">{rec.mealType}</div>
                                            <div className="prep-item">{rec.foodItem}</div>
                                            <div className="prep-numbers">
                                                <div className="prep-stat">
                                                    <span className="stat-label">Predicted Demand</span>
                                                    <span className="stat-value">{rec.predictedDemand}</span>
                                                </div>
                                                <div className="prep-stat highlight">
                                                    <span className="stat-label">Recommended Qty</span>
                                                    <span className="stat-value">{rec.recommendedQuantity}</span>
                                                </div>
                                                <div className="prep-stat">
                                                    <span className="stat-label">Hist. Waste</span>
                                                    <span className="stat-value">{rec.historicalWaste}%</span>
                                                </div>
                                            </div>
                                            <div className="prep-reason">{rec.adjustmentReason}</div>
                                        </div>
                                    ))}
                                </div>

                                {preparations.notes && (
                                    <div className="mt-2 p-1 bg-gray-50 radius-md">
                                        <h4 className="text-sm font-bold mb-1">Sustainability Notes</h4>
                                        <ul className="text-xs text-muted pl-1">
                                            {preparations.notes.map((note, i) => (
                                                <li key={i}>{note}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Waste Tab */}
            {activeTab === 'waste' && (
                <div className="tab-content">
                    <div className="flex justify-between align-center mb-2">
                        <h2>Waste Tracking & Metrics</h2>
                        <button className="btn btn-primary" onClick={() => setShowWasteModal(true)}>
                            Record Waste Log
                        </button>
                    </div>

                    {wasteSummary && (
                        <div className="metrics-grid">
                            <div className="metric-card warning">
                                <div className="metric-value">{wasteSummary.wastePercentage?.toFixed(1)}%</div>
                                <div className="metric-label">Waste Percentage</div>
                            </div>
                            <div className="metric-card">
                                <div className="metric-value">{wasteSummary.totalWasted}</div>
                                <div className="metric-label">Total Wasted (servings)</div>
                            </div>
                            <div className="metric-card">
                                <div className="metric-value">{wasteSummary.totalWasteWeight?.toFixed(1)} kg</div>
                                <div className="metric-label">Waste Weight</div>
                            </div>
                            <div className="metric-card danger">
                                <div className="metric-value">₹{wasteSummary.estimatedCost?.toFixed(0)}</div>
                                <div className="metric-label">Estimated Loss</div>
                            </div>
                        </div>
                    )}

                    <div className="dashboard-grid-2">
                        <div className="card">
                            <h3>Record History</h3>
                            <div className="table-container" style={{ maxHeight: '400px' }}>
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Item</th>
                                            <th>Wasted</th>
                                            <th>Reason</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {wasteLogs.map((log) => (
                                            <tr key={log._id}>
                                                <td>{new Date(log.date).toLocaleDateString()}</td>
                                                <td>{log.foodItem}</td>
                                                <td className="text-error font-bold">{log.wastedQuantity}</td>
                                                <td>{log.reason}</td>
                                            </tr>
                                        ))}
                                        {wasteLogs.length === 0 && (
                                            <tr>
                                                <td colSpan="4" className="text-center text-muted">No logs recorded yet.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="card">
                            <h3>Insights: Top Wasted Items</h3>
                            {wasteSummary?.topWastedItems?.length > 0 ? (
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Food Item</th>
                                            <th>Total Wasted</th>
                                            <th>Waste %</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {wasteSummary.topWastedItems.map((item, index) => (
                                            <tr key={index}>
                                                <td>{item.foodItem}</td>
                                                <td>{item.totalWasted}</td>
                                                <td>
                                                    <span className={`badge ${item.wastePercent > 20 ? 'badge-error' : item.wastePercent > 10 ? 'badge-warning' : 'badge-success'}`}>
                                                        {item.wastePercent?.toFixed(1)}%
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <p className="empty-state">No specific item data available.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Sustainability Tab */}
            {activeTab === 'sustainability' && (
                <div className="tab-content">
                    {sustainability && (
                        <>
                            <div className="metrics-grid">
                                <div className="metric-card success large">
                                    <div className="metric-value" style={{ fontSize: '3rem' }}>{sustainability.sustainabilityScore}</div>
                                    <div className="metric-label">Eco-Score</div>
                                    <div className="metric-sublabel">A measure of efficiency</div>
                                </div>
                                <div className="metric-card">
                                    <div className="metric-value">{sustainability.wasteReductionPercent?.toFixed(1)}%</div>
                                    <div className="metric-label">Waste Reduction</div>
                                </div>
                                <div className="metric-card">
                                    <div className="metric-value">{sustainability.foodUtilizationPercent?.toFixed(1)}%</div>
                                    <div className="metric-label">Utilization Rate</div>
                                </div>
                                <div className="metric-card eco">
                                    <div className="metric-value">{sustainability.co2SavedKg?.toFixed(1)} kg</div>
                                    <div className="metric-label">CO₂ Offset</div>
                                </div>
                            </div>

                            <div className="card">
                                <div className="flex justify-between align-center">
                                    <h2>Sustainability Performance</h2>
                                    <button className="btn btn-secondary btn-sm" onClick={() => sustainabilityAPI.downloadCSV()}>
                                        Export Report
                                    </button>
                                </div>
                                <div className="sustainability-details mt-1">
                                    <div className="detail-row">
                                        <span className="detail-label">Forecast Accuracy</span>
                                        <span className="detail-value">{sustainability.forecastAccuracy?.toFixed(1)}%</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="detail-label">Total Meals Served</span>
                                        <span className="detail-value">{sustainability.totalMealsServed}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="detail-label">Waste Per Meal</span>
                                        <span className="detail-value">{sustainability.wastePerMeal?.toFixed(2)} units</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="detail-label">Estimated Cost Savings</span>
                                        <span className="detail-value text-primary font-bold">₹{sustainability.costSavings?.toFixed(0)}</span>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* MODAL - WASTE ENTRY */}
            {showWasteModal && (
                <div className="premium-modal-overlay">
                    <div className="premium-modal animate-slide-up">
                        <div className="modal-top">
                            <h3>Record Preparation Waste</h3>
                            <button className="close-x" onClick={() => setShowWasteModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleWasteSubmit} className="premium-form">
                            <div className="form-row">
                                <div className="field-group">
                                    <label>Service Date</label>
                                    <input
                                        type="date"
                                        value={wasteForm.date}
                                        max={new Date().toISOString().split('T')[0]}
                                        onChange={(e) => setWasteForm({ ...wasteForm, date: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="field-group">
                                    <label>Meal Session</label>
                                    <select value={wasteForm.mealType} onChange={(e) => setWasteForm({ ...wasteForm, mealType: e.target.value })}>
                                        <option value="breakfast">Breakfast</option>
                                        <option value="lunch">Lunch</option>
                                        <option value="snacks">Snacks</option>
                                        <option value="dinner">Dinner</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Food Item Description</label>
                                <input type="text" placeholder="e.g., Basmati Rice, Chicken Gravy" value={wasteForm.foodItem} onChange={(e) => setWasteForm({ ...wasteForm, foodItem: e.target.value })} required />
                            </div>
                            <div className="form-row">
                                <div className="field-group">
                                    <label>Prepared (Units)</label>
                                    <input type="number" value={wasteForm.preparedQuantity} onChange={(e) => setWasteForm({ ...wasteForm, preparedQuantity: parseInt(e.target.value) })} required />
                                </div>
                                <div className="field-group">
                                    <label>Discarded (Units)</label>
                                    <input type="number" value={wasteForm.wastedQuantity} onChange={(e) => setWasteForm({ ...wasteForm, wastedQuantity: parseInt(e.target.value) })} required />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Primary Waste Reason</label>
                                <textarea rows="2" placeholder="Over-preparation, spoilage, or low turnout..." value={wasteForm.reason} onChange={(e) => setWasteForm({ ...wasteForm, reason: e.target.value })}></textarea>
                            </div>
                            <div className="form-actions mt-3">
                                <button type="button" className="btn-cancel" onClick={() => setShowWasteModal(false)}>Discard</button>
                                <button type="submit" className="btn-submit" disabled={loading}>Confirm Log</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StaffForecast;
