import api from './client'

export interface RiskAssessment {
  risk_score: number
  score_breakdown: {
    budget_discipline: number
    investment_behavior: number
    goal_commitment: number
    portfolio_diversity: number
  }
  risk_level: 'conservative' | 'moderate' | 'aggressive'
  description: string
  suitable_investments: string[]
  recommended_allocation: {
    equity: number
    debt: number
    gold: number
    cash: number
  }
  warnings: string[]
  profile_summary: {
    monthly_expense: number
    total_budget: number
    budget_utilization_pct: number
    total_goals: number
    avg_goal_progress_pct: number
    total_holdings: number
    portfolio_pl_pct: number
    investment_types: string[]
  }
}

export const getRiskAssessment = () =>
  api.get<RiskAssessment>('/risk/assess').then((r) => r.data)
