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
  // { to: '/advisor', label: '🤖 AI Advisor' },        // hidden: unified into /chat
  { to: '/chat', label: '💬 AI Chat' },
  // { to: '/agent', label: '🧠 Research Agent' },      // hidden: unified into /chat
  // { to: '/multi-agent', label: '🤖 Multi-Agent Advisor' }, // hidden: unified into /chat
  { to: '/risk', label: '🛡️ Risk Assessment' },
  { to: '/savings', label: '💰 Savings Plan' },
  { to: '/analytics', label: '📈 Analytics' },
]

export default function Sidebar() {
  const { user, setUser, logout: clearSession } = useAuthStore()
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [readKeys, setReadKeys] = useState<Set<string>>(() => new Set(JSON.parse(localStorage.getItem('notif_read') ?? '[]')))
  const [showNotif, setShowNotif] = useState(false)
  const bellRef = useRef<HTMLDivElement>(null)

  const notifKey = (n: Notification) => `${n.type}:${n.message}`
  const unreadCount = notifications.filter(n => !readKeys.has(notifKey(n))).length

  const markAllRead = () => {
    const keys = notifications.map(notifKey)
    const next = new Set([...readKeys, ...keys])
    setReadKeys(next)
    localStorage.setItem('notif_read', JSON.stringify([...next]))
  }

  const markOneRead = (n: Notification) => {
    const next = new Set([...readKeys, notifKey(n)])
    setReadKeys(next)
    localStorage.setItem('notif_read', JSON.stringify([...next]))
  }
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
      </div>
      <div ref={bellRef} style={{ position: 'fixed', top: 20, right: 28, zIndex: 1000 }}>
          <button
            onClick={() => setShowNotif((v) => !v)}
            style={{ background: '#d4e8d7', border: 'none', borderRadius: '50%', width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 18, position: 'relative', padding: 0, boxShadow: '0 2px 10px rgba(0,0,0,0.2)' }}
            title="Notifications"
          >
            🔔
            {unreadCount > 0 && (
              <span style={{ position: 'absolute', top: -4, right: -4, background: 'var(--danger)', color: '#fff', borderRadius: '50%', fontSize: 10, width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                {unreadCount}
              </span>
            )}
          </button>
          {showNotif && (
            <div style={{ position: 'absolute', right: 0, top: '110%', width: 300, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, zIndex: 999, boxShadow: '0 8px 32px #0006', maxHeight: 400, overflowY: 'auto' }}>
              <div style={{ padding: '10px 14px', fontWeight: 600, borderBottom: '1px solid var(--border)', fontSize: 13, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Notifications</span>
                {unreadCount > 0 && <button onClick={(e) => { e.stopPropagation(); markAllRead() }} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)', cursor: 'pointer' }}>Mark all read</button>}
              </div>
              {notifications.length === 0 && <p style={{ padding: 14, color: 'var(--text-muted)', fontSize: 13 }}>All clear!</p>}
              {notifications.map((n, i) => {
                const isRead = readKeys.has(notifKey(n))
                return (
                  <div key={i} onClick={() => markOneRead(n)} style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 2, opacity: isRead ? 0.45 : 1, cursor: 'pointer', background: isRead ? 'transparent' : 'rgba(255,255,255,0.03)' }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: alertColor[n.alert] }}>{n.message}</span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{n.detail}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      <nav>
        {links.map((l) => (
          <NavLink key={l.to} to={l.to} className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            {l.label}
          </NavLink>
        ))}
        {/* user?.role === 'admin' && (
          <NavLink to="/users" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            👥 Users
          </NavLink>
        ) */}
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
          <NavLink to="/profile" title="My Profile" style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0, flex: 1, textDecoration: 'none', color: 'inherit' }}>
            <span className="account-avatar" aria-hidden="true">{initials}</span>
            <div className="account-details">
              <span className="user-name">{user?.full_name}</span>
              <span className="user-role">My Profile</span>
            </div>
          </NavLink>
          <button onClick={handleLogout} className="logout-btn" title="Log out" aria-label="Log out">↗</button>
        </div>
      </div>
    </aside>
  )
}
