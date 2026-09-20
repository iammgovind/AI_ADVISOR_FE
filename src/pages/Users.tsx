import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { getUsers, createUser, updateUser, deleteUser, type User } from '../api/users'
import { useAuthStore } from '../store/auth'
import { Navigate } from 'react-router-dom'

export default function Users() {
  const user = useAuthStore((s) => s.user)
  const [users, setUsers] = useState<User[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ email: '', password: '', full_name: '' })
  const [error, setError] = useState('')

  if (user?.role !== 'admin') return <Navigate to="/dashboard" replace />

  const load = () => getUsers().then(setUsers)
  useEffect(() => { load() }, [])

  const openCreate = () => {
    setForm({ email: '', password: '', full_name: '' })
    setError('')
    setModalOpen(true)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      await createUser(form)
      setForm({ email: '', password: '', full_name: '' })
      setModalOpen(false)
      load()
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(detail ?? 'Failed to create user')
    }
  }

  const setField = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((current) => ({ ...current, [field]: e.target.value }))

  const toggleActive = async (u: User) => {
    await updateUser(u.id, { is_active: !u.is_active })
    load()
  }

  const toggleRole = async (u: User) => {
    await updateUser(u.id, { role: u.role === 'admin' ? 'user' : 'admin' })
    load()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this user?')) return
    await deleteUser(id)
    load()
  }

  return (
    <div className="page">
      <div className="page-header">
        <h2>User Management</h2>
        <button onClick={openCreate}>+ Add User</button>
      </div>
      <div className="category-table">
        <table>
          <thead>
            <tr><th>Name</th><th>Email</th><th>Role</th><th>Active</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.full_name}</td>
                <td>{u.email}</td>
                <td>
                  <button className="btn-small" onClick={() => toggleRole(u)}>{u.role}</button>
                </td>
                <td>
                  <button className={`btn-small ${u.is_active ? 'btn-active' : 'btn-inactive'}`} onClick={() => toggleActive(u)}>
                    {u.is_active ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td>
                  <button className="btn-icon btn-danger" onClick={() => handleDelete(u.id)}>🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {modalOpen && createPortal(
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Add User</h3>
            <form onSubmit={handleCreate}>
              <input placeholder="Full name" value={form.full_name} onChange={setField('full_name')} required />
              <input placeholder="Email" type="email" value={form.email} onChange={setField('email')} required />
              <input placeholder="Password" type="password" value={form.password} onChange={setField('password')} required />
              {error && <p className="error">{error}</p>}
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>Close</button>
                <button type="submit">Add User</button>
              </div>
            </form>
          </div>
        </div>,
        document.body,
      )}
    </div>
  )
}
