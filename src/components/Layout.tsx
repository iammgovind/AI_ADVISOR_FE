import { Outlet, Navigate } from 'react-router-dom'
import Sidebar from './Sidebar'

export default function Layout() {
  const token = localStorage.getItem('access_token')
  if (!token) return <Navigate to="/login" replace />
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}
