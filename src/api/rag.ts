import api from './client'

export interface RagDocument {
  id: string
  filename: string
  description: string | null
  chunk_count: number
}

export interface AskResponse {
  question: string
  answer: string
  sources: string[]
}

export const uploadDocument = (file: File, description: string) => {
  const form = new FormData()
  form.append('file', file)
  form.append('description', description)
  return api.post<RagDocument>('/rag/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((r) => r.data)
}

export const askQuestion = (question: string) =>
  api.post<AskResponse>('/rag/ask', { question }).then((r) => r.data)

export const getDocuments = () =>
  api.get<RagDocument[]>('/rag/documents').then((r) => r.data)

export const deleteDocument = (id: string) =>
  api.delete(`/rag/documents/${id}`)
