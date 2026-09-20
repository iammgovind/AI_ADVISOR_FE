import { useState } from 'react'
import { createPortal } from 'react-dom'
import type { Expense, Category } from '../api/expenses'

const CATEGORIES: Category[] = ['food','transport','housing','health','entertainment','shopping','education','other']

interface Props {
  initial?: Partial<Expense>
  onSave: (data: Omit<Expense, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => void
  onClose: () => void
}

export default function ExpenseForm({ initial, onSave, onClose }: Props) {
  const [form, setForm] = useState({
    title: initial?.title ?? '',
    amount: initial?.amount ?? '',
    category: initial?.category ?? 'food',
    note: initial?.note ?? '',
    expense_date: initial?.expense_date ? initial.expense_date.slice(0, 16) : new Date().toISOString().slice(0, 16),
  })

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({ ...form, amount: Number(form.amount), category: form.category as Category, expense_date: new Date(form.expense_date).toISOString() })
  }

  return createPortal(
    <>
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>{initial?.id ? 'Edit Expense' : 'New Expense'}</h3>
        <form onSubmit={handleSubmit}>
          <input placeholder="Title" value={form.title} onChange={set('title')} required />
          <input placeholder="Amount" type="number" step="0.01" value={form.amount} onChange={set('amount')} required />
          <select value={form.category} onChange={set('category')}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <input type="datetime-local" value={form.expense_date} onChange={set('expense_date')} required />
          <textarea placeholder="Note (optional)" value={form.note} onChange={set('note')} />
          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit">Save</button>
          </div>
        </form>
      </div>
    </div>
    </>,
    document.body,
  )
}
