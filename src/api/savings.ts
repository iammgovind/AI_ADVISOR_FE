import api from './client'

export interface SavingsPlan {
  savings_capacity: number
  savings_rate_pct: number
  monthly_expense: number
  avg_monthly_expense_3m: number
  total_budget: number
  emergency_fund: {
    target: number
    monthly_contribution_suggested: number
    months_to_build: number
    status: 'sufficient' | 'insufficient'
  }
  goal_plans: {
    goal_id: string
    title: string
    target_amount: number
    saved_amount: number
    remaining_amount: number
    target_date: string
    months_remaining: number
    monthly_required: number
    months_left: number
    monthly_saving_needed: number
    feasible: boolean
  }[]
  monthly_allocation: {
    goals: number
    emergency_fund: number
    investable_surplus: number
    total_allocated: number
  }
  recommendations: string[]
}

export const getSavingsPlan = () =>
  api.get<SavingsPlan>('/savings/plan').then((r) => r.data)
