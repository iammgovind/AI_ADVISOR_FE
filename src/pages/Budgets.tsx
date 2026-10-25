import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { getBudgetsStatus, createBudget, updateBudget, deleteBudget, type BudgetStatus } from '../api/budgets'
import type { Category } from '../api/expenses'

const CATEGORIES: Category[] = ['food','transport','housing','health','entertainment','shopping','education','other']

const alertColor: Record<string, string> = {
  ok: 'var(--success)',
  warning: '#f59e0b',
  exceeded: 'var(--danger)',
}

export default function Budgets() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [statuses, setStatuses] = useState<BudgetStatus[]>([])
  const [modal, setModal] = useState<{ id?: string; category?: string; limit?: number } | null>(null)
  const [formCategory, setFormCategory] = useState<Category>('food')
  const [formLimit, setFormLimit] = useState('')
  const [error, setError] = useState('')

  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

  const load = () =>
    getBudgetsStatus(year, month).then(setStatuses).catch(() => setStatuses([]))

  useEffect(() => { load() }, [year, month])

  const openCreate = () => {
    setFormCategory('food')
    setFormLimit('')
    setError('')
    setModal({})
  }

  const openEdit = (s: BudgetStatus) => {
    setFormLimit(String(s.limit_amount))
    setError('')
    setModal({ id: s.budget_id, category: s.category, limit: s.limit_amount })
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      if (modal?.id) {
        await updateBudget(modal.id, Number(formLimit))
      } else {
        await createBudget({ category: formCategory, limit_amount: Number(formLimit), year, month })
      }
      setModal(null)
      load()
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(detail ?? 'Failed to save budget')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this budget?')) return
    await deleteBudget(id)
    load()
  }

  return (
    <div className="page">
      <div className="page-header">
        <h2>Budgets</h2>
        <button onClick={openCreate}>+ Add Budget</button>
      </div>

      <div className="controls row">
        <select value={month} onChange={(e) => setMonth(+e.target.value)}>
          {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
        </select>
        <input type="number" value={year} onChange={(e) => setYear(+e.target.value)} min={2020} max={2100} style={{ width: 90 }} />
      </div>

      {statuses.length === 0 && <p className="empty">No budgets for this period.</p>}

      <div className="budget-list">
        {statuses.map((s) => {
          const pct = Math.min(s.utilization_pct, 100)
          const color = alertColor[s.alert]
          return (
            <div key={s.budget_id} className="budget-card">
              <div className="budget-card-header">
                <div className="budget-card-left">
                  <span className={`badge badge-${s.category}`}>{s.category}</span>
                  <span className={`alert-badge alert-${s.alert}`}>{s.alert}</span>
                </div>
                <div className="budget-card-actions">
                  <button className="btn-icon" onClick={() => openEdit(s)}>✏️</button>
                  <button className="btn-icon btn-danger" onClick={() => handleDelete(s.budget_id)}>🗑️</button>
                </div>
              </div>

              <div className="budget-amounts">
                <span>₹{s.spent.toFixed(2)} <span className="text-muted">spent</span></span>
                <span className="text-muted">of ₹{s.limit_amount.toFixed(2)}</span>
                <span style={{ marginLeft: 'auto', color }}>
                  {s.alert === 'exceeded'
                    ? `₹${(s.spent - s.limit_amount).toFixed(2)} over`
                    : `₹${s.remaining.toFixed(2)} left`}
                </span>
              </div>

              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
              </div>
              <div className="progress-label">
                <span>{s.utilization_pct.toFixed(1)}% used</span>
              </div>
            </div>
          )
        })}
      </div>

      {modal !== null && createPortal(
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{modal.id ? `Edit Budget — ${modal.category}` : 'New Budget'}</h3>
            <form onSubmit={handleSave}>
              {!modal.id && (
                <select value={formCategory} onChange={(e) => setFormCategory(e.target.value as Category)}>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              )}
              <input
                placeholder="Limit amount"
                type="number"
                step="0.01"
                value={formLimit}
                onChange={(e) => setFormLimit(e.target.value)}
                required
              />
              {error && <p className="error">{error}</p>}
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setModal(null)}>Cancel</button>
                <button type="submit">Save</button>
              </div>
            </form>
          </div>
        </div>,
        document.body,
      )}
    </div>
  )
}
