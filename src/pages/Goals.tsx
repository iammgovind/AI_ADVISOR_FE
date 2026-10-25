import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { getGoals, getGoalsProgress, createGoal, updateGoal, deleteGoal, depositGoal, type GoalProgress, type GoalStatus } from '../api/goals'

const statusColor: Record<GoalStatus, string> = {
  active: '#6366f1',
  completed: 'var(--success)',
  cancelled: 'var(--text-muted)',
}

type ModalMode = 'create' | 'edit' | 'deposit'

export default function Goals() {
  const [goals, setGoals] = useState<GoalProgress[]>([])
  const [filter, setFilter] = useState<GoalStatus | ''>('active')
  const [modal, setModal] = useState<{ mode: ModalMode; goal?: GoalProgress } | null>(null)
  const [form, setForm] = useState({ title: '', description: '', target_amount: '', saved_amount: '', target_date: '', status: 'active' as GoalStatus })
  const [deposit, setDeposit] = useState('')
  const [error, setError] = useState('')

  const load = async () => {
    try {
      const [allGoals, progressList] = await Promise.all([getGoals(), getGoalsProgress()])
      const progressMap = new Map(progressList.map((p) => [p.goal_id, p]))
      const merged: GoalProgress[] = allGoals.map((g) =>
        progressMap.get(g.id) ?? {
          goal_id: g.id,
          title: g.title,
          target_amount: g.target_amount,
          saved_amount: g.saved_amount,
          remaining_amount: Math.max(0, g.target_amount - g.saved_amount),
          progress_pct: g.target_amount > 0 ? Math.min(100, (g.saved_amount / g.target_amount) * 100) : 0,
          target_date: g.target_date,
          days_remaining: 0,
          monthly_savings_required: 0,
          status: g.status,
        }
      )
      setGoals(merged)
    } catch {
      setGoals([])
    }
  }
  useEffect(() => { load() }, [])

  const filtered = filter ? goals.filter((g) => g.status === filter) : goals

  const openCreate = () => {
    setForm({ title: '', description: '', target_amount: '', saved_amount: '0', target_date: '', status: 'active' })
    setError('')
    setModal({ mode: 'create' })
  }

  const openEdit = (g: GoalProgress) => {
    setForm({ title: g.title, description: '', target_amount: String(g.target_amount), saved_amount: String(g.saved_amount), target_date: g.target_date, status: g.status })
    setError('')
    setModal({ mode: 'edit', goal: g })
  }

  const openDeposit = (g: GoalProgress) => {
    setDeposit('')
    setError('')
    setModal({ mode: 'deposit', goal: g })
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      if (modal?.mode === 'create') {
        await createGoal({ title: form.title, description: form.description || null, target_amount: Number(form.target_amount), saved_amount: Number(form.saved_amount), target_date: form.target_date })
      } else if (modal?.mode === 'edit' && modal.goal) {
        await updateGoal(modal.goal.goal_id, { title: form.title, target_amount: Number(form.target_amount), target_date: form.target_date, status: form.status })
      }
      setModal(null)
      load()
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(detail ?? 'Failed to save')
    }
  }

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      const result = await depositGoal(modal!.goal!.goal_id, Number(deposit))
      setModal(null)
      if (result.status === 'completed') {
        setGoals((prev) => prev.map((g) => g.goal_id === result.goal_id ? result : g))
        setFilter('completed')
      } else {
        setGoals((prev) => prev.map((g) => g.goal_id === result.goal_id ? result : g))
      }
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(detail ?? 'Deposit failed')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Permanently delete this goal?')) return
    await deleteGoal(id)
    load()
  }

  const handleCancel = async (id: string) => {
    if (!confirm('Cancel this goal?')) return
    await updateGoal(id, { status: 'cancelled' })
    load()
  }

  const setF = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  return (
    <div className="page">
      <div className="page-header">
        <h2>Goals</h2>
        <button onClick={openCreate}>+ New Goal</button>
      </div>

      <div className="controls row">
        {(['', 'active', 'completed', 'cancelled'] as const).map((s) => (
          <button key={s} onClick={() => setFilter(s)} className={filter === s ? '' : 'btn-secondary'} style={{ padding: '6px 14px', fontSize: 13 }}>
            {s || 'All'}
          </button>
        ))}
      </div>

      {filtered.length === 0 && <p className="empty">No goals found.</p>}

      <div className="goal-list">
        {filtered.map((g) => {
          const pct = Math.min(g.progress_pct, 100)
          const color = statusColor[g.status]
          return (
            <div key={g.goal_id} className="goal-card">
              <div className="goal-card-header">
                <div className="goal-title-row">
                  <span className="goal-title">{g.title}</span>
                  <span className="alert-badge" style={{ background: `${color}22`, color }}>{g.status}</span>
                </div>
                <div className="expense-actions">
                  {g.status === 'active' && (
                    <>
                      <button className="btn-icon" title="Deposit" onClick={() => openDeposit(g)}>💰</button>
                      <button className="btn-icon" onClick={() => openEdit(g)}>✏️</button>
                      <button className="btn-icon btn-danger" title="Cancel goal" onClick={() => handleCancel(g.goal_id)}>✕</button>
                    </>
                  )}
                  {g.status !== 'active' && (
                    <button className="btn-icon btn-danger" title="Delete" onClick={() => handleDelete(g.goal_id)}>🗑️</button>
                  )}
                </div>
              </div>

              <div className="goal-amounts">
                <span className="goal-saved">₹{g.saved_amount.toLocaleString()}</span>
                <span className="text-muted"> / ₹{g.target_amount.toLocaleString()}</span>
                <span style={{ marginLeft: 'auto', color, fontWeight: 600 }}>{g.progress_pct.toFixed(1)}%</span>
              </div>

              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
              </div>

              <div className="goal-meta">
                {g.status === 'active' && (
                  <>
                    <span className="text-muted">🗓 {g.days_remaining}d left · Target {g.target_date}</span>
                    <span className="text-muted">Need <strong style={{ color: 'var(--text)' }}>₹{g.monthly_savings_required.toLocaleString(undefined, { maximumFractionDigits: 2 })}</strong>/mo</span>
                  </>
                )}
                {g.status === 'completed' && <span style={{ color: 'var(--success)' }}>🎉 Goal completed!</span>}
                {g.status === 'cancelled' && <span className="text-muted">Cancelled</span>}
              </div>
            </div>
          )
        })}
      </div>

      {modal && createPortal(
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            {modal.mode === 'deposit' ? (
              <>
                <h3>Deposit — {modal.goal?.title}</h3>
                <form onSubmit={handleDeposit}>
                  <input placeholder="Amount" type="number" step="0.01" value={deposit} onChange={(e) => setDeposit(e.target.value)} required autoFocus />
                  {error && <p className="error">{error}</p>}
                  <div className="modal-actions">
                    <button type="button" className="btn-secondary" onClick={() => setModal(null)}>Cancel</button>
                    <button type="submit">Deposit</button>
                  </div>
                </form>
              </>
            ) : (
              <>
                <h3>{modal.mode === 'create' ? 'New Goal' : 'Edit Goal'}</h3>
                <form onSubmit={handleSave}>
                  <input placeholder="Title" value={form.title} onChange={setF('title')} required />
                  <textarea placeholder="Description (optional)" value={form.description} onChange={setF('description')} />
                  <input placeholder="Target amount" type="number" step="0.01" value={form.target_amount} onChange={setF('target_amount')} required />
                  {modal.mode === 'create' && (
                    <input placeholder="Already saved" type="number" step="0.01" value={form.saved_amount} onChange={setF('saved_amount')} />
                  )}
                  <input placeholder="Target date" type="date" value={form.target_date} onChange={setF('target_date')} required />
                  {modal.mode === 'edit' && (
                    <select value={form.status} onChange={setF('status')}>
                      <option value="active">active</option>
                      <option value="completed">completed</option>
                      <option value="cancelled">cancelled</option>
                    </select>
                  )}
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
