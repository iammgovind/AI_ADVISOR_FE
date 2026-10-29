import api from './client'

export type NotificationAlert = 'exceeded' | 'warning' | 'info'
export type NotificationType = 'budget' | 'goal' | 'expense' | 'savings'

export interface Notification {
  type: NotificationType
  alert: NotificationAlert
  message: string
  detail: string
}

export const getNotifications = (): Promise<Notification[]> =>
  api.get('/notifications').then((r) => r.data)
