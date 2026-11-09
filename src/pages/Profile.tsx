import { useEffect, useState } from 'react'
import { getMe, updateMe, type RiskAppetite, type UpdateMeInput } from '../api/users'
import { useAuthStore } from '../store/auth'

const getError = (err: unknown, fallback: string) => {
  const detail = (err as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) return detail.map((d) => (d as { msg?: string }).msg ?? '').filter(Boolean).join(', ') || fallback
  return fallback
}

const yesterday = () => {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d.toISOString().slice(0, 10)
}

export default function Profile() {
  const { user, setUser } = useAuthStore()
  const [fullName, setFullName] = useState('')
  const [income, setIncome] = useState('')
  const [dob, setDob] = useState('')
  const [appetite, setAppetite] = useState<RiskAppetite | ''>('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [closing, setClosing] = useState(false)

  const closeMessage = () => {
    setClosing(true)
    setTimeout(() => {
      setMessage('')
      setClosing(false)
    }, 250)
  }

  const fill = (me: NonNullable<typeof user>) => {
    setFullName(me.full_name ?? '')
    setIncome(me.monthly_income ? String(me.monthly_income) : '')
    setDob(me.date_of_birth ?? '')
    setAppetite(me.risk_appetite ?? '')
  }

  useEffect(() => {
    getMe()
      .then((me) => {
        setUser(me)
        fill(me)
      })
      .catch((err: unknown) => setError(getError(err, 'Failed to load profile')))
      .finally(() => setLoading(false))
  }, [])

  const save = async (data: UpdateMeInput, success: string) => {
    setSaving(true)
    setError('')
    setMessage('')
    try {
      const updated = await updateMe(data)
      setUser(updated)
      fill(updated)
      setPassword('')
      setMessage(success)
    } catch (err) {
      setError(getError(err, 'Failed to update profile'))
    } finally {
      setSaving(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const data: UpdateMeInput = {}
    const name = fullName.trim()
    if (name && name !== user?.full_name) data.full_name = name
    if (income && Number(income) !== Number(user?.monthly_income ?? 0)) {
      if (!(Number(income) > 0)) return setError('Monthly income must be above 0')
      data.monthly_income = Number(income)
    }
    if (dob && dob !== user?.date_of_birth) data.date_of_birth = dob
    if (appetite && appetite !== user?.risk_appetite) data.risk_appetite = appetite
    if (password) {
      if (password.length < 8 || password.length > 128) return setError('Password must be 8 to 128 characters')
      data.password = password
    }
    if (Object.keys(data).length === 0) return setMessage('Nothing to update')
    void save(data, 'Profile updated')
  }

  if (loading) return <div className="page"><p className="text-muted">Loading profile...</p></div>

  return (
    <div className="page profile-page">
      <h2>My Profile</h2>

      {message && (
        <div className={`modal-overlay${closing ? ' closing' : ''}`} role="dialog" aria-modal="true">
          <div className="modal-box">
            <p>{message}</p>
            <button type="button" onClick={closeMessage} autoFocus>OK</button>
          </div>
        </div>
      )}

      <div className="chart-card">
        <form onSubmit={handleSubmit} className="profile-form">
          <label className="text-muted">Email
            <input value={user?.email ?? ''} disabled />
          </label>
          <label className="text-muted">Full name
            <input value={fullName} maxLength={255} onChange={(e) => setFullName(e.target.value)} />
          </label>
          <label className="text-muted">Monthly income (₹)
            <input
              type="text"
              inputMode="decimal"
              value={income}
              onChange={(e) => setIncome(e.target.value.replace(/[^0-9.]/g, ''))}
            />
          </label>
          <label className="text-muted">Date of birth {user?.age != null && <strong>(age {user.age})</strong>}
            <input type="date" value={dob} max={yesterday()} onChange={(e) => setDob(e.target.value)} />
          </label>
          <div className="profile-wide text-muted">
            Risk appetite
            <div className="risk-options">
              {(['conservative', 'moderate', 'aggressive'] as const).map((level) => (
                <button
                  key={level}
                  type="button"
                  className={appetite === level ? '' : 'btn-secondary'}
                  onClick={() => setAppetite(level)}
                >
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <label className="profile-wide text-muted">New password (leave blank to keep)
            <input
              type="password"
              value={password}
              minLength={8}
              maxLength={128}
              autoComplete="new-password"
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          {error && <p className="error profile-wide">{error}</p>}
          <button type="submit" className="profile-wide" disabled={saving}>{saving ? 'Saving...' : 'Save changes'}</button>
        </form>
      </div>
    </div>
  )
}
