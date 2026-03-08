import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, FolderKanban, LogOut, Hexagon, User } from 'lucide-react'
import { clsx } from 'clsx'
import { useAuth } from '@/context/AuthContext'
import { Badge } from '@/components/ui'

const NAV = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/projects', icon: FolderKanban, label: 'Projetos' },
]

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <aside className="w-56 shrink-0 flex flex-col h-screen sticky top-0 bg-surface-1 border-r border-border">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-border">
        <div className="w-7 h-7 rounded-lg bg-brand flex items-center justify-center shadow-glow-sm">
          <Hexagon size={15} className="text-white" fill="currentColor" />
        </div>
        <span className="font-semibold text-text-primary tracking-tight">ProjectHub</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-brand/15 text-brand border border-brand/20'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-3'
              )
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-border">
        <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-surface-3">
          <div className="w-7 h-7 rounded-lg bg-brand/20 border border-brand/30 flex items-center justify-center shrink-0">
            <User size={13} className="text-brand" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-text-primary truncate">{user?.name}</p>
            <div className="mt-0.5">
              <Badge type={user?.role} />
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="btn-icon w-6 h-6 text-text-muted hover:text-red-400"
            title="Sair"
          >
            <LogOut size={13} />
          </button>
        </div>
      </div>
    </aside>
  )
}
