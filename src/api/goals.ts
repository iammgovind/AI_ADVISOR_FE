import api from './client'

export type GoalStatus = 'active' | 'completed' | 'cancelled'

export interface Goal {
  id: string
  user_id: string
  title: string
  description: string | null
  target_amount: number
  saved_amount: number
  target_date: string
  status: GoalStatus
  created_at: string
  updated_at: string
}

export interface GoalProgress {
  goal_id: string
  title: string
  target_amount: number
  saved_amount: number
  remaining_amount: number
  progress_pct: number
  target_date: string
  days_remaining: number
  monthly_savings_required: number
  status: GoalStatus
}

export const getGoals = (status?: GoalStatus) =>
  api.get<Goal[]>('/goals', { params: status ? { status } : {} }).then((r) => r.data)

export const getGoalsProgress = () =>
  api.get<GoalProgress[]>('/goals/progress').then((r) => r.data)

export const createGoal = (data: Pick<Goal, 'title' | 'description' | 'target_amount' | 'saved_amount' | 'target_date'>) =>
  api.post<Goal>('/goals', data).then((r) => r.data)

export const updateGoal = (id: string, data: Partial<Pick<Goal, 'title' | 'description' | 'target_amount' | 'saved_amount' | 'target_date' | 'status'>>) =>
  api.patch<Goal>(`/goals/${id}`, data).then((r) => r.data)

export const deleteGoal = (id: string) => api.delete(`/goals/${id}`)

export const depositGoal = (id: string, amount: number) =>
  api.post<GoalProgress>(`/goals/${id}/deposit`, { amount }).then((r) => r.data)
