import { useEffect, useState } from 'react'
import { getRiskAssessment, type RiskAssessment } from '../api/risk'

const levelColor: Record<string, string> = {
  conservative: '#22d3ee',
  moderate: '#f59e0b',
  aggressive: '#f43f5e',
}

const allocationColors: Record<string, string> = {
  equity: '#6366f1',
  debt: '#22d3ee',
  gold: '#f59e0b',
  cash: '#10b981',
}

export default function Risk() {
  const [data, setData] = useState<RiskAssessment | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getRiskAssessment()
      .then(setData)
      .catch((err: unknown) => {
        const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
        setError(detail ?? 'Failed to load risk assessment')
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="page"><p className="text-muted">Analyzing your financial profile...</p></div>
  if (error) return <div className="page"><p className="error">{error}</p></div>
  if (!data) return null

  const color = levelColor[data.risk_level] ?? '#6366f1'
  const breakdown = Object.entries(data.score_breakdown) as [string, number][]
  const allocation = Object.entries(data.recommended_allocation) as [string, number][]

  return (
    <div className="page">
      <h2>Risk Assessment</h2>

      {/* Score hero */}
      <div className="risk-hero">
        <div className="risk-score-ring" style={{ '--ring-color': color } as React.CSSProperties}>
          <span className="risk-score-num">{data.risk_score}</span>
          <span className="risk-score-max">/100</span>
        </div>
        <div className="risk-hero-info">
          <span className="risk-level-badge" style={{ background: `${color}22`, color }}>{data.risk_level.toUpperCase()}</span>
          <p className="risk-description">{data.description}</p>
        </div>
      </div>

      {/* Warnings */}
      {data.warnings.length > 0 && (
        <div className="risk-warnings">
          {data.warnings.map((w, i) => (
            <div key={i} className="risk-warning-row">⚠️ {w}</div>
          ))}
        </div>
      )}

      <div className="risk-grid">
        {/* Score breakdown */}
        <div className="chart-card">
          <h3>Score Breakdown</h3>
          <div className="breakdown-list">
            {breakdown.map(([key, val]) => (
              <div key={key} className="breakdown-row">
                <div className="breakdown-label">
                  <span className="capitalize">{key.replace(/_/g, ' ')}</span>
                  <span style={{ color }}>{val}<span className="text-muted">/25</span></span>
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${(val / 25) * 100}%`, background: color }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recommended allocation */}
        <div className="chart-card">
          <h3>Recommended Allocation</h3>
          <div className="allocation-bars">
            {allocation.map(([key, pct]) => (
              <div key={key} className="allocation-row">
                <div className="breakdown-label">
                  <span className="capitalize" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: allocationColors[key] ?? '#6366f1', display: 'inline-block' }} />
                    {key}
                  </span>
                  <span style={{ color: allocationColors[key] ?? '#6366f1', fontWeight: 700 }}>{pct}%</span>
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${pct}%`, background: allocationColors[key] ?? '#6366f1' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="risk-grid">
        {/* Suitable investments */}
        <div className="chart-card">
          <h3>Suitable Investments</h3>
          <div className="suitable-list">
            {data.suitable_investments.map((inv, i) => (
              <div key={i} className="suitable-item">
                <span className="suitable-dot" style={{ background: color }} />
                {inv}
              </div>
            ))}
          </div>
        </div>

        {/* Profile summary */}
        <div className="chart-card">
          <h3>Profile Summary</h3>
          <div className="category-table">
            <table>
              <tbody>
                <tr><td className="text-muted">Monthly Expense</td><td>₹{data.profile_summary.monthly_expense.toLocaleString()}</td></tr>
                <tr><td className="text-muted">Total Budget</td><td>₹{data.profile_summary.total_budget.toLocaleString()}</td></tr>
                <tr>
                  <td className="text-muted">Budget Utilization</td>
                  <td style={{ color: data.profile_summary.budget_utilization_pct > 100 ? 'var(--danger)' : 'var(--success)' }}>
                    {data.profile_summary.budget_utilization_pct.toFixed(1)}%
                  </td>
                </tr>
                <tr><td className="text-muted">Total Goals</td><td>{data.profile_summary.total_goals}</td></tr>
                <tr><td className="text-muted">Avg Goal Progress</td><td>{data.profile_summary.avg_goal_progress_pct}%</td></tr>
                <tr><td className="text-muted">Holdings</td><td>{data.profile_summary.total_holdings}</td></tr>
                <tr>
                  <td className="text-muted">Portfolio P&L</td>
                  <td style={{ color: data.profile_summary.portfolio_pl_pct >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                    {data.profile_summary.portfolio_pl_pct}%
                  </td>
                </tr>
                <tr>
                  <td className="text-muted">Investment Types</td>
                  <td>{data.profile_summary.investment_types.length ? data.profile_summary.investment_types.join(', ') : '—'}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
