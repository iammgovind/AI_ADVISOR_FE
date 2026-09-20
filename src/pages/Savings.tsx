import { useEffect, useState } from 'react'
import { getSavingsPlan, type SavingsPlan } from '../api/savings'

export default function Savings() {
  const [data, setData] = useState<SavingsPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getSavingsPlan()
      .then(setData)
      .catch((err: unknown) => {
        const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
        setError(detail ?? 'Failed to load savings plan')
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="page"><p className="text-muted">Building your savings plan...</p></div>
  if (error) return <div className="page"><p className="error">{error}</p></div>
  if (!data) return null

  const capacityColor = data.savings_capacity >= 0 ? 'var(--success)' : 'var(--danger)'
  const rateColor = data.savings_rate_pct >= 30 ? 'var(--success)' : data.savings_rate_pct >= 0 ? '#f59e0b' : 'var(--danger)'
  const efPct = Math.min(100, (data.monthly_allocation.emergency_fund / (data.emergency_fund.target || 1)) * 100)

  return (
    <div className="page">
      <h2>Savings Plan</h2>

      {/* Top stat cards */}
      <div className="stat-cards">
        <div className="stat-card">
          <span className="stat-label">Savings Capacity</span>
          <span className="stat-value" style={{ color: capacityColor, fontSize: 20 }}>
            {data.savings_capacity >= 0 ? '+' : ''}₹{data.savings_capacity.toLocaleString()}
          </span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Savings Rate</span>
          <span className="stat-value" style={{ color: rateColor, fontSize: 20 }}>
            {data.savings_rate_pct.toFixed(1)}%
          </span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Monthly Expense</span>
          <span className="stat-value" style={{ fontSize: 20 }}>₹{data.monthly_expense.toLocaleString()}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Total Budget</span>
          <span className="stat-value" style={{ fontSize: 20 }}>₹{data.total_budget.toLocaleString()}</span>
        </div>
      </div>

      {/* Recommendations */}
      {data.recommendations.length > 0 && (
        <div className="risk-warnings" style={{ marginBottom: 24 }}>
          {data.recommendations.map((r, i) => (
            <div key={i} className="savings-rec-row">{r}</div>
          ))}
        </div>
      )}

      <div className="risk-grid">
        {/* Monthly allocation */}
        <div className="chart-card">
          <h3>Monthly Allocation</h3>
          <div className="breakdown-list">
            {([
              { label: 'Goals', value: data.monthly_allocation.goals, color: '#6366f1' },
              { label: 'Emergency Fund', value: data.monthly_allocation.emergency_fund, color: '#f59e0b' },
              { label: 'Investable Surplus', value: data.monthly_allocation.investable_surplus, color: '#10b981' },
            ] as const).map((item) => (
              <div key={item.label} className="breakdown-row">
                <div className="breakdown-label">
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: item.color, display: 'inline-block' }} />
                    {item.label}
                  </span>
                  <span style={{ color: item.color, fontWeight: 600 }}>₹{item.value.toLocaleString()}</span>
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{
                    width: data.monthly_allocation.total_allocated > 0
                      ? `${(item.value / data.monthly_allocation.total_allocated) * 100}%`
                      : '0%',
                    background: item.color
                  }} />
                </div>
              </div>
            ))}
            <div className="savings-total-row">
              <span className="text-muted">Total Allocated</span>
              <span style={{ fontWeight: 700 }}>₹{data.monthly_allocation.total_allocated.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Emergency fund */}
        <div className="chart-card">
          <h3>Emergency Fund</h3>
          <div className="ef-status">
            <span className={`alert-badge ${data.emergency_fund.status === 'sufficient' ? 'alert-ok' : 'alert-warning'}`}>
              {data.emergency_fund.status}
            </span>
          </div>
          <div className="breakdown-list" style={{ marginTop: 16 }}>
            <div className="breakdown-row">
              <div className="breakdown-label">
                <span className="text-muted">Target</span>
                <span>₹{data.emergency_fund.target.toLocaleString()}</span>
              </div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${efPct}%`, background: '#f59e0b' }} />
              </div>
            </div>
          </div>
          <div className="category-table" style={{ marginTop: 16 }}>
            <table>
              <tbody>
                <tr><td className="text-muted">Monthly Contribution</td><td>₹{data.emergency_fund.monthly_contribution_suggested.toLocaleString()}</td></tr>
                <tr><td className="text-muted">Months to Build</td><td>{data.emergency_fund.months_to_build}</td></tr>
                <tr><td className="text-muted">3M Avg Expense</td><td>₹{data.avg_monthly_expense_3m.toLocaleString()}</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Goal plans */}
      {data.goal_plans.length > 0 && (
        <>
          <h3>Goal-wise Savings Plan</h3>
          <div className="category-table">
            <table>
              <thead>
                <tr><th>Goal</th><th>Remaining</th><th>Months Left</th><th>Monthly Required</th><th>Feasible</th></tr>
              </thead>
              <tbody>
                {data.goal_plans.map((g) => (
                  <tr key={g.goal_id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{g.title}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Target: {g.target_date}</div>
                    </td>
                    <td>₹{g.remaining_amount.toLocaleString()}</td>
                    <td>{g.months_remaining}</td>
                    <td style={{ fontWeight: 600 }}>₹{g.monthly_required.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                    <td>
                      <span className={`alert-badge ${g.feasible ? 'alert-ok' : 'alert-exceeded'}`}>
                        {g.feasible ? 'Yes' : 'No'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
