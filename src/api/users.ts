import api from './client'

export interface User {
  id: string
  email: string
  full_name: string
  role: 'user' | 'admin'
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CreateUserInput {
  email: string
  password: string
  full_name: string
}

export const getUsers = () => api.get<User[]>('/users').then((r) => r.data)

export const createUser = (data: CreateUserInput) =>
  api.post('/auth/register', data).then(() => undefined)

export const updateUser = (id: string, data: Partial<Pick<User, 'full_name' | 'role' | 'is_active'>>) =>
  api.patch<User>(`/users/${id}`, data).then((r) => r.data)

export const deleteUser = (id: string) => api.delete(`/users/${id}`)
