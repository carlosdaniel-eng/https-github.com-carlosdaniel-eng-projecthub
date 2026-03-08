import { clsx } from 'clsx'
import { X, AlertCircle, CheckCircle2, Info, Loader2 } from 'lucide-react'

// ── Spinner ──────────────────────────────────────────────────────────────────
export function Spinner({ size = 16, className = '' }) {
  return <Loader2 size={size} className={clsx('animate-spin', className)} />
}

// ── Button ───────────────────────────────────────────────────────────────────
export function Button({
  children, variant = 'primary', size = 'md', loading = false,
  className = '', disabled, ...props
}) {
  const base = 'btn'
  const variants = {
    primary: 'btn-primary',
    ghost: 'btn-ghost',
    outline: 'btn-outline',
    danger: 'btn-danger',
    icon: 'btn-icon',
  }
  const sizes = { sm: 'btn-sm', md: '', lg: 'text-base px-5 py-3' }

  return (
    <button
      className={clsx(base, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Spinner size={14} /> : children}
    </button>
  )
}

// ── Input ─────────────────────────────────────────────────────────────────────
export function Input({ label, error, className = '', ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">{label}</label>}
      <input className={clsx('input', error && 'border-red-500/50 focus:border-red-500/70', className)} {...props} />
      {error && <p className="text-xs text-red-400 flex items-center gap-1"><AlertCircle size={11} />{error}</p>}
    </div>
  )
}

// ── Textarea ──────────────────────────────────────────────────────────────────
export function Textarea({ label, error, className = '', ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">{label}</label>}
      <textarea
        rows={3}
        className={clsx('input resize-none', error && 'border-red-500/50', className)}
        {...props}
      />
      {error && <p className="text-xs text-red-400 flex items-center gap-1"><AlertCircle size={11} />{error}</p>}
    </div>
  )
}

// ── Select ───────────────────────────────────────────────────────────────────
export function Select({ label, error, options = [], className = '', ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">{label}</label>}
      <select
        className={clsx(
          'input appearance-none cursor-pointer',
          error && 'border-red-500/50',
          className
        )}
        {...props}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-surface-3">
            {o.label}
          </option>
        ))}
      </select>
    </div>
  )
}

// ── Badge ─────────────────────────────────────────────────────────────────────
const BADGE_STYLES = {
  // status
  todo: 'bg-slate-500/15 text-slate-400 border border-slate-500/20',
  in_progress: 'bg-amber-500/15 text-amber-400 border border-amber-500/20',
  done: 'bg-green-500/15 text-green-400 border border-green-500/20',
  active: 'bg-blue-500/15 text-blue-400 border border-blue-500/20',
  archived: 'bg-gray-500/15 text-gray-400 border border-gray-500/20',
  completed: 'bg-green-500/15 text-green-400 border border-green-500/20',
  // priority
  low: 'bg-green-500/15 text-green-400 border border-green-500/20',
  medium: 'bg-amber-500/15 text-amber-400 border border-amber-500/20',
  high: 'bg-red-500/15 text-red-400 border border-red-500/20',
  // role
  admin: 'bg-purple-500/15 text-purple-400 border border-purple-500/20',
  user: 'bg-blue-500/15 text-blue-400 border border-blue-500/20',
  owner: 'bg-orange-500/15 text-orange-400 border border-orange-500/20',
  member: 'bg-slate-500/15 text-slate-400 border border-slate-500/20',
}

const BADGE_LABELS = {
  todo: 'A Fazer', in_progress: 'Em Progresso', done: 'Concluído',
  active: 'Ativo', archived: 'Arquivado', completed: 'Concluído',
  low: 'Baixa', medium: 'Média', high: 'Alta',
  admin: 'Admin', user: 'Usuário', owner: 'Dono', member: 'Membro', viewer: 'Visitante',
}

export function Badge({ type, label, className = '' }) {
  return (
    <span className={clsx('badge', BADGE_STYLES[type] || 'bg-surface-3 text-text-secondary', className)}>
      {label || BADGE_LABELS[type] || type}
    </span>
  )
}

// ── Modal ─────────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, size = 'md' }) {
  if (!open) return null
  const sizes = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-2xl' }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" />
      <div className={clsx(
        'relative w-full bg-surface-2 border border-border rounded-2xl shadow-2xl animate-slide-up',
        sizes[size]
      )}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-semibold text-text-primary">{title}</h2>
          <button onClick={onClose} className="btn-icon"><X size={16} /></button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  )
}

// ── Alert ─────────────────────────────────────────────────────────────────────
export function Alert({ type = 'error', message }) {
  if (!message) return null
  const styles = {
    error: 'bg-red-500/10 border-red-500/30 text-red-400',
    success: 'bg-green-500/10 border-green-500/30 text-green-400',
    info: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
  }
  const icons = { error: AlertCircle, success: CheckCircle2, info: Info }
  const Icon = icons[type]
  return (
    <div className={clsx('flex items-start gap-2.5 p-3 rounded-lg border text-sm', styles[type])}>
      <Icon size={15} className="mt-0.5 shrink-0" />
      <span>{message}</span>
    </div>
  )
}

// ── Empty state ───────────────────────────────────────────────────────────────
export function Empty({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4 text-center animate-fade-in">
      {Icon && (
        <div className="w-12 h-12 rounded-xl bg-surface-3 flex items-center justify-center text-text-muted">
          <Icon size={22} />
        </div>
      )}
      <div>
        <p className="font-medium text-text-secondary">{title}</p>
        {description && <p className="text-xs text-text-muted mt-1">{description}</p>}
      </div>
      {action}
    </div>
  )
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
export function SkeletonCard() {
  return (
    <div className="card flex flex-col gap-3">
      <div className="skeleton h-4 w-3/4" />
      <div className="skeleton h-3 w-full" />
      <div className="skeleton h-3 w-1/2" />
      <div className="flex gap-2 mt-2">
        <div className="skeleton h-5 w-16 rounded-full" />
        <div className="skeleton h-5 w-12 rounded-full" />
      </div>
    </div>
  )
}
