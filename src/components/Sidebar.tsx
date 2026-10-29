import { NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth'
import { logout as logoutRequest } from '../api/auth'
import { useState, useEffect, useRef } from 'react'
import { getNotifications, type Notification } from '../api/notifications'

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
  const { user, logout: clearSession } = useAuthStore()
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [showNotif, setShowNotif] = useState(false)
  const bellRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    getNotifications().then(setNotifications).catch(() => {})
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
