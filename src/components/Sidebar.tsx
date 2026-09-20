import { NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth'
import { logout as logoutRequest } from '../api/auth'

const links = [
  { to: '/dashboard', label: '📊 Dashboard' },
  { to: '/expenses', label: '💸 Expenses' },
  { to: '/budgets', label: '🎯 Budgets' },
  { to: '/goals', label: '🏆 Goals' },
  { to: '/investments', label: '💼 Investments' },
  { to: '/advisor', label: '🤖 AI Advisor' },
  { to: '/agent', label: '🧠 Research Agent' },
  { to: '/multi-agent', label: '🤖 Multi-Agent Advisor' },
  { to: '/risk', label: '🛡️ Risk Assessment' },
  { to: '/savings', label: '💰 Savings Plan' },
  { to: '/analytics', label: '📈 Analytics' },
]

export default function Sidebar() {
  const { user, logout: clearSession } = useAuthStore()
  const navigate = useNavigate()

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
      <div className="sidebar-brand">FinanceAI</div>
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
