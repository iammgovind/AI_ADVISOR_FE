import { useEffect, useState } from 'react'
import {
  getExpenses, createExpense, updateExpense, deleteExpense, type Expense,
  getBankAccounts, createBankAccount, deleteBankAccount, type BankAccount,
  uploadStatement, bulkApprove, getStatementHistory,
  type UploadResponse, type StatementTransaction, type ApprovedRow, type UploadHistory, type Category,
} from '../api/expenses'
import ExpenseForm from '../components/ExpenseForm'

const CATEGORIES: Category[] = ['food', 'transport', 'housing', 'health', 'entertainment', 'shopping', 'education', 'other']
const CAT_FILTER = ['', ...CATEGORIES]

type Tab = 'list' | 'import' | 'history'

export default function Expenses() {
  const [tab, setTab] = useState<Tab>('list')

  // --- list tab ---
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [category, setCategory] = useState('')
  const [editing, setEditing] = useState<Expense | null | 'new'>(null)

  const loadExpenses = () => getExpenses(category ? { category } : {}).then(setExpenses)
  useEffect(() => { loadExpenses() }, [category])

  const handleSave = async (data: Omit<Expense, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (editing === 'new') await createExpense(data)
    else if (editing) await updateExpense(editing.id, data)
    setEditing(null)
    loadExpenses()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this expense?')) return
    await deleteExpense(id)
    loadExpenses()
  }

  // --- import tab ---
  const [accounts, setAccounts] = useState<BankAccount[]>([])
  const [newAcc, setNewAcc] = useState({ bank_name: '', account_number: '', account_holder: '' })
  const [addingAcc, setAddingAcc] = useState(false)
  const [accError, setAccError] = useState('')

  const [uploadMode, setUploadMode] = useState<'file' | 'text'>('file')
  const [file, setFile] = useState<File | null>(null)
  const [rawText, setRawText] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')

  const [preview, setPreview] = useState<UploadResponse | null>(null)
  const [rows, setRows] = useState<(StatementTransaction & { category: Category; rejected: boolean })[]>([])

  const [approving, setApproving] = useState(false)
  const [approveResult, setApproveResult] = useState<{ saved: number; rejected: number } | null>(null)

  const loadAccounts = () => getBankAccounts().then(setAccounts)
  useEffect(() => { if (tab === 'import') loadAccounts() }, [tab])

  const handleAddAccount = async () => {
    setAccError('')
    try {
      await createBankAccount(newAcc)
      setNewAcc({ bank_name: '', account_number: '', account_holder: '' })
      setAddingAcc(false)
      loadAccounts()
    } catch {
      setAccError('Failed to add account.')
    }
  }

  const handleDeleteAccount = async (id: string) => {
    if (!confirm('Remove this bank account?')) return
    await deleteBankAccount(id)
    loadAccounts()
  }

  const handleUpload = async () => {
    setUploadError('')
    setPreview(null)
    setApproveResult(null)
    setUploading(true)
    try {
      const res = await uploadStatement(
        uploadMode === 'file' ? (file ?? undefined) : undefined,
        uploadMode === 'text' ? rawText : undefined,
      )
      setPreview(res)
      setRows(res.transactions.map((t) => ({ ...t, category: t.suggested_category, rejected: false })))
    } catch (e: any) {
      setUploadError(e?.response?.data?.detail ?? 'Upload failed.')
    } finally {
      setUploading(false)
    }
  }

  const handleApprove = async () => {
    if (!preview) return
    setApproving(true)
    const approved: ApprovedRow[] = rows
      .filter((r) => !r.rejected)
      .map((r) => ({ row_index: r.row_index, date: r.date, description: r.description, amount: r.amount, category: r.category }))
    const rejected_indices = rows.filter((r) => r.rejected).map((r) => r.row_index)
    try {
      const res = await bulkApprove(preview.upload_id, approved, rejected_indices)
      setApproveResult(res)
      setPreview(null)
      loadExpenses()
    } catch {
      setUploadError('Failed to save transactions.')
    } finally {
      setApproving(false)
    }
  }

  // --- history tab ---
  const [history, setHistory] = useState<UploadHistory[]>([])
  useEffect(() => { if (tab === 'history') getStatementHistory().then(setHistory) }, [tab])

  return (
    <div className="page">
      <div className="page-header">
        <h2>Expenses</h2>
        <div className="tab-bar">
          {(['list', 'import', 'history'] as Tab[]).map((t) => (
            <button key={t} className={tab === t ? 'tab active' : 'tab'} onClick={() => setTab(t)}>
              {t === 'list' ? 'My Expenses' : t === 'import' ? 'Import Statement' : 'Import History'}
            </button>
          ))}
        </div>
      </div>

      {/* ── LIST TAB ── */}
      {tab === 'list' && (
        <>
          <div className="controls row">
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              {CAT_FILTER.map((c) => <option key={c} value={c}>{c || 'All Categories'}</option>)}
            </select>
            <button onClick={() => setEditing('new')}>+ Add Expense</button>
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
        </>
      )}

      {/* ── IMPORT TAB ── */}
      {tab === 'import' && (
        <div className="import-section">

          {/* Bank Accounts */}
          <div className="card">
            <div className="card-header">
              <h3>Bank Accounts</h3>
              <button onClick={() => setAddingAcc(!addingAcc)}>+ Add Account</button>
            </div>

            {addingAcc && (
              <div className="form-row">
                <input placeholder="Bank Name (e.g. HDFC)" value={newAcc.bank_name} onChange={(e) => setNewAcc({ ...newAcc, bank_name: e.target.value })} />
                <input placeholder="Account Number (e.g. XXXX1234)" value={newAcc.account_number} onChange={(e) => setNewAcc({ ...newAcc, account_number: e.target.value })} />
                <input placeholder="Account Holder Name" value={newAcc.account_holder} onChange={(e) => setNewAcc({ ...newAcc, account_holder: e.target.value })} />
                <button onClick={handleAddAccount}>Save</button>
                <button onClick={() => setAddingAcc(false)}>Cancel</button>
                {accError && <span className="error">{accError}</span>}
              </div>
            )}

            {accounts.length === 0 && !addingAcc && <p className="empty">No bank accounts registered.</p>}
            {accounts.map((a) => (
              <div key={a.id} className="account-item">
                <span><strong>{a.bank_name}</strong> — {a.account_number} ({a.account_holder})</span>
                <button className="btn-icon btn-danger" onClick={() => handleDeleteAccount(a.id)}>🗑️</button>
              </div>
            ))}
          </div>

          {/* Upload */}
          {!preview && !approveResult && (
            <div className="card">
              <div className="card-header"><h3>Upload Statement</h3></div>
              <div className="tab-bar" style={{ marginBottom: 12 }}>
                <button className={uploadMode === 'file' ? 'tab active' : 'tab'} onClick={() => setUploadMode('file')}>PDF / CSV</button>
                <button className={uploadMode === 'text' ? 'tab active' : 'tab'} onClick={() => setUploadMode('text')}>Paste Text</button>
              </div>

              {uploadMode === 'file' ? (
                <input type="file" accept=".pdf,.csv" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
              ) : (
                <textarea
                  rows={5}
                  placeholder="Paste mini statement text here..."
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  style={{ width: '100%', resize: 'vertical' }}
                />
              )}

              {uploadError && <p className="error">{uploadError}</p>}
              <button onClick={handleUpload} disabled={uploading || (uploadMode === 'file' ? !file : !rawText.trim())} style={{ marginTop: 10 }}>
                {uploading ? 'Uploading...' : 'Upload & Preview'}
              </button>
            </div>
          )}

          {/* Approve result */}
          {approveResult && (
            <div className="card">
              <p className="success">✅ Saved {approveResult.saved} transactions. Rejected {approveResult.rejected}.</p>
              <button onClick={() => { setApproveResult(null); setFile(null); setRawText('') }}>Import Another</button>
            </div>
          )}

          {/* Preview Table */}
          {preview && (
            <div className="card">
              <div className="card-header"><h3>Preview Transactions</h3></div>

              {preview.account_verified
                ? <p className="success">✅ Confirmed: {preview.bank_name} {preview.account_number}. Found {preview.total_debits} transactions.</p>
                : <p className="warning">⚠️ Account not matched. Do you want to continue?</p>
              }

              <table className="statement-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Amount</th>
                    <th>Category</th>
                    <th>Reject</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={r.row_index} className={r.rejected ? 'row-rejected' : r.confidence === 'low' ? 'row-low' : ''}>
                      <td>{new Date(r.date).toLocaleDateString()}</td>
                      <td>
                        {r.description}
                        {r.confidence === 'low' && <span className="badge-low"> ⚠️ Review</span>}
                      </td>
                      <td>₹{r.amount.toFixed(2)}</td>
                      <td>
                        <select
                          value={r.category}
                          disabled={r.rejected}
                          onChange={(e) => setRows((prev) => prev.map((x, j) => j === i ? { ...x, category: e.target.value as Category } : x))}
                        >
                          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </td>
                      <td>
                        <input
                          type="checkbox"
                          checked={r.rejected}
                          onChange={(e) => setRows((prev) => prev.map((x, j) => j === i ? { ...x, rejected: e.target.checked } : x))}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                <button onClick={handleApprove} disabled={approving}>
                  {approving ? 'Saving...' : `Confirm Import (${rows.filter((r) => !r.rejected).length} approved)`}
                </button>
                <button onClick={() => setPreview(null)}>Cancel</button>
              </div>
              {uploadError && <p className="error">{uploadError}</p>}
            </div>
          )}
        </div>
      )}

      {/* ── HISTORY TAB ── */}
      {tab === 'history' && (
        <div className="card">
          <div className="card-header"><h3>Import History</h3></div>
          {history.length === 0 && <p className="empty">No imports yet.</p>}
          <table className="statement-table">
            <thead>
              <tr><th>Date</th><th>Source</th><th>File</th><th>Total</th><th>Approved</th><th>Rejected</th><th>Status</th></tr>
            </thead>
            <tbody>
              {history.map((h) => (
                <tr key={h.id}>
                  <td>{new Date(h.created_at).toLocaleDateString()}</td>
                  <td>{h.source}</td>
                  <td>{h.filename ?? '—'}</td>
                  <td>{h.total_transactions}</td>
                  <td>{h.approved_count}</td>
                  <td>{h.rejected_count}</td>
                  <td><span className={`badge badge-${h.status}`}>{h.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
