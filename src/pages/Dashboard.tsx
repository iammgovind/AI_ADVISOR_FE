import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts'
import { getDashboard, type DashboardData } from '../api/dashboard'
import { useAuthStore } from '../store/auth'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const COLORS = ['#6366f1','#22d3ee','#f59e0b','#10b981','#f43f5e','#a78bfa','#fb923c','#34d399']
const alertColor: Record<string, string> = { ok: 'var(--success)', warning: '#f59e0b', exceeded: 'var(--danger)' }

export default function Dashboard() {
  const user = useAuthStore((s) => s.user)
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [data, setData] = useState<DashboardData | null>(null)

  useEffect(() => {
    getDashboard(year, month).then(setData).catch(() => setData(null))
  }, [year, month])

  const trendData = data?.spending_trend.map((t) => ({
    label: `${MONTHS[t.month - 1]} ${t.year}`,
    total: t.total,
  }))

  const mom = data?.expense_summary.month_over_month_change_pct ?? 0
  const momUp = mom >= 0

  return (
    <div className="page">
      <header className="dashboard-intro">
        <div>
          <span className="eyebrow">FINANCIAL PULSE</span>
          <h2>Welcome back, {user?.full_name ?? 'User'} <span className="wave">👋</span></h2>
          <p className="dashboard-subtitle">A clear view of your money, one decision at a time.</p>
        </div>
        <div className="dashboard-actions">
          <NavLink to="/advisor" className="dashboard-advisor-link" title="Open FinanceAI Advisor" aria-label="Open FinanceAI Advisor">🤖✨ FinanceAI Advisor ✨</NavLink>
          <div className="period-stamp">
            <strong>{MONTHS[month - 1]} {year}</strong>
          </div>
        </div>
      </header>

      <div className="controls row">
        <select className="period-select" value={month} onChange={(e) => setMonth(+e.target.value)}>
          {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
        </select>
        <input className="period-year" type="number" value={year} onChange={(e) => setYear(+e.target.value)} min={2020} max={2100} style={{ width: 90 }} />
      </div>

      {!data ? (
        <p className="empty">No data for this period.</p>
      ) : (
        <>
          {/* Stat cards */}
          <div className="stat-cards">
            <div className="stat-card">
              <span className="stat-label">Total Spent</span>
              <span className="stat-value">₹{data.expense_summary.total_this_month.toFixed(2)}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Transactions</span>
              <span className="stat-value">{data.expense_summary.this_month.count}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">vs Last Month</span>
              <span className="stat-value" style={{ color: momUp ? 'var(--danger)' : 'var(--success)', fontSize: 20 }}>
                {momUp ? '▲' : '▼'} {Math.abs(mom).toFixed(1)}%
              </span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Top Category</span>
              <span className="stat-value" style={{ fontSize: 18, textTransform: 'capitalize' }}>
                {data.expense_summary.top_category}
              </span>
            </div>
          </div>

          {/* Budget overview */}
          {data.budget_overview.total_budgets > 0 && (
            <>
              <h3>Budget Overview</h3>
              <div className="stat-cards" style={{ marginBottom: 12 }}>
                <div className="stat-card">
                  <span className="stat-label">Overall Utilization</span>
                  <span className="stat-value">{data.budget_overview.overall_utilization_pct.toFixed(1)}%</span>
                </div>
                <div className="stat-card">
                  <span className="stat-label">Exceeded</span>
                  <span className="stat-value" style={{ color: 'var(--danger)' }}>{data.budget_overview.exceeded}</span>
                </div>
                <div className="stat-card">
                  <span className="stat-label">Warning</span>
                  <span className="stat-value" style={{ color: '#f59e0b' }}>{data.budget_overview.warning}</span>
                </div>
                <div className="stat-card">
                  <span className="stat-label">On Track</span>
                  <span className="stat-value" style={{ color: 'var(--success)' }}>{data.budget_overview.ok}</span>
                </div>
              </div>

              {data.budget_overview.alerts.length > 0 && (
                <div className="budget-alerts">
                  {data.budget_overview.alerts.map((a) => (
                    <div key={a.budget_id} className="budget-alert-row">
                      <span className={`badge badge-${a.category}`}>{a.category}</span>
                      <span className={`alert-badge alert-${a.alert}`}>{a.alert}</span>
                      <div className="progress-track" style={{ flex: 1 }}>
                        <div className="progress-fill" style={{ width: `${Math.min(a.utilization_pct, 100)}%`, background: alertColor[a.alert] }} />
                      </div>
                      <span style={{ color: alertColor[a.alert], fontSize: 13, whiteSpace: 'nowrap' }}>
                        {a.utilization_pct.toFixed(1)}% — ₹{a.spent.toFixed(2)} / ₹{a.limit_amount.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Spending trend */}
          <h3>Spending Trend</h3>
          <div className="chart-card" style={{ marginBottom: 24 }}>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={trendData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="label" tick={{ fill: '#8892a4', fontSize: 12 }} />
                <YAxis tick={{ fill: '#8892a4', fontSize: 12 }} />
                <Tooltip formatter={(v) => `₹${Number(v).toFixed(2)}`} contentStyle={{ background: '#1a1d27', border: '1px solid #2e3250' }} />
                <Area type="monotone" dataKey="total" stroke="#6366f1" fill="url(#trendGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Category breakdown */}
          <h3>Category Breakdown (All Time)</h3>
          <div className="charts-grid">
            <div className="chart-card">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data.category_breakdown} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                  <XAxis dataKey="category" tick={{ fill: '#8892a4', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#8892a4', fontSize: 12 }} />
                  <Tooltip formatter={(v) => `₹${Number(v).toFixed(2)}`} contentStyle={{ background: '#1a1d27', border: '1px solid #2e3250' }} />
                  <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                    {data.category_breakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-card">
              <div className="category-table">
                <table>
                  <thead><tr><th>Category</th><th>Total</th><th>Count</th></tr></thead>
                  <tbody>
                    {data.category_breakdown.map((c) => (
                      <tr key={c.category}>
                        <td className="capitalize">{c.category}</td>
                        <td>₹{c.total.toFixed(2)}</td>
                        <td>{c.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
