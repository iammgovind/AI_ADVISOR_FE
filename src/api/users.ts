import api from './client'

export interface User {
  id: string
  email: string
  full_name: string
  role: 'user' | 'admin'
  is_active: boolean
  monthly_income: number | null
  date_of_birth: string | null
  age: number | null
  risk_appetite: RiskAppetite | null
  created_at: string
  updated_at: string
}

export type RiskAppetite = 'conservative' | 'moderate' | 'aggressive'

export interface UpdateMeInput {
  full_name?: string
  password?: string
  monthly_income?: number
  date_of_birth?: string
  risk_appetite?: RiskAppetite
}

export interface CreateUserInput {
  email: string
  password: string
  full_name: string
}

export const getMe = () => api.get<User>('/users/me').then((r) => r.data)

export const updateMe = (data: UpdateMeInput) =>
  api.patch<User>('/users/me', data).then((r) => r.data)

export const getUsers = () => api.get<User[]>('/users').then((r) => r.data)

export const createUser = (data: CreateUserInput) =>
  api.post('/auth/register', data).then(() => undefined)

export const updateUser = (id: string, data: Partial<Pick<User, 'full_name' | 'role' | 'is_active'>>) =>
  api.patch<User>(`/users/${id}`, data).then((r) => r.data)

export const deleteUser = (id: string) => api.delete(`/users/${id}`)
