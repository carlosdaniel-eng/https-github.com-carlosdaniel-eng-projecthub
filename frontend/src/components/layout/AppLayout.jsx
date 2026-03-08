import { Outlet, Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import Sidebar from './Sidebar'
import { Spinner } from '@/components/ui'

export default function AppLayout() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Spinner size={24} className="text-brand" />
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace />

  return (
    <div className="flex h-screen overflow-hidden page-bg">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
