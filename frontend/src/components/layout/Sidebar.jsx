import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, FolderKanban, LogOut, Hexagon,
  User, Sun, Moon, Pencil, X, Check,
} from 'lucide-react'
import { clsx } from 'clsx'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { Badge, Spinner } from '@/components/ui'

const NAV = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/projects', icon: FolderKanban, label: 'Projetos' },
]

function ProfileModal({ user, onClose, onSave }) {
  const [name, setName] = useState(user?.name || '')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!name.trim()) return
    setSaving(true)
    // Salva localmente (atualiza localStorage e contexto)
    await new Promise((r) => setTimeout(r, 600)) // simula delay
    onSave(name.trim())
    setSaving(false)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" />
      <div className="relative w-full max-w-sm animate-slide-up"
        style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
        className="rounded-2xl shadow-2xl"
      >
        <div className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid var(--border)' }}>
          <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Editar Perfil</h2>
          <button
            onClick={onClose}
            className="btn-icon"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-6 py-5 flex flex-col gap-4">
          {/* Avatar */}
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-2xl bg-brand/20 border-2 border-brand/30 flex items-center justify-center text-2xl font-bold text-brand">
              {name[0]?.toUpperCase() || '?'}
            </div>
          </div>

          {/* Name input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium uppercase tracking-wider"
              style={{ color: 'var(--text-secondary)' }}>
              Nome
            </label>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Seu nome"
              autoFocus
            />
          </div>

          {/* Email (somente leitura) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium uppercase tracking-wider"
              style={{ color: 'var(--text-secondary)' }}>
              E-mail
            </label>
            <input
              className="input"
              value={user?.email || ''}
              disabled
              style={{ opacity: 0.5 }}
            />
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              O e-mail não pode ser alterado por aqui.
            </p>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              className="btn btn-ghost flex-1 justify-center"
              onClick={onClose}
            >
              Cancelar
            </button>
            <button
              className="btn btn-primary flex-1 justify-center"
              onClick={handleSave}
              disabled={saving || !name.trim()}
            >
              {saving ? <Spinner size={14} /> : <><Check size={14} /> Salvar</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Sidebar() {
  const { user, logout, updateUser } = useAuth()
  const { isDark, toggle } = useTheme()
  const navigate = useNavigate()
  const [showProfile, setShowProfile] = useState(false)

  const handleLogout = () => { logout(); navigate('/login') }

  const handleSaveName = (newName) => {
    // Atualiza o nome no localStorage e no contexto
    const updated = { ...user, name: newName }
    localStorage.setItem('user', JSON.stringify(updated))
    if (updateUser) updateUser(updated)
  }

  return (
    <>
      <aside
        className="w-56 shrink-0 flex flex-col h-screen sticky top-0"
        style={{
          background: 'var(--surface-1)',
          borderRight: '1px solid var(--border)',
          transition: 'background-color 0.2s ease',
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 py-5"
          style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="w-7 h-7 rounded-lg bg-brand flex items-center justify-center shadow-glow-sm">
            <Hexagon size={15} className="text-white" fill="currentColor" />
          </div>
          <span className="font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            ProjectHub
          </span>
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
                    : 'hover:bg-[var(--surface-3)]'
                )
              }
              style={({ isActive }) => ({
                color: isActive ? undefined : 'var(--text-secondary)',
              })}
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}

          {/* Botão Tema Claro/Escuro */}
          <button
            onClick={toggle}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 mt-2 hover:bg-[var(--surface-3)]"
            style={{ color: 'var(--text-secondary)' }}
            title={isDark ? 'Ativar modo claro' : 'Ativar modo escuro'}
          >
            {isDark ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} className="text-brand" />}
            {isDark ? 'Modo Claro' : 'Modo Escuro'}
          </button>
        </nav>

        {/* User card */}
        <div className="px-3 py-4" style={{ borderTop: '1px solid var(--border)' }}>
          <div
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg"
            style={{ background: 'var(--surface-3)' }}
          >
            <div className="w-7 h-7 rounded-lg bg-brand/20 border border-brand/30 flex items-center justify-center shrink-0">
              <User size={13} className="text-brand" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                {user?.name}
              </p>
              <div className="mt-0.5">
                <Badge type={user?.role} />
              </div>
            </div>
            <div className="flex items-center gap-0.5">
              {/* Editar perfil */}
              <button
                onClick={() => setShowProfile(true)}
                className="btn-icon w-6 h-6"
                title="Editar perfil"
              >
                <Pencil size={12} />
              </button>
              {/* Logout */}
              <button
                onClick={handleLogout}
                className="btn-icon w-6 h-6 hover:text-red-400"
                title="Sair"
              >
                <LogOut size={12} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {showProfile && (
        <ProfileModal
          user={user}
          onClose={() => setShowProfile(false)}
          onSave={handleSaveName}
        />
      )}
    </>
  )
}
