import api from './client'

export const login = (email: string, password: string) =>
  api.post('/auth/login', { email, password }).then((r) => r.data)

export const register = (email: string, password: string, full_name: string) =>
  api.post('/auth/register', { email, password, full_name }).then((r) => r.data)

export const logout = () =>
  api.post('/auth/logout').then((r) => r.data)
