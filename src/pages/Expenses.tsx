import { useEffect, useState } from 'react'
import { getExpenses, createExpense, updateExpense, deleteExpense, type Expense } from '../api/expenses'
import ExpenseForm from '../components/ExpenseForm'

const CATEGORIES = ['', 'food', 'transport', 'housing', 'health', 'entertainment', 'shopping', 'education', 'other']

export default function Expenses() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [category, setCategory] = useState('')
  const [editing, setEditing] = useState<Expense | null | 'new'>(null)

  const load = () => getExpenses(category ? { category } : {}).then(setExpenses)

  useEffect(() => { load() }, [category])

  const handleSave = async (data: Omit<Expense, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (editing === 'new') await createExpense(data)
    else if (editing) await updateExpense(editing.id, data)
    setEditing(null)
    load()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this expense?')) return
    await deleteExpense(id)
    load()
  }

  return (
    <div className="page">
      <div className="page-header">
        <h2>Expenses</h2>
        <button onClick={() => setEditing('new')}>+ Add Expense</button>
      </div>

      <div className="controls row">
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c || 'All Categories'}</option>)}
        </select>
      </div>

      <div className="expense-list">
        {expenses.length === 0 && <p className="empty">No expenses found.</p>}
        {expenses.map((e) => (
          <div key={e.id} className="expense-item">
            <div className="expense-info">
              <span className="expense-title">{e.title}</span>
              <span className={`badge badge-${e.category}`}>{e.category}</span>
              {e.note && <span className="expense-note">{e.note}</span>}
              <span className="expense-date">{new Date(e.expense_date).toLocaleDateString()}</span>
            </div>
            <div className="expense-right">
              <span className="expense-amount">₹{e.amount.toFixed(2)}</span>
              <div className="expense-actions">
                <button className="btn-icon" onClick={() => setEditing(e)}>✏️</button>
                <button className="btn-icon btn-danger" onClick={() => handleDelete(e.id)}>🗑️</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <ExpenseForm
          initial={editing === 'new' ? {} : editing}
          onSave={handleSave}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}
