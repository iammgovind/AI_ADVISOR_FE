import api from './client'
import type { Category } from './expenses'

export interface Budget {
  id: string
  user_id: string
  category: Category
  limit_amount: number
  year: number
  month: number
  created_at: string
  updated_at: string
}

export interface BudgetStatus {
  budget_id: string
  category: string
  year: number
  month: number
  limit_amount: number
  spent: number
  remaining: number
  utilization_pct: number
  alert: 'ok' | 'warning' | 'exceeded'
}

export const getBudgets = (year: number, month: number) =>
  api.get<Budget[]>('/budgets', { params: { year, month } }).then((r) => r.data)

export const getBudgetsStatus = (year: number, month: number) =>
  api.get<BudgetStatus[]>('/budgets/status', { params: { year, month } }).then((r) => r.data)

export const createBudget = (data: Pick<Budget, 'category' | 'limit_amount' | 'year' | 'month'>) =>
  api.post<Budget>('/budgets', data).then((r) => r.data)

export const updateBudget = (id: string, limit_amount: number) =>
  api.patch<Budget>(`/budgets/${id}`, { limit_amount }).then((r) => r.data)

export const deleteBudget = (id: string) => api.delete(`/budgets/${id}`)
