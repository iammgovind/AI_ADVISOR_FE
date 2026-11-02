import { useEffect, useRef, useState } from 'react'
import { smartSend, getChatHistory, clearChatHistory, type ChatMessage } from '../api/chat'

export default function Chat() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
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
    if (!confirm('Clear all chat history?')) return
    await clearChatHistory()
    setMessages([])
  }

  return (
    <div className="page advisor-page">
      <div className="page-header">
        <h2>💬 AI Chat</h2>
        {messages.length > 0 && (
          <button className="btn-secondary" onClick={handleClear} style={{ fontSize: 13, padding: '6px 14px' }}>
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
              <div className="bubble-text">{m.content}</div>
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
    </div>
  )
}
