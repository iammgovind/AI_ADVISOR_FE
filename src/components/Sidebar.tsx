import { NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth'
import { logout as logoutRequest } from '../api/auth'
import { useState, useEffect, useRef } from 'react'
import { getNotifications, type Notification } from '../api/notifications'
import { getMe, updateMe } from '../api/users'

const alertColor: Record<string, string> = {
  exceeded: 'var(--danger)',
  warning: '#f59e0b',
  info: '#22d3ee',
}

const links = [
  { to: '/dashboard', label: '📊 Dashboard' },
  { to: '/expenses', label: '💸 Expenses' },
  { to: '/budgets', label: '🎯 Budgets' },
  { to: '/goals', label: '🏆 Goals' },
  { to: '/investments', label: '💼 Investments' },
  { to: '/advisor', label: '🤖 AI Advisor' },
  { to: '/chat', label: '💬 AI Chat' },
  { to: '/agent', label: '🧠 Research Agent' },
  { to: '/multi-agent', label: '🤖 Multi-Agent Advisor' },
  { to: '/risk', label: '🛡️ Risk Assessment' },
  { to: '/savings', label: '💰 Savings Plan' },
  { to: '/analytics', label: '📈 Analytics' },
]

export default function Sidebar() {
  const { user, setUser, logout: clearSession } = useAuthStore()
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [showNotif, setShowNotif] = useState(false)
  const bellRef = useRef<HTMLDivElement>(null)
  const [editIncome, setEditIncome] = useState(false)
  const [incomeVal, setIncomeVal] = useState('')

  useEffect(() => {
    getMe().then((me) => {
      setUser(me)
      setIncomeVal(me.monthly_income ? String(me.monthly_income) : '')
    }).catch(() => {})
  }, [])

  const handleSaveIncome = async (e: React.FormEvent) => {
    e.preventDefault()
    const updated = await updateMe({ monthly_income: Number(incomeVal) })
    setUser(updated)
    setEditIncome(false)
  }

  const fetchNotifications = () =>
    getNotifications()
      .then((all) => {
        const critical = all.filter((n) => n.alert === 'exceeded' || n.alert === 'warning')
        setNotifications((prev) => {
          const prevCount = prev.filter((n) => n.alert === 'exceeded' || n.alert === 'warning').length
          if (critical.length > prevCount) {
            const newest = critical[0]
            const color = newest.alert === 'exceeded' ? '#e68260' : '#e8ae4a'
            const toast = document.createElement('div')
            toast.textContent = newest.message
            Object.assign(toast.style, {
              position: 'fixed', bottom: '24px', right: '24px', zIndex: '9999',
              background: color, color: '#fff', padding: '12px 18px',
              borderRadius: '10px', fontWeight: '600', fontSize: '14px',
              boxShadow: '0 8px 24px #0005', animation: 'none',
            })
            document.body.appendChild(toast)
            setTimeout(() => toast.remove(), 4000)
          }
          return all
        })
      })
      .catch(() => {})

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setShowNotif(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = async () => {
    try {
      await logoutRequest()
    } finally {
      clearSession()
      navigate('/login')
    }
  }

  const initials = user?.full_name
    ?.split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() ?? 'U'

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        FinanceAI
        <div ref={bellRef} style={{ position: 'relative', marginLeft: 'auto' }}>
          <button
            onClick={() => setShowNotif((v) => !v)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, position: 'relative', padding: 0 }}
            title="Notifications"
          >
            🔔
            {notifications.length > 0 && (
              <span style={{ position: 'absolute', top: -4, right: -4, background: 'var(--danger)', color: '#fff', borderRadius: '50%', fontSize: 10, width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                {notifications.length}
              </span>
            )}
          </button>
          {showNotif && (
            <div style={{ position: 'absolute', left: 0, top: '110%', width: 300, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, zIndex: 999, boxShadow: '0 8px 32px #0006', maxHeight: 400, overflowY: 'auto' }}>
              <div style={{ padding: '10px 14px', fontWeight: 600, borderBottom: '1px solid var(--border)', fontSize: 13 }}>Notifications</div>
              {notifications.length === 0 && <p style={{ padding: 14, color: 'var(--text-muted)', fontSize: 13 }}>All clear!</p>}
              {notifications.map((n, i) => (
                <div key={i} style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: alertColor[n.alert] }}>{n.message}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{n.detail}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <nav>
        {links.map((l) => (
          <NavLink key={l.to} to={l.to} className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            {l.label}
          </NavLink>
        ))}
        {user?.role === 'admin' && (
          <NavLink to="/users" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            👥 Users
          </NavLink>
        )}
      </nav>
      <div className="sidebar-footer">
        <div style={{ marginBottom: 10, fontSize: 12 }}>
          {editIncome ? (
            <form onSubmit={handleSaveIncome} style={{ display: 'flex', gap: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 7, padding: '0 8px', flex: 1 }}>
                <span style={{ color: '#8fb4a8', fontSize: 13 }}>₹</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={incomeVal}
                  onChange={(e) => setIncomeVal(e.target.value.replace(/[^0-9.]/g, ''))}
                  placeholder="Monthly income"
                  autoFocus
                  style={{ background: 'transparent', border: 'none', outline: 'none', color: '#f0f7f1', fontSize: 12, padding: '6px 4px', width: '100%' }}
                />
              </div>
              <button type="submit" style={{ padding: '4px 10px', fontSize: 12, borderRadius: 7 }}>✓</button>
              <button type="button" onClick={() => setEditIncome(false)} style={{ padding: '4px 8px', fontSize: 12, borderRadius: 7, background: 'transparent', border: '1px solid rgba(255,255,255,0.18)', color: '#a9c3b8' }}>✕</button>
            </form>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#8fb4a8' }}>
              <span>Income: <strong style={{ color: '#f0f7f1' }}>{user?.monthly_income ? `₹${Number(user.monthly_income).toLocaleString()}` : 'Not set'}</strong></span>
              <button onClick={() => setEditIncome(true)} style={{ background: 'transparent', border: 'none', color: '#8fb4a8', fontSize: 12, padding: '2px 6px', cursor: 'pointer' }}>✏️</button>
            </div>
          )}
        </div>
        <div className="account-row">
          <span className="account-avatar" aria-hidden="true">{initials}</span>
          <div className="account-details">
            <span className="user-name">{user?.full_name}</span>
            <span className="user-role">{user?.role}</span>
          </div>
          <button onClick={handleLogout} className="logout-btn" title="Log out" aria-label="Log out">↗</button>
        </div>
      </div>
    </aside>
  )
}
