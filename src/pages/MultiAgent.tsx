import { useEffect, useState } from 'react'
import { getMultiAgentRecommend, type MultiAgentReport } from '../api/agent'

const urgencyColor: Record<string, string> = {
  critical: 'var(--danger)',
  high: '#f59e0b',
  medium: 'var(--primary)',
  low: 'var(--success)',
}

const statusColor = (s: string) =>
  s === 'critical' || s === 'exceeded' || s === 'insufficient' ? 'var(--danger)'
  : s === 'good' || s === 'sufficient' ? 'var(--success)'
  : '#f59e0b'

export default function MultiAgent() {
  const [data, setData] = useState<MultiAgentReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getMultiAgentRecommend()
      .then(setData)
      .catch((e) => setError(e?.response?.data?.detail ?? 'Failed to load'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="page"><p className="text-muted">Loading...</p></div>
  if (error) return <div className="page"><p className="error">{error}</p></div>
  if (!data) return null

  const { agents } = data

  return (
    <div className="page">
      <h2>🤖 Multi-Agent Advisor</h2>

      {/* Health Score */}
      <div className="stat-cards" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <span className="stat-label">Health Score</span>
          <span className="stat-value" style={{ color: statusColor(data.financial_health_status) }}>
            {data.financial_health_score}
          </span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Status</span>
          <span className="stat-value" style={{ fontSize: 16, textTransform: 'capitalize', color: statusColor(data.financial_health_status) }}>
            {data.financial_health_status}
          </span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Budget</span>
          <span className="stat-value" style={{ fontSize: 16, color: statusColor(agents.budget.status) }}>
            {agents.budget.utilization_pct}% used
          </span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Savings Capacity</span>
          <span className="stat-value" style={{ fontSize: 16, color: agents.savings.savings_capacity < 0 ? 'var(--danger)' : 'var(--success)' }}>
            ₹{agents.savings.savings_capacity.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Agent Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 28 }}>

        {/* Risk */}
        <div className="card">
          <div style={{ fontWeight: 600, marginBottom: 10 }}>🛡️ Risk Agent</div>
          <div className="text-muted" style={{ fontSize: 13, marginBottom: 6 }}>
            Score: <strong>{agents.risk.risk_score}</strong> · <span style={{ textTransform: 'capitalize' }}>{agents.risk.risk_level}</span>
          </div>
          <div style={{ fontSize: 12, marginBottom: 8 }}>
            {Object.entries(agents.risk.recommended_allocation).map(([k, v]) => (
              <span key={k} style={{ marginRight: 8 }}><strong>{k}</strong>: {v}%</span>
            ))}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {agents.risk.suitable_investments.join(' · ')}
          </div>
          {agents.risk.warnings.length > 0 && (
            <ul style={{ margin: '8px 0 0', paddingLeft: 16, fontSize: 12, color: 'var(--danger)' }}>
              {agents.risk.warnings.map((w, i) => <li key={i}>{w}</li>)}
            </ul>
          )}
        </div>

        {/* Budget */}
        <div className="card">
          <div style={{ fontWeight: 600, marginBottom: 10 }}>🎯 Budget Agent</div>
          <div style={{ fontSize: 13, color: statusColor(agents.budget.status), marginBottom: 6, textTransform: 'capitalize' }}>
            {agents.budget.status}
          </div>
          <div style={{ fontSize: 13 }}>{agents.budget.alert}</div>
        </div>

        {/* Savings */}
        <div className="card">
          <div style={{ fontWeight: 600, marginBottom: 10 }}>💰 Savings Agent</div>
          <div style={{ fontSize: 13, marginBottom: 6 }}>
            Rate: <strong style={{ color: agents.savings.savings_rate_pct < 0 ? 'var(--danger)' : 'var(--success)' }}>
              {agents.savings.savings_rate_pct}%
            </strong>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
            Emergency fund target: ₹{agents.savings.emergency_fund.target.toLocaleString()} —{' '}
            <span style={{ color: statusColor(agents.savings.emergency_fund.status) }}>
              {agents.savings.emergency_fund.status}
            </span>
          </div>
          <div style={{ fontSize: 12 }}>
            Allocation → Goals: ₹{agents.savings.monthly_allocation.goals} · EF: ₹{agents.savings.monthly_allocation.emergency_fund} · Surplus: ₹{agents.savings.monthly_allocation.investable_surplus}
          </div>
        </div>

        {/* Investment */}
        <div className="card">
          <div style={{ fontWeight: 600, marginBottom: 10 }}>💼 Investment Agent</div>
          <div style={{ fontSize: 13, marginBottom: 6, textTransform: 'capitalize', color: statusColor(agents.investment.status === 'not_started' ? 'critical' : 'good') }}>
            {agents.investment.status.replace('_', ' ')}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
            Invested: ₹{agents.investment.total_invested.toLocaleString()} · Value: ₹{agents.investment.current_value.toLocaleString()}
          </div>
          <div style={{ fontSize: 13 }}>{agents.investment.insight}</div>
        </div>
      </div>

      {/* Recommendations */}
      <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 12 }}>📋 Recommendations</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {data.recommendations.map((r) => (
          <div key={r.priority} className="card" style={{ display: 'flex', gap: 14, alignItems: 'flex-start', padding: '12px 16px' }}>
            <span style={{ fontWeight: 700, fontSize: 18, color: 'var(--text-muted)', minWidth: 24 }}>#{r.priority}</span>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: urgencyColor[r.urgency] ?? '#888', textTransform: 'uppercase' }}>{r.urgency}</span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{r.category.replace('_', ' ')}</span>
              </div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{r.action}</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{r.detail}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
