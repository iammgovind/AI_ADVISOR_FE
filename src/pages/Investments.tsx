import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import {
  getPortfolio, getInvestments, createInvestment, updateInvestment, deleteInvestment,
  type Portfolio, type Investment, type InvestmentType,
} from '../api/investments'

const TYPES: InvestmentType[] = ['stock', 'mutual_fund', 'sip', 'etf', 'crypto', 'bond', 'fd', 'other']
const COLORS = ['#6366f1', '#22d3ee', '#f59e0b', '#10b981', '#f43f5e', '#a78bfa', '#fb923c', '#34d399']

type ModalMode = 'create' | 'edit' | 'price'

const emptyForm = { name: '', symbol: '', investment_type: 'stock' as InvestmentType, quantity: '', buy_price: '', current_price: '', buy_date: '', notes: '' }

export default function Investments() {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null)
  const [investments, setInvestments] = useState<Investment[]>([])
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('active')
  const [modal, setModal] = useState<{ mode: ModalMode; inv?: Investment } | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [newPrice, setNewPrice] = useState('')
  const [error, setError] = useState('')

  const loadAll = () => Promise.all([
    getPortfolio().then(setPortfolio).catch(() => setPortfolio(null)),
    getInvestments({ investment_type: typeFilter || undefined, status: statusFilter || undefined }).then(setInvestments),
  ])

  useEffect(() => { loadAll() }, [typeFilter, statusFilter])

  const openCreate = () => { setForm(emptyForm); setError(''); setModal({ mode: 'create' }) }
  const openEdit = (inv: Investment) => {
    setForm({ name: inv.name, symbol: inv.symbol, investment_type: inv.investment_type, quantity: String(inv.quantity), buy_price: String(inv.buy_price), current_price: String(inv.current_price), buy_date: inv.buy_date, notes: inv.notes ?? '' })
    setError(''); setModal({ mode: 'edit', inv })
  }
  const openPrice = (inv: Investment) => { setNewPrice(String(inv.current_price)); setError(''); setModal({ mode: 'price', inv }) }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); setError('')
    try {
      if (modal?.mode === 'create') {
        await createInvestment({ ...form, quantity: Number(form.quantity), buy_price: Number(form.buy_price), current_price: Number(form.current_price) })
      } else if (modal?.mode === 'edit' && modal.inv) {
        await updateInvestment(modal.inv.id, { ...form, quantity: Number(form.quantity), buy_price: Number(form.buy_price), current_price: Number(form.current_price) })
      }
      setModal(null); loadAll()
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(detail ?? 'Failed to save')
    }
  }

  const handlePriceUpdate = async (e: React.FormEvent) => {
    e.preventDefault(); setError('')
    try {
      await updateInvestment(modal!.inv!.id, { current_price: Number(newPrice) })
      setModal(null); loadAll()
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(detail ?? 'Failed to update price')
    }
  }

  const handleSell = async (inv: Investment) => {
    if (!confirm(`Mark "${inv.name}" as sold?`)) return
    await updateInvestment(inv.id, { status: 'sold' })
    loadAll()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this investment?')) return
    await deleteInvestment(id); loadAll()
  }

  const setF = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  const plColor = (v: number) => v >= 0 ? 'var(--success)' : 'var(--danger)'

  return (
    <div className="page">
      <div className="page-header">
        <h2>Investments</h2>
        <button onClick={openCreate}>+ Add Investment</button>
      </div>

      {/* Portfolio summary */}
      {portfolio && (
        <>
          <div className="stat-cards">
            <div className="stat-card">
              <span className="stat-label">Invested</span>
              <span className="stat-value">₹{portfolio.total_invested.toLocaleString()}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Current Value</span>
              <span className="stat-value">₹{portfolio.current_value.toLocaleString()}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">P&L</span>
              <span className="stat-value" style={{ color: plColor(portfolio.total_profit_loss), fontSize: 20 }}>
                {portfolio.total_profit_loss >= 0 ? '+' : ''}₹{portfolio.total_profit_loss.toLocaleString()}
                <span style={{ fontSize: 13, marginLeft: 6 }}>({portfolio.total_profit_loss_pct.toFixed(2)}%)</span>
              </span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Holdings</span>
              <span className="stat-value">{portfolio.total_holdings}</span>
            </div>
          </div>

          <div className="charts-grid" style={{ marginBottom: 28 }}>
            <div className="chart-card">
              <h3>Allocation by Type</h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={portfolio.by_type} dataKey="current_value" nameKey="type" cx="50%" cy="50%" outerRadius={90} label={({ name }) => name as string}>
                    {portfolio.by_type.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => `₹${Number(v).toLocaleString()}`} contentStyle={{ background: '#1a1d27', border: '1px solid #2e3250' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-card">
              <h3>By Type</h3>
              <div className="category-table">
                <table>
                  <thead><tr><th>Type</th><th>Invested</th><th>Value</th><th>Count</th></tr></thead>
                  <tbody>
                    {portfolio.by_type.map((t, i) => (
                      <tr key={t.type}>
                        <td style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ width: 10, height: 10, borderRadius: '50%', background: COLORS[i % COLORS.length], display: 'inline-block' }} />
                          {t.type.replace('_', ' ')}
                        </td>
                        <td>₹{t.invested.toLocaleString()}</td>
                        <td>₹{t.current_value.toLocaleString()}</td>
                        <td>{t.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="inv-performers">
                <span>🏆 <span className="text-muted">Top:</span> {portfolio.top_performer}</span>
                <span>📉 <span className="text-muted">Worst:</span> {portfolio.worst_performer}</span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Filters */}
      <div className="controls row">
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="">All Types</option>
          {TYPES.map((t) => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="sold">Sold</option>
        </select>
      </div>

      {/* Holdings table */}
      {investments.length === 0 ? (
        <p className="empty">No investments found.</p>
      ) : (
        <div className="category-table">
          <table>
            <thead>
              <tr><th>Name</th><th>Type</th><th>Qty</th><th>Buy</th><th>Current</th><th>P&L</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {investments.map((inv) => {
                const pl = (inv.current_price - inv.buy_price) * inv.quantity
                const plPct = ((inv.current_price - inv.buy_price) / inv.buy_price) * 100
                return (
                  <tr key={inv.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{inv.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{inv.symbol}</div>
                    </td>
                    <td style={{ textTransform: 'capitalize' }}>{inv.investment_type.replace('_', ' ')}</td>
                    <td>{inv.quantity}</td>
                    <td>₹{inv.buy_price.toLocaleString()}</td>
                    <td>
                      <span>₹{inv.current_price.toLocaleString()}</span>
                      {inv.status === 'active' && (
                        <button className="btn-icon" style={{ fontSize: 12, marginLeft: 4 }} onClick={() => openPrice(inv)}>✏️</button>
                      )}
                    </td>
                    <td style={{ color: plColor(pl), fontWeight: 600 }}>
                      {pl >= 0 ? '+' : ''}₹{pl.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      <div style={{ fontSize: 11 }}>({plPct.toFixed(2)}%)</div>
                    </td>
                    <td>
                      <span className={`alert-badge ${inv.status === 'active' ? 'alert-ok' : ''}`} style={inv.status === 'sold' ? { background: 'var(--surface2)', color: 'var(--text-muted)' } : {}}>
                        {inv.status}
                      </span>
                    </td>
                    <td>
                      <div className="expense-actions">
                        <button className="btn-icon" onClick={() => openEdit(inv)}>✏️</button>
                        {inv.status === 'active' && (
                          <button className="btn-icon" title="Mark sold" onClick={() => handleSell(inv)}>💼</button>
                        )}
                        <button className="btn-icon btn-danger" onClick={() => handleDelete(inv.id)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals */}
      {modal && createPortal(
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            {modal.mode === 'price' ? (
              <>
                <h3>Update Price — {modal.inv?.name}</h3>
                <form onSubmit={handlePriceUpdate}>
                  <input placeholder="Current price" type="number" step="0.01" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} required autoFocus />
                  {error && <p className="error">{error}</p>}
                  <div className="modal-actions">
                    <button type="button" className="btn-secondary" onClick={() => setModal(null)}>Cancel</button>
                    <button type="submit">Update</button>
                  </div>
                </form>
              </>
            ) : (
              <>
                <h3>{modal.mode === 'create' ? 'New Investment' : 'Edit Investment'}</h3>
                <form onSubmit={handleSave}>
                  <input placeholder="Name" value={form.name} onChange={setF('name')} required />
                  <input placeholder="Symbol (e.g. RELIANCE)" value={form.symbol} onChange={setF('symbol')} required />
                  <select value={form.investment_type} onChange={setF('investment_type')}>
                    {TYPES.map((t) => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                  </select>
                  <input placeholder="Quantity" type="number" step="0.001" value={form.quantity} onChange={setF('quantity')} required />
                  <input placeholder="Buy price" type="number" step="0.01" value={form.buy_price} onChange={setF('buy_price')} required />
                  <input placeholder="Current price" type="number" step="0.01" value={form.current_price} onChange={setF('current_price')} required />
                  <input placeholder="Buy date" type="date" value={form.buy_date} onChange={setF('buy_date')} required />
                  <textarea placeholder="Notes (optional)" value={form.notes} onChange={setF('notes')} />
                  {error && <p className="error">{error}</p>}
                  <div className="modal-actions">
                    <button type="button" className="btn-secondary" onClick={() => setModal(null)}>Cancel</button>
                    <button type="submit">Save</button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>,
        document.body,
      )}
    </div>
  )
}
