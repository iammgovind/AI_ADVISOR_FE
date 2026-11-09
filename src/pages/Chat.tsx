import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { smartSend, getChatHistory, clearChatHistory, type ChatMessage } from '../api/chat'

export default function Chat() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    getChatHistory()
      .then(setMessages)
      .catch(() => {})
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return
    const message = input.trim()
    setInput('')
    setMessages((m) => [...m, { role: 'user', content: message }])
    setLoading(true)
    try {
      const res = await smartSend(message)
      setMessages((m) => [...m, { role: 'assistant', content: res.reply }])
    } catch {
      setMessages((m) => [...m, { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }])
    } finally {
      setLoading(false)
    }
  }

  const handleClear = async () => {
    setConfirmOpen(false)
    await clearChatHistory()
    setMessages([])
  }

  return (
    <div className="page advisor-page">
      <div className="page-header">
        <h2>💬 AI Chat</h2>
        {messages.length > 0 && (
          <button className="btn-secondary" onClick={() => setConfirmOpen(true)} style={{ fontSize: 13, padding: '6px 14px' }}>
            Clear History
          </button>
        )}
      </div>

      <div className="chat-layout">
        <div className="chat-messages">
          {messages.length === 0 && !loading && (
            <div className="chat-bubble assistant">
              <div className="bubble-text">Hello! I'm your unified AI financial assistant. Ask about your risk profile, investments, financial health, savings, or anything else!</div>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`chat-bubble ${m.role}`}>
              <div className="bubble-text markdown-body">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
              </div>
            </div>
          ))}
          {loading && (
            <div className="chat-bubble assistant">
              <div className="typing-indicator"><span /><span /><span /></div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <form className="chat-input-row" onSubmit={handleSend}>
          <input
            placeholder="Ask about risk, investments, health score, savings..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            autoFocus
          />
          <button type="submit" disabled={loading || !input.trim()}>Send</button>
        </form>
      </div>

      {confirmOpen && createPortal(
        <div className="modal-overlay" onClick={() => setConfirmOpen(false)}>
          <div className="modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <h3>Clear chat history?</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: 18 }}>
              This will permanently delete all your chat messages.
            </p>
            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={() => setConfirmOpen(false)}>Cancel</button>
              <button type="button" onClick={handleClear}>Clear</button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  )
}
