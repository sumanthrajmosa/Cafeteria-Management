import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { queueAPI } from '../services/api';

function Ethics() {
  const { isAdmin, isStaff, isStudent, user } = useAuth();
  const [fairness, setFairness] = useState(null);
  const [loadingFairness, setLoadingFairness] = useState(true);

  useEffect(() => {
    loadFairness();
  }, []);

  const loadFairness = async () => {
    try {
      const res = await queueAPI.getFairness(7);
      setFairness(res.data);
    } catch (err) {
      console.error('Failed to load fairness data:', err);
    } finally {
      setLoadingFairness(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'var(--success)';
    if (score >= 50) return 'var(--warning)';
    return 'var(--error)';
  };

  const getScoreBadge = (score) => {
    if (score >= 80) return 'badge-success';
    if (score >= 50) return 'badge-warning';
    return 'badge-error';
  };

  const roleLabel = isAdmin ? 'Administrator' : isStaff ? 'Staff' : 'Student';

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Ethics & Transparency</h1>
        <p className="page-subtitle">
          Fairness principles, operational rules, and live equity metrics — tailored for your role as {roleLabel}
        </p>
      </div>

      {/* ========== LIVE FAIRNESS INDICATORS (US-ET-8) ========== */}
      <div className="card" style={{ marginBottom: 'var(--spacing-xl)' }}>
        <div className="card-header">
          <h3 className="card-title">Live Fairness Indicators</h3>
          {fairness && (
            <span className={`badge ${getScoreBadge(fairness.fairnessScore)}`}>
              Score: {fairness.fairnessScore}/100
            </span>
          )}
        </div>

        {loadingFairness ? (
          <div className="text-center text-muted">Loading fairness metrics...</div>
        ) : fairness ? (
          <>
            <div className="dashboard-grid">
              <div className="stat-card">
                <div className="stat-card-label">Fairness Score</div>
                <div className="stat-card-value" style={{ color: getScoreColor(fairness.fairnessScore) }}>
                  {fairness.fairnessScore}
                </div>
                <div className="stat-card-subtext">out of 100</div>
              </div>

              <div className="stat-card">
                <div className="stat-card-label">FIFO Compliance</div>
                <div className="stat-card-value" style={{ color: getScoreColor(fairness.fifoCompliance) }}>
                  {fairness.fifoCompliance?.toFixed(1)}%
                </div>
                <div className="stat-card-subtext">Correct serving order</div>
              </div>

              <div className="stat-card">
                <div className="stat-card-label">Avg Wait Time</div>
                <div className="stat-card-value primary">
                  {fairness.avgWaitMinutes?.toFixed(1)}
                </div>
                <div className="stat-card-subtext">Minutes</div>
              </div>

              <div className="stat-card">
                <div className="stat-card-label">Tokens Served</div>
                <div className="stat-card-value">
                  {fairness.totalTokens}
                </div>
                <div className="stat-card-subtext">{fairness.period}</div>
              </div>
            </div>

            {/* Per-slot table visible to Admin & Staff */}
            {(isAdmin || isStaff) && fairness.slotMetrics?.length > 0 && (
              <div>
                <div className="text-sm font-bold" style={{ marginBottom: 'var(--spacing-sm)' }}>
                  Per-Slot Breakdown (Admin/Staff)
                </div>
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Meal</th>
                        <th>Served</th>
                        <th>Avg Wait</th>
                        <th>Min</th>
                        <th>Max</th>
                        <th>Std Dev</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fairness.slotMetrics.map((slot, idx) => (
                        <tr key={idx}>
                          <td>{slot.date}</td>
                          <td style={{ textTransform: 'capitalize' }}>{slot.mealType}</td>
                          <td>{slot.tokensServed}</td>
                          <td>{slot.avgWaitMinutes?.toFixed(1)} min</td>
                          <td>{slot.minWaitMinutes?.toFixed(1)}</td>
                          <td>{slot.maxWaitMinutes?.toFixed(1)}</td>
                          <td>
                            <span className={`badge ${slot.stdDevWaitMinutes < 2 ? 'badge-success' : slot.stdDevWaitMinutes < 5 ? 'badge-warning' : 'badge-error'}`}>
                              ±{slot.stdDevWaitMinutes?.toFixed(1)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {(!fairness.slotMetrics || fairness.slotMetrics.length === 0) && (
              <div className="text-center text-muted" style={{ padding: 'var(--spacing-md)' }}>
                No service data in the last 7 days to compute per-slot metrics.
              </div>
            )}
          </>
        ) : (
          <div className="text-center text-muted">Unable to load fairness data.</div>
        )}
      </div>

      {/* ========== ROLE-SPECIFIC CONTENT ========== */}
      <div className="dashboard-grid-2">

        {/* QUEUE RULES — Visible to ALL */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Queue Management Rules</h3>
            <span className="badge badge-info">All Users</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
            <div className="queue-item">
              <div>
                <div className="font-bold">Strict FIFO Ordering</div>
                <div className="text-xs text-muted">
                  Positions assigned by booking timestamp. No pay-to-skip or VIP priority.
                </div>
              </div>
              <span className="badge badge-success">Enforced</span>
            </div>
            <div className="queue-item">
              <div>
                <div className="font-bold">Dynamic Wait Calculation</div>
                <div className="text-xs text-muted">
                  Based on actual prep time of items ahead + 1 min buffer per order.
                </div>
              </div>
              <span className="badge badge-success">Transparent</span>
            </div>
            <div className="queue-item">
              <div>
                <div className="font-bold">Slot Capacity Enforcement</div>
                <div className="text-xs text-muted">
                  Once booked count reaches capacity, the slot automatically locks.
                </div>
              </div>
              <span className="badge badge-success">Automatic</span>
            </div>
            <div className="queue-item">
              <div>
                <div className="font-bold">No-Show Policy</div>
                <div className="text-xs text-muted">
                  Repeated no-shows incur point penalties and are tracked in abuse reports.
                </div>
              </div>
              <span className="badge badge-warning">Tracked</span>
            </div>
          </div>
        </div>

        {/* DATA PRIVACY — Visible to ALL */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Data Privacy & User Rights</h3>
            <span className="badge badge-info">All Users</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
            <div className="queue-item">
              <div>
                <div className="font-bold">Data Minimization</div>
                <div className="text-xs text-muted">
                  Only essential data collected: orders, profile info, and timestamps.
                </div>
              </div>
              <span className="badge badge-success">✓</span>
            </div>
            <div className="queue-item">
              <div>
                <div className="font-bold">Purpose Limitation</div>
                <div className="text-xs text-muted">
                  Data used solely for cafeteria services. Never sold or shared.
                </div>
              </div>
              <span className="badge badge-success">✓</span>
            </div>
            <div className="queue-item">
              <div>
                <div className="font-bold">Right to Deletion</div>
                <div className="text-xs text-muted">
                  Users can request complete removal of their account and personal data.
                </div>
              </div>
              <span className="badge badge-success">✓</span>
            </div>
            <div className="queue-item">
              <div>
                <div className="font-bold">No Individual Profiling</div>
                <div className="text-xs text-muted">
                  AI forecasts aggregate demand only — no per-student eating habit tracking.
                </div>
              </div>
              <span className="badge badge-success">✓</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========== STUDENT-SPECIFIC SECTION ========== */}
      {isStudent && (
        <div className="card" style={{ marginTop: 'var(--spacing-xl)' }}>
          <div className="card-header">
            <h3 className="card-title">Your Rights as a Student</h3>
            <span className="badge badge-info">Student</span>
          </div>
          <div className="dashboard-grid-3" style={{ marginBottom: 0 }}>
            <div>
              <div className="text-sm text-muted mb-1">Equal Queue Access</div>
              <div className="font-bold">Your token position is based entirely on when you booked — no staff overrides.</div>
            </div>
            <div>
              <div className="text-sm text-muted mb-1">Transparent Incentives</div>
              <div className="font-bold">Point rules are published openly. You can view exactly how and when points are awarded or deducted.</div>
            </div>
            <div>
              <div className="text-sm text-muted mb-1">Live Wait Visibility</div>
              <div className="font-bold">See your real-time queue position and estimated wait. The system never hides your place in line.</div>
            </div>
          </div>
        </div>
      )}

      {/* ========== STAFF-SPECIFIC SECTION ========== */}
      {(isStaff || isAdmin) && (
        <div className="card" style={{ marginTop: 'var(--spacing-xl)' }}>
          <div className="card-header">
            <h3 className="card-title">Staff Serving Guidelines</h3>
            <span className="badge badge-warning">Staff / Admin</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
            <div className="queue-item">
              <div>
                <div className="font-bold">Call-Next Only</div>
                <div className="text-xs text-muted">
                  Staff must use "Call Next" — the system always picks the next token in FIFO order. Manual selection is disabled.
                </div>
              </div>
              <span className="badge badge-error">Restricted</span>
            </div>
            <div className="queue-item">
              <div>
                <div className="font-bold">No Queue Reordering</div>
                <div className="text-xs text-muted">
                  There is no API or UI to reorder tokens. This eliminates favoritism risk.
                </div>
              </div>
              <span className="badge badge-error">Locked</span>
            </div>
            <div className="queue-item">
              <div>
                <div className="font-bold">All Actions Logged</div>
                <div className="text-xs text-muted">
                  Every call-next, serve, and status change is recorded in the immutable audit log with your user ID.
                </div>
              </div>
              <span className="badge badge-warning">Audited</span>
            </div>
          </div>
        </div>
      )}

      {/* ========== ADMIN-ONLY: AI TRANSPARENCY ========== */}
      {isAdmin && (
        <div className="card" style={{ marginTop: 'var(--spacing-xl)' }}>
          <div className="card-header">
            <h3 className="card-title">AI Model Transparency</h3>
            <span className="badge badge-error">Admin Only</span>
          </div>

          <div className="dashboard-grid-2">
            <div>
              <div className="text-sm text-muted mb-1">Input Features Used</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                {['Historical Sales Volume', 'Weather Conditions (via API)', 'Academic Calendar (Holidays, Exams)', 'Day of Week + Meal Type'].map((f, i) => (
                  <div key={i} className="queue-item" style={{ padding: 'var(--spacing-sm) var(--spacing-md)' }}>
                    <span className="text-sm">{f}</span>
                    <span className="badge badge-success">Active</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted mb-1">Safeguards</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                <div className="queue-item" style={{ padding: 'var(--spacing-sm) var(--spacing-md)' }}>
                  <span className="text-sm">No individual profiling</span>
                  <span className="badge badge-success">✓</span>
                </div>
                <div className="queue-item" style={{ padding: 'var(--spacing-sm) var(--spacing-md)' }}>
                  <span className="text-sm">Aggregate demand forecasting only</span>
                  <span className="badge badge-success">✓</span>
                </div>
                <div className="queue-item" style={{ padding: 'var(--spacing-sm) var(--spacing-md)' }}>
                  <span className="text-sm">Model accuracy tracked via RMSE</span>
                  <span className="badge badge-success">✓</span>
                </div>
                <div className="queue-item" style={{ padding: 'var(--spacing-sm) var(--spacing-md)' }}>
                  <span className="text-sm">Immutable audit logs for all actions</span>
                  <span className="badge badge-success">✓</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========== ADMIN-ONLY: ACCOUNTABILITY ========== */}
      {isAdmin && (
        <div className="card" style={{ marginTop: 'var(--spacing-xl)' }}>
          <div className="card-header">
            <h3 className="card-title">Admin Accountability</h3>
            <span className="badge badge-error">Admin Only</span>
          </div>
          <div className="dashboard-grid-3" style={{ marginBottom: 0 }}>
            <div>
              <div className="text-sm text-muted mb-1">Audit Logs</div>
              <div className="font-bold">
                All admin actions (settings changes, user blocks, role changes) are permanently recorded.
              </div>
              <a href="/audit-logs" className="btn btn-secondary btn-sm" style={{ marginTop: 'var(--spacing-sm)' }}>
                View Audit Logs
              </a>
            </div>
            <div>
              <div className="text-sm text-muted mb-1">Abuse Detection</div>
              <div className="font-bold">
                The system auto-flags users with 30%+ no-show rate. Review flagged users in incentive config.
              </div>
              <a href="/admin/incentive-config" className="btn btn-secondary btn-sm" style={{ marginTop: 'var(--spacing-sm)' }}>
                View Abuse Report
              </a>
            </div>
            <div>
              <div className="text-sm text-muted mb-1">Fairness Review</div>
              <div className="font-bold">
                Use per-slot fairness metrics above to verify equitable service. Investigate slots with high std deviation.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Ethics;
