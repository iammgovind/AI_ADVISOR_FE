import api from './client'

export interface MarketData {
  symbol: string
  name: string
  current_price: number | null
  previous_close: number | null
  change_pct: number | null
  market_cap: number | null
  pe_ratio: number | null
  '52w_high': number | null
  '52w_low': number | null
  currency: string
  sector: string | null
  industry: string | null
}

export interface FinancialProfile {
  monthly_expense: number
  total_budget: number
  budget_utilization_pct: number
  top_expense_categories: { category: string; total: number }[]
  active_goals: { title: string; target: number; saved: number; progress_pct: number; target_date: string }[]
  portfolio: {
    total_invested: number
    current_value: number
    profit_loss: number
    profit_loss_pct: number
    by_type: Record<string, number>
    total_holdings: number
  }
}

export const getMarketData = (symbol: string) =>
  api.get<MarketData>(`/agent/market/${symbol}`).then((r) => r.data)

export const getPortfolioInsights = () =>
  api.get<{ profile: FinancialProfile; insights: string }>('/agent/portfolio/insights').then((r) => r.data)

export const getRecommendations = () =>
  api.get<{ profile: FinancialProfile; recommendations: string }>('/agent/recommendations').then((r) => r.data)

export const analyzeFinances = () =>
  api.post<{ profile: FinancialProfile; analysis: string }>('/agent/analyze', {}).then((r) => r.data)

export interface MultiAgentReport {
  financial_health_score: number
  financial_health_status: string
  agents: {
    risk: {
      risk_score: number
      risk_level: string
      recommended_allocation: Record<string, number>
      suitable_investments: string[]
      warnings: string[]
    }
    savings: {
      savings_capacity: number
      savings_rate_pct: number
      emergency_fund: { target: number; status: string }
      monthly_allocation: { goals: number; emergency_fund: number; investable_surplus: number }
      goal_plans: { goal_id: string; title: string; monthly_required: number; feasible: boolean }[]
    }
    budget: { utilization_pct: number; status: string; alert: string }
    investment: {
      status: string
      total_invested: number
      current_value: number
      profit_loss_pct: number
      diversification: string
      insight: string
    }
  }
  recommendations: {
    priority: number
    category: string
    urgency: string
    action: string
    detail: string
  }[]
}

export const getMultiAgentRecommend = () =>
  api.get<MultiAgentReport>('/multi-agent/recommend').then((r) => r.data)
