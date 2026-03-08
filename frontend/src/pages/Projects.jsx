import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, FolderKanban, ArrowRight, CheckSquare, GitBranch, Trash2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { projectsApi } from '@/api/projects'
import { getErrorMessage } from '@/api/client'
import { useAuth } from '@/context/AuthContext'
import { Button, Input, Textarea, Select, Modal, Badge, Alert, Empty, SkeletonCard } from '@/components/ui'
import { clsx } from 'clsx'

function ProjectCard({ project, onDelete }) {
  const { user } = useAuth()
  const isOwner = project.owner_id === user?.id || user?.role === 'admin'
  const progress = project.task_count > 0
    ? Math.round((project.done_count / project.task_count) * 100)
    : 0

  return (
    <div className="card-hover group animate-fade-in flex flex-col gap-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge type={project.status} />
          </div>
          <Link to={`/projects/${project.id}`}>
            <h3 className="font-semibold text-text-primary hover:text-brand transition-colors truncate">
              {project.title}
            </h3>
          </Link>
        </div>
        {isOwner && (
          <button
            onClick={() => onDelete(project.id)}
            className="btn-icon opacity-0 group-hover:opacity-100 text-text-muted hover:text-red-400 transition-all"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      {/* Progress */}
      <div>
        <div className="flex justify-between text-xs text-text-muted mb-1.5">
          <span>{project.task_count} tarefas</span>
          <span>{progress}%</span>
        </div>
        <div className="h-1 bg-surface-3 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-brand to-indigo-500 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-text-muted">
          <span className="flex items-center gap-1">
            <CheckSquare size={11} />
            {project.done_count}/{project.task_count}
          </span>
          <span>
            {formatDistanceToNow(new Date(project.created_at), { locale: ptBR, addSuffix: true })}
          </span>
        </div>
        <Link
          to={`/projects/${project.id}`}
          className="btn-ghost btn-sm text-text-muted hover:text-brand gap-1"
        >
          Abrir <ArrowRight size={12} />
        </Link>
      </div>
    </div>
  )
}

const INITIAL = { title: '', description: '', github_repo: '' }

export default function Projects() {
  const qc = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState(INITIAL)
  const [formError, setFormError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: projectsApi.list,
  })

  const createMutation = useMutation({
    mutationFn: projectsApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      setShowCreate(false)
      setForm(INITIAL)
      setFormError('')
    },
    onError: (err) => setFormError(getErrorMessage(err)),
  })

  const deleteMutation = useMutation({
    mutationFn: projectsApi.remove,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })

  const handleCreate = (e) => {
    e.preventDefault()
    if (!form.title.trim()) { setFormError('O título é obrigatório.'); return }
    createMutation.mutate(form)
  }

  const filtered = (projects || []).filter((p) => {
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || p.status === statusFilter
    return matchSearch && matchStatus
  })

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 animate-fade-in">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Projetos</h1>
          <p className="text-text-muted text-sm mt-1">
            {projects?.length ?? 0} projeto{projects?.length !== 1 ? 's' : ''} no total
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus size={16} /> Novo Projeto
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6">
        <input
          className="input max-w-xs"
          placeholder="Buscar projetos..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="flex items-center gap-1">
          {['all', 'active', 'completed', 'archived'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={clsx(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                statusFilter === s
                  ? 'bg-brand/15 text-brand border border-brand/20'
                  : 'text-text-muted hover:text-text-secondary hover:bg-surface-3'
              )}
            >
              {{ all: 'Todos', active: 'Ativos', completed: 'Concluídos', archived: 'Arquivados' }[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(6).fill(0).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <Empty
          icon={FolderKanban}
          title={search ? 'Nenhum projeto encontrado' : 'Nenhum projeto ainda'}
          description={search ? 'Tente outro termo de busca.' : 'Crie seu primeiro projeto para começar.'}
          action={!search && (
            <Button onClick={() => setShowCreate(true)} variant="outline" size="sm">
              <Plus size={14} /> Criar Projeto
            </Button>
          )}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => (
            <ProjectCard key={p.id} project={p} onDelete={(id) => deleteMutation.mutate(id)} />
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal open={showCreate} onClose={() => { setShowCreate(false); setForm(INITIAL); setFormError('') }} title="Novo Projeto">
        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          <Alert type="error" message={formError} />
          <Input
            label="Título *"
            placeholder="Nome do projeto"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            autoFocus
          />
          <Textarea
            label="Descrição"
            placeholder="Descreva o objetivo do projeto..."
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
          <Input
            label="Repositório GitHub"
            placeholder="owner/repo"
            value={form.github_repo}
            onChange={(e) => setForm((f) => ({ ...f, github_repo: e.target.value }))}
          />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="ghost" className="flex-1 justify-center" onClick={() => setShowCreate(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={createMutation.isPending} className="flex-1 justify-center">
              Criar Projeto
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
