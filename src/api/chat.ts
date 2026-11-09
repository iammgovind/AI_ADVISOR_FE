import api from './client'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp?: string
}

export interface ChatReply {
  reply: string
}

// All chat messages go through /chat so the backend persists the conversation
export const smartSend = (message: string) => sendMessage(message)

export const sendMessage = (message: string) =>
  api.post<ChatReply>('/chat', { message }).then((r) => r.data)

export const getChatHistory = () =>
  api.get<ChatMessage[]>('/chat/history').then((r) => r.data)

export const clearChatHistory = () =>
  api.delete('/chat/history')
