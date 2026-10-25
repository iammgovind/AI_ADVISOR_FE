import api from './client'

export type Category = 'food' | 'transport' | 'housing' | 'health' | 'entertainment' | 'shopping' | 'education' | 'other'

export interface Expense {
  id: string
  user_id: string
  title: string
  amount: number
  category: Category
  note?: string
  expense_date: string
  created_at: string
  updated_at: string
}

export interface MonthlySummary {
  year: number
  month: number
  total: number
  count: number
  by_category: { category: string; total: number; count: number }[]
}

export interface AnalyticsItem {
  category: string
  total: number
  count: number
}

export const getExpenses = (params?: { category?: string; skip?: number; limit?: number }) =>
  api.get<Expense[]>('/expenses', { params }).then((r) => r.data)

export const getExpense = (id: string) =>
  api.get<Expense>(`/expenses/${id}`).then((r) => r.data)

export const createExpense = (data: Omit<Expense, 'id' | 'user_id' | 'created_at' | 'updated_at'>) =>
  api.post<Expense>('/expenses', data).then((r) => r.data)

export const updateExpense = (id: string, data: Partial<Omit<Expense, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) =>
  api.patch<Expense>(`/expenses/${id}`, data).then((r) => r.data)

export const deleteExpense = (id: string) =>
  api.delete(`/expenses/${id}`)

export const getMonthlySummary = (year: number, month: number) =>
  api.get<MonthlySummary>('/expenses/summary/monthly', { params: { year, month } }).then((r) => r.data)

export const getAnalytics = () =>
  api.get<AnalyticsItem[]>('/expenses/summary/analytics').then((r) => r.data)

// --- Bank Accounts ---
export interface BankAccount {
  id: string
  user_id: string
  bank_name: string
  account_number: string
  account_holder: string
  created_at: string
}

export const getBankAccounts = () =>
  api.get<BankAccount[]>('/bank-accounts').then((r) => r.data)

export const createBankAccount = (data: Pick<BankAccount, 'bank_name' | 'account_number' | 'account_holder'>) =>
  api.post<BankAccount>('/bank-accounts', data).then((r) => r.data)

export const deleteBankAccount = (id: string) =>
  api.delete(`/bank-accounts/${id}`)

// --- Statement Upload ---
export interface StatementTransaction {
  row_index: number
  date: string
  description: string
  amount: number
  suggested_category: Category
  confidence: 'high' | 'low'
}

export interface UploadResponse {
  upload_id: string
  bank_name: string
  account_number: string
  account_holder: string
  matched_account_id: string | null
  account_verified: boolean
  total_debits: number
  transactions: StatementTransaction[]
}

export const uploadStatement = (file?: File, raw_text?: string) => {
  const form = new FormData()
  if (file) form.append('file', file)
  if (raw_text) form.append('raw_text', raw_text)
  return api.post<UploadResponse>('/expenses/statement/upload', form).then((r) => r.data)
}

export interface ApprovedRow {
  row_index: number
  date: string
  description: string
  amount: number
  category: Category
}

export const bulkApprove = (upload_id: string, approved: ApprovedRow[], rejected_indices: number[]) =>
  api.post<{ saved: number; rejected: number }>('/expenses/statement/bulk-approve', { upload_id, approved, rejected_indices }).then((r) => r.data)

// --- Upload History ---
export interface UploadHistory {
  id: string
  source: string
  filename: string | null
  total_transactions: number
  approved_count: number
  rejected_count: number
  status: string
  created_at: string
}

export const getStatementHistory = () =>
  api.get<UploadHistory[]>('/expenses/statement/history').then((r) => r.data)
