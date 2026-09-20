import api from './client'

export type InvestmentType = 'stock' | 'mutual_fund' | 'sip' | 'etf' | 'crypto' | 'bond' | 'fd' | 'other'
export type InvestmentStatus = 'active' | 'sold'

export interface Investment {
  id: string
  user_id: string
  name: string
  symbol: string
  investment_type: InvestmentType
  quantity: number
  buy_price: number
  current_price: number
  buy_date: string
  status: InvestmentStatus
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Holding {
  investment_id: string
  name: string
  symbol: string
  investment_type: InvestmentType
  quantity: number
  buy_price: number
  current_price: number
  invested_amount: number
  current_value: number
  profit_loss: number
  profit_loss_pct: number
  status: InvestmentStatus
}

export interface Portfolio {
  total_invested: number
  current_value: number
  total_profit_loss: number
  total_profit_loss_pct: number
  total_holdings: number
  by_type: { type: string; invested: number; current_value: number; count: number }[]
  top_performer: string
  worst_performer: string
  holdings: Holding[]
}

export const getInvestments = (params?: { investment_type?: string; status?: string }) =>
  api.get<Investment[]>('/investments', { params }).then((r) => r.data)

export const getPortfolio = () =>
  api.get<Portfolio>('/investments/portfolio').then((r) => r.data)

export const createInvestment = (data: Omit<Investment, 'id' | 'user_id' | 'status' | 'created_at' | 'updated_at'>) =>
  api.post<Investment>('/investments', data).then((r) => r.data)

export const updateInvestment = (id: string, data: Partial<Pick<Investment, 'name' | 'symbol' | 'quantity' | 'buy_price' | 'current_price' | 'buy_date' | 'notes' | 'status'>>) =>
  api.patch<Investment>(`/investments/${id}`, data).then((r) => r.data)

export const deleteInvestment = (id: string) => api.delete(`/investments/${id}`)
