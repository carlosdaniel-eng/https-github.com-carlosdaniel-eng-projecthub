import { useQuery } from '@tanstack/react-query'
import { FolderKanban, CheckSquare, TrendingUp, Activity, Clock, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { dashboardApi } from '@/api/tasks'
import { useAuth } from '@/context/AuthContext'
import { SkeletonCard, Badge } from '@/components/ui'
import { clsx } from 'clsx'

function StatCard({ icon: Icon, label, value, sub, accent = 'blue' }) {
  const accents = {
    blue: 'text-brand bg-brand/10 border-brand/20',
    green: 'text-green-400 bg-green-500/10 border-green-500/20',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  }
  return (
    <div className="card-hover animate-slide-up">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-text-muted uppercase tracking-wider font-medium">{label}</p>
          <p className="text-3xl font-semibold text-text-primary mt-1">{value ?? '—'}</p>
          {sub && <p className="text-xs text-text-muted mt-1">{sub}</p>}
        </div>
        <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center border', accents[accent])}>
          <Icon size={18} />
        </div>
      </div>
    </div>
  )
}

function ProgressBar({ value }) {
  return (
    <div className="h-1.5 bg-surface-3 rounded-full overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-brand to-indigo-500 rounded-full transition-all duration-700"
        style={{ width: `${value}%` }}
      />
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: dashboardApi.stats,
    refetchInterval: 30_000,
  })
  const { data: activity } = useQuery({
    queryKey: ['activity'],
    queryFn: dashboardApi.activity,
  })

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8 animate-fade-in">
        <h1 className="text-2xl font-semibold text-text-primary">
          Olá, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-text-muted text-sm mt-1">Veja o resumo dos seus projetos e tarefas.</p>
      </div>

      {/* Stats grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {Array(4).fill(0).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard icon={FolderKanban} label="Projetos" value={stats?.projects?.total} sub={`${stats?.projects?.active} ativos`} accent="blue" />
          <StatCard icon={CheckSquare} label="Tarefas" value={stats?.tasks?.total} sub={`${stats?.tasks?.done} concluídas`} accent="green" />
          <StatCard icon={Activity} label="Em progresso" value={stats?.tasks?.in_progress} sub="tarefas abertas" accent="amber" />
          <StatCard icon={TrendingUp} label="Conclusão" value={`${stats?.tasks?.completion_rate ?? 0}%`} sub="de todas as tarefas" accent="purple" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task breakdown */}
        <div className="card animate-slide-up">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-text-primary">Distribuição de Tarefas</h2>
          </div>
          {isLoading ? (
            <div className="flex flex-col gap-4">
              {Array(3).fill(0).map((_, i) => <div key={i} className="skeleton h-8" />)}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {[
                { label: 'A Fazer', key: 'todo', color: 'bg-slate-400', type: 'todo' },
                { label: 'Em Progresso', key: 'in_progress', color: 'bg-amber-400', type: 'in_progress' },
                { label: 'Concluídas', key: 'done', color: 'bg-green-400', type: 'done' },
              ].map(({ label, key, color, type }) => {
                const count = stats?.tasks?.[key] ?? 0
                const total = stats?.tasks?.total || 1
                const pct = Math.round((count / total) * 100)
                return (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className={clsx('w-2 h-2 rounded-full', color)} />
                        <span className="text-sm text-text-secondary">{label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-text-primary">{count}</span>
                        <span className="text-xs text-text-muted">{pct}%</span>
                      </div>
                    </div>
                    <ProgressBar value={pct} />
                  </div>
                )
              })}
            </div>
          )}
          <Link to="/projects" className="flex items-center gap-1.5 text-xs text-brand hover:text-brand-hover mt-5 transition-colors font-medium">
            Ver projetos <ArrowRight size={12} />
          </Link>
        </div>

        {/* Recent activity */}
        <div className="card animate-slide-up" style={{ animationDelay: '0.05s' }}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-text-primary">Atividade Recente</h2>
            <Clock size={14} className="text-text-muted" />
          </div>
          {!activity?.length ? (
            <p className="text-sm text-text-muted text-center py-8">Nenhuma atividade ainda.</p>
          ) : (
            <div className="flex flex-col gap-0">
              {activity?.slice(0, 8).map((log) => (
                <div key={log.id} className="flex items-start gap-3 py-2.5 border-b border-border last:border-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand mt-2 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-secondary truncate">
                      <span className="font-medium text-text-primary capitalize">{log.action}</span>
                      {' '}{log.entity_type}
                      {log.detail && <span className="text-text-muted"> — {log.detail}</span>}
                    </p>
                    <p className="text-xs text-text-muted mt-0.5">
                      {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: ptBR })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
