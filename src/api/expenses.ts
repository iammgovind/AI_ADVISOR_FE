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
