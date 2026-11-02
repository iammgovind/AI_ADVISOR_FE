import { useEffect, useState } from 'react'
import { getInvestments, createInvestment, updateInvestment, deleteInvestment, type Investment } from '../api/investments'

const empty = { name: '', symbol: '', quantity: 1, buy_price: 0, current_price: 0, buy_date: '', notes: '' }

export default function SIP() {
  const [sips, setSips] = useState<Investment[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(empty)
  const [editId, setEditId] = useState<string | null>(null)
  const [error, setError] = useState('')

  // SIP Calculator state
  const [monthly, setMonthly] = useState(5000)
  const [rate, setRate] = useState(12)
  const [years, setYears] = useState(10)

  const fetch = () =>
    getInvestments({ investment_type: 'sip' })
      .then(setSips)
      .catch(() => setError('Failed to load SIPs'))
      .finally(() => setLoading(false))

  useEffect(() => { fetch() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editId) {
        await updateInvestment(editId, form)
      } else {
        await createInvestment({ ...form, investment_type: 'sip' })
      }
      setShowForm(false)
      setForm(empty)
      setEditId(null)
      fetch()
    } catch { setError('Failed to save SIP') }
  }

  const handleEdit = (s: Investment) => {
    setForm({ name: s.name, symbol: s.symbol, quantity: s.quantity, buy_price: s.buy_price, current_price: s.current_price, buy_date: s.buy_date, notes: s.notes ?? '' })
    setEditId(s.id)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this SIP?')) return
    await deleteInvestment(id)
    fetch()
  }

  // SIP Calculator
  const n = years * 12
  const r = rate / 100 / 12
  const maturity = r === 0 ? monthly * n : monthly * ((Math.pow(1 + r, n) - 1) / r) * (1 + r)
  const invested = monthly * n
  const gains = maturity - invested

  const totalInvested = sips.reduce((s, x) => s + x.buy_price * x.quantity, 0)
  const currentValue = sips.reduce((s, x) => s + x.current_price * x.quantity, 0)
  const totalPL = currentValue - totalInvested

  if (loading) return <div className="page"><p className="text-muted">Loading SIPs...</p></div>

  return (
    <div className="page">
      <div className="page-header">
        <h2>💹 SIP Tracker</h2>
        <button onClick={() => { setShowForm(true); setEditId(null); setForm(empty) }}>+ Add SIP</button>
      </div>

      {error && <p className="error">{error}</p>}

      {/* Summary cards */}
      <div className="stat-cards" style={{ marginBottom: 28 }}>
        <div className="stat-card">
          <span className="stat-label">Total Invested</span>
          <span className="stat-value" style={{ fontSize: 20 }}>₹{totalInvested.toLocaleString()}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Current Value</span>
          <span className="stat-value" style={{ fontSize: 20 }}>₹{currentValue.toLocaleString()}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Total P&L</span>
          <span className="stat-value" style={{ fontSize: 20, color: totalPL >= 0 ? 'var(--success)' : 'var(--danger)' }}>
            {totalPL >= 0 ? '+' : ''}₹{totalPL.toLocaleString()}
          </span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Active SIPs</span>
          <span className="stat-value" style={{ fontSize: 20 }}>{sips.filter(s => s.status === 'active').length}</span>
        </div>
      </div>

      {/* Add/Edit form */}
      {showForm && (
        <div className="chart-card" style={{ marginBottom: 24 }}>
          <h3>{editId ? 'Edit SIP' : 'Add New SIP'}</h3>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
            <input placeholder="Fund Name *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
            <input placeholder="Symbol / Folio" value={form.symbol} onChange={e => setForm(f => ({ ...f, symbol: e.target.value }))} />
            <input type="number" placeholder="Monthly Amount (₹) *" value={form.buy_price || ''} onChange={e => setForm(f => ({ ...f, buy_price: Number(e.target.value) }))} required min={1} />
            <input type="number" placeholder="Current NAV (₹)" value={form.current_price || ''} onChange={e => setForm(f => ({ ...f, current_price: Number(e.target.value) }))} min={0} />
            <input type="number" placeholder="Units" value={form.quantity || ''} onChange={e => setForm(f => ({ ...f, quantity: Number(e.target.value) }))} min={0} step="0.001" />
            <input type="date" placeholder="Start Date" value={form.buy_date} onChange={e => setForm(f => ({ ...f, buy_date: e.target.value }))} />
            <input placeholder="Notes" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} style={{ gridColumn: 'span 2' }} />
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button type="submit">{editId ? 'Update' : 'Add SIP'}</button>
              <button type="button" className="btn-secondary" onClick={() => { setShowForm(false); setEditId(null) }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* SIP list */}
      {sips.length === 0 ? (
        <p className="empty">No SIPs yet. Add your first SIP above.</p>
      ) : (
        <div className="category-table" style={{ marginBottom: 32 }}>
          <table>
            <thead>
              <tr><th>Fund</th><th>Monthly (₹)</th><th>Units</th><th>NAV</th><th>Current Value</th><th>P&L</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {sips.map(s => {
                const pl = (s.current_price - s.buy_price) * s.quantity
                return (
                  <tr key={s.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{s.name}</div>
                      {s.symbol && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.symbol}</div>}
                    </td>
                    <td>₹{s.buy_price.toLocaleString()}</td>
                    <td>{s.quantity}</td>
                    <td>₹{s.current_price.toLocaleString()}</td>
                    <td>₹{(s.current_price * s.quantity).toLocaleString()}</td>
                    <td style={{ color: pl >= 0 ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>
                      {pl >= 0 ? '+' : ''}₹{pl.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </td>
                    <td><span className={`alert-badge ${s.status === 'active' ? 'alert-ok' : 'alert-warning'}`}>{s.status}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn-icon" onClick={() => handleEdit(s)}>✏️</button>
                        <button className="btn-icon btn-danger" onClick={() => handleDelete(s.id)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* SIP Calculator */}
      <h3>SIP Calculator</h3>
      <div className="risk-grid">
        <div className="chart-card">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Monthly Investment</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
                <input type="range" min={500} max={100000} step={500} value={monthly} onChange={e => setMonthly(Number(e.target.value))} style={{ flex: 1 }} />
                <span style={{ fontWeight: 700, minWidth: 80 }}>₹{monthly.toLocaleString()}</span>
              </div>
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Expected Annual Return</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
                <input type="range" min={1} max={30} step={0.5} value={rate} onChange={e => setRate(Number(e.target.value))} style={{ flex: 1 }} />
                <span style={{ fontWeight: 700, minWidth: 50 }}>{rate}%</span>
              </div>
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Time Period</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
                <input type="range" min={1} max={40} step={1} value={years} onChange={e => setYears(Number(e.target.value))} style={{ flex: 1 }} />
                <span style={{ fontWeight: 700, minWidth: 60 }}>{years} yrs</span>
              </div>
            </div>
          </div>
        </div>
        <div className="chart-card">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
              <span className="text-muted">Invested Amount</span>
              <span style={{ fontWeight: 600 }}>₹{invested.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
              <span className="text-muted">Estimated Gains</span>
              <span style={{ fontWeight: 600, color: 'var(--success)' }}>₹{gains.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
            </div>
            <div style={{ height: 1, background: 'var(--border)' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 600 }}>Maturity Value</span>
              <span style={{ fontWeight: 800, fontSize: 22, color: 'var(--primary)' }}>₹{maturity.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
            </div>
            <div className="progress-track" style={{ marginTop: 4 }}>
              <div className="progress-fill" style={{ width: `${(invested / maturity) * 100}%`, background: '#6366f1' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)' }}>
              <span>Invested {((invested / maturity) * 100).toFixed(0)}%</span>
              <span>Gains {((gains / maturity) * 100).toFixed(0)}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
