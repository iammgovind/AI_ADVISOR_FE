import api from './client'
import type { BudgetStatus } from './budgets'

export interface DashboardData {
  year: number
  month: number
  expense_summary: {
    total_this_month: number
    total_last_month: number
    month_over_month_change_pct: number
    top_category: string
    this_month: {
      year: number
      month: number
      total: number
      count: number
      by_category: { category: string; total: number; count: number }[]
    }
  }
  budget_overview: {
    total_budgets: number
    exceeded: number
    warning: number
    ok: number
    total_limit: number
    total_spent: number
    overall_utilization_pct: number
    alerts: BudgetStatus[]
  }
  spending_trend: { year: number; month: number; total: number }[]
  category_breakdown: { category: string; total: number; count: number }[]
}

export const getDashboard = (year: number, month: number) =>
  api.get<DashboardData>('/dashboard', { params: { year, month } }).then((r) => r.data)
