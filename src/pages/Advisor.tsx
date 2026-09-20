import { useEffect, useRef, useState } from 'react'
import { askQuestion, uploadDocument, getDocuments, deleteDocument, type RagDocument, type AskResponse } from '../api/rag'

interface Message {
  role: 'user' | 'assistant'
  text: string
  sources?: string[]
}

export default function Advisor() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', text: 'Hello! I\'m your AI financial advisor. Upload PDF documents and ask me anything about finance, investments, or tax planning.' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [documents, setDocuments] = useState<RagDocument[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadDesc, setUploadDesc] = useState('')
  const [uploadError, setUploadError] = useState('')
  const [tab, setTab] = useState<'chat' | 'docs'>('chat')
  const bottomRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => { getDocuments().then(setDocuments).catch(() => {}) }, [])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return
    const question = input.trim()
    setInput('')
    setMessages((m) => [...m, { role: 'user', text: question }])
    setLoading(true)
    try {
      const res: AskResponse = await askQuestion(question)
      setMessages((m) => [...m, { role: 'assistant', text: res.answer, sources: res.sources }])
    } catch {
      setMessages((m) => [...m, { role: 'assistant', text: 'Sorry, something went wrong. Please try again.' }])
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    setUploadError('')
    const file = fileRef.current?.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const doc = await uploadDocument(file, uploadDesc)
      setDocuments((d) => [...d, doc])
      setUploadDesc('')
      if (fileRef.current) fileRef.current.value = ''
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setUploadError(detail ?? 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this document?')) return
    await deleteDocument(id)
    setDocuments((d) => d.filter((doc) => doc.id !== id))
  }

  return (
    <div className="page advisor-page">
      <div className="page-header">
        <h2>🤖 AI Financial Advisor</h2>
        <div className="tab-bar">
          <button onClick={() => setTab('chat')} className={tab === 'chat' ? '' : 'btn-secondary'} style={{ padding: '6px 16px', fontSize: 13 }}>Chat</button>
          <button onClick={() => setTab('docs')} className={tab === 'docs' ? '' : 'btn-secondary'} style={{ padding: '6px 16px', fontSize: 13 }}>
            Documents {documents.length > 0 && <span className="doc-count">{documents.length}</span>}
          </button>
        </div>
      </div>

      {tab === 'chat' ? (
        <div className="chat-layout">
          <div className="chat-messages">
            {messages.map((m, i) => (
              <div key={i} className={`chat-bubble ${m.role}`}>
                <div className="bubble-text">{m.text}</div>
                {m.sources && m.sources.length > 0 && (
                  <div className="bubble-sources">
                    📎 {m.sources.join(', ')}
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="chat-bubble assistant">
                <div className="typing-indicator"><span /><span /><span /></div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <form className="chat-input-row" onSubmit={handleAsk}>
            <input
              placeholder="Ask about investments, tax, SIP, budgeting..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              autoFocus
            />
            <button type="submit" disabled={loading || !input.trim()}>Send</button>
          </form>
        </div>
      ) : (
        <div className="docs-layout">
          <form className="upload-form" onSubmit={handleUpload}>
            <h3>Upload PDF Document</h3>
            <input ref={fileRef} type="file" accept=".pdf" required />
            <input placeholder="Description (optional)" value={uploadDesc} onChange={(e) => setUploadDesc(e.target.value)} />
            {uploadError && <p className="error">{uploadError}</p>}
            <button type="submit" disabled={uploading}>{uploading ? 'Uploading...' : 'Upload'}</button>
          </form>

          <h3>Uploaded Documents</h3>
          {documents.length === 0 ? (
            <p className="empty">No documents uploaded yet. Upload PDFs to enable AI answers.</p>
          ) : (
            <div className="category-table">
              <table>
                <thead><tr><th>Filename</th><th>Description</th><th>Chunks</th><th></th></tr></thead>
                <tbody>
                  {documents.map((d) => (
                    <tr key={d.id}>
                      <td>📄 {d.filename}</td>
                      <td className="text-muted">{d.description ?? '—'}</td>
                      <td>{d.chunk_count}</td>
                      <td>
                        <button className="btn-icon btn-danger" onClick={() => handleDelete(d.id)}>🗑️</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
