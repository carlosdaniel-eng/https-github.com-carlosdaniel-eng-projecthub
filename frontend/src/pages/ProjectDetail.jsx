import { useState, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { isAfter, startOfDay, formatDistanceToNow, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import confetti from 'canvas-confetti'
import {
  ArrowLeft, Plus, GitCommit, Clock, Circle, Check,
  Trash2, Search, X, AlertTriangle,
} from 'lucide-react'
import { projectsApi } from '@/api/projects'
import { tasksApi } from '@/api/tasks'
import { getErrorMessage } from '@/api/client'
import { useAuth } from '@/context/AuthContext'
import { Button, Input, Textarea, Select, Modal, Badge, Alert, Empty, Spinner } from '@/components/ui'
import { clsx } from 'clsx'

// ── Helpers ───────────────────────────────────────────────────────────────────
const STATUS_COLS = [
  { key: 'todo',        label: 'A Fazer',       icon: Circle, color: 'text-slate-400' },
  { key: 'in_progress', label: 'Em Progresso',  icon: Clock,  color: 'text-amber-400' },
  { key: 'done',        label: 'Concluído',     icon: Check,  color: 'text-green-400' },
]

const PRIORITY_DOT = { low: 'bg-green-400', medium: 'bg-amber-400', high: 'bg-red-400' }

function isOverdue(task) {
  if (!task.due_date || task.status === 'done') return false
  return isAfter(startOfDay(new Date()), new Date(task.due_date + 'T23:59:59'))
}

function fireConfetti() {
  confetti({
    particleCount: 120,
    spread: 80,
    origin: { y: 0.55 },
    colors: ['#3b82f6', '#22c55e', '#f59e0b', '#6366f1', '#ec4899'],
  })
}

// ── TaskCard ──────────────────────────────────────────────────────────────────
function TaskCard({ task, onEdit, onDelete }) {
  const overdue = isOverdue(task)

  return (
    <div
      onClick={() => onEdit(task)}
      className={clsx(
        'rounded-xl p-3.5 group transition-all duration-150 cursor-pointer animate-fade-in',
        overdue ? 'task-overdue' : ''
      )}
      style={{
        background: 'var(--surface-3)',
        border: overdue ? '1px solid rgba(239,68,68,0.4)' : '1px solid var(--border)',
      }}
      onMouseEnter={(e) => {
        if (!overdue) e.currentTarget.style.borderColor = 'var(--border-strong)'
      }}
      onMouseLeave={(e) => {
        if (!overdue) e.currentTarget.style.borderColor = 'var(--border)'
      }}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-sm font-medium leading-snug line-clamp-2" style={{ color: 'var(--text-primary)' }}>
          {task.title}
        </p>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(task.id) }}
          className="btn-icon w-6 h-6 opacity-0 group-hover:opacity-100 shrink-0 hover:text-red-400"
          style={{ color: 'var(--text-muted)' }}
        >
          <Trash2 size={11} />
        </button>
      </div>

      {task.description && (
        <p className="text-xs mb-2 line-clamp-2" style={{ color: 'var(--text-muted)' }}>
          {task.description}
        </p>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={clsx('w-1.5 h-1.5 rounded-full', PRIORITY_DOT[task.priority])} />
          <Badge type={task.priority} />
        </div>

        {task.due_date && (
          <div className={clsx(
            'flex items-center gap-1 text-xs',
            overdue ? 'text-red-400 font-medium' : ''
          )} style={{ color: overdue ? undefined : 'var(--text-muted)' }}>
            {overdue && <AlertTriangle size={10} />}
            {format(new Date(task.due_date + 'T00:00:00'), 'dd MMM', { locale: ptBR })}
            {overdue && <span className="text-xs ml-0.5">(vencida)</span>}
          </div>
        )}
      </div>

      {task.assignee && (
        <div className="mt-2 pt-2 flex items-center gap-1.5"
          style={{ borderTop: '1px solid var(--border)' }}>
          <div className="w-4 h-4 rounded bg-brand/20 border border-brand/30 flex items-center justify-center text-[9px] text-brand font-bold">
            {task.assignee.name[0].toUpperCase()}
          </div>
          <span className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
            {task.assignee.name}
          </span>
        </div>
      )}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
const TASK_INIT = { title: '', description: '', status: 'todo', priority: 'medium', due_date: '', assignee_id: '' }

export default function ProjectDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { user } = useAuth()

  const [taskModal, setTaskModal] = useState({ open: false, task: null })
  const [taskForm, setTaskForm] = useState(TASK_INIT)
  const [taskError, setTaskError] = useState('')
  const [activeTab, setActiveTab] = useState('board')
  const [search, setSearch] = useState('')   // ← Filtro de busca nas tarefas

  const { data: project, isLoading: loadingProject } = useQuery({
    queryKey: ['project', id],
    queryFn: () => projectsApi.get(id),
  })

  const { data: tasks, isLoading: loadingTasks } = useQuery({
    queryKey: ['tasks', id],
    queryFn: () => tasksApi.list(id),
    enabled: !!id,
  })

  const { data: commits, isLoading: loadingCommits } = useQuery({
    queryKey: ['commits', id],
    queryFn: () => projectsApi.commits(id),
    enabled: activeTab === 'github' && !!project?.github_repo,
    retry: false,
  })

  const { data: activity } = useQuery({
    queryKey: ['project-activity', id],
    queryFn: () => projectsApi.activity(id),
    enabled: activeTab === 'activity',
  })

  const createTask = useMutation({
    mutationFn: (data) => tasksApi.create(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tasks', id] }); closeTaskModal() },
    onError: (err) => setTaskError(getErrorMessage(err)),
  })

  const updateTask = useMutation({
    mutationFn: ({ taskId, data }) => tasksApi.update(taskId, data),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['tasks', id] })
      closeTaskModal()
      // 🎉 Dispara confete quando tarefa for concluída
      if (variables.data.status === 'done') {
        fireConfetti()
      }
    },
    onError: (err) => setTaskError(getErrorMessage(err)),
  })

  const deleteTask = useMutation({
    mutationFn: tasksApi.remove,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks', id] }),
  })

  const openCreateTask = (status = 'todo') => {
    setTaskForm({ ...TASK_INIT, status })
    setTaskModal({ open: true, task: null })
    setTaskError('')
  }

  const openEditTask = (task) => {
    setTaskForm({
      title: task.title,
      description: task.description || '',
      status: task.status,
      priority: task.priority,
      due_date: task.due_date || '',
      assignee_id: task.assignee?.id ? String(task.assignee.id) : '',
    })
    setTaskModal({ open: true, task })
    setTaskError('')
  }

  const closeTaskModal = () => {
    setTaskModal({ open: false, task: null })
    setTaskForm(TASK_INIT)
    setTaskError('')
  }

  const handleTaskSubmit = (e) => {
    e.preventDefault()
    if (!taskForm.title.trim()) { setTaskError('O título é obrigatório.'); return }
    const payload = {
      ...taskForm,
      assignee_id: taskForm.assignee_id ? parseInt(taskForm.assignee_id) : null,
      due_date: taskForm.due_date || null,
    }
    if (taskModal.task) {
      updateTask.mutate({ taskId: taskModal.task.id, data: payload })
    } else {
      createTask.mutate(payload)
    }
  }

  // ── Filtro de busca ───────────────────────────────────────────────────────
  const filterTasks = useCallback((list) => {
    if (!search.trim()) return list || []
    return (list || []).filter((t) =>
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.description?.toLowerCase().includes(search.toLowerCase())
    )
  }, [search])

  const tasksByStatus = (status) =>
    filterTasks(tasks).filter((t) => t.status === status)

  const overdueCount = (tasks || []).filter(isOverdue).length

  // ── Loading / not found ───────────────────────────────────────────────────
  if (loadingProject) {
    return (
      <div className="p-8 flex items-center justify-center h-64">
        <Spinner size={24} className="text-brand" />
      </div>
    )
  }
  if (!project) {
    return (
      <div className="p-8">
        <p style={{ color: 'var(--text-muted)' }}>Projeto não encontrado.</p>
        <Button variant="ghost" onClick={() => navigate('/projects')} className="mt-4">
          <ArrowLeft size={14} /> Voltar
        </Button>
      </div>
    )
  }

  const isOwner = project.owner_id === user?.id || user?.role === 'admin'
  const memberOptions = [
    { value: '', label: 'Sem responsável' },
    ...(project.members || []).map((m) => ({ value: String(m.user.id), label: m.user.name })),
  ]

  const TABS = [
    { key: 'board',    label: 'Board' },
    { key: 'members',  label: `Membros (${project.members?.length ?? 0})` },
    ...(project.github_repo ? [{ key: 'github', label: 'GitHub' }] : []),
    { key: 'activity', label: 'Atividade' },
  ]

  return (
    <div className="flex flex-col min-h-screen">
      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <div
        className="sticky top-0 z-10 backdrop-blur-md px-8 py-4"
        style={{
          background: 'rgba(var(--surface-1-raw, 15,17,23),0.85)',
          backgroundColor: 'var(--surface-1)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div className="flex items-center gap-4">
          <Link to="/projects" className="btn-icon"><ArrowLeft size={16} /></Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5">
              <h1 className="text-lg font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                {project.title}
              </h1>
              <Badge type={project.status} />
              {overdueCount > 0 && (
                <span className="flex items-center gap-1 text-xs font-medium text-red-400 bg-red-500/10 border border-red-500/20 rounded-full px-2 py-0.5">
                  <AlertTriangle size={10} />
                  {overdueCount} vencida{overdueCount > 1 ? 's' : ''}
                </span>
              )}
            </div>
            {project.description && (
              <p className="text-xs truncate mt-0.5" style={{ color: 'var(--text-muted)' }}>
                {project.description}
              </p>
            )}
          </div>
          <Button size="sm" onClick={() => openCreateTask()}>
            <Plus size={14} /> Nova Tarefa
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-0 mt-3 -mb-4">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={clsx(
                'px-4 py-2 text-sm font-medium border-b-2 transition-all',
                activeTab === tab.key
                  ? 'border-brand text-brand'
                  : 'border-transparent hover:text-[var(--text-secondary)]'
              )}
              style={{ color: activeTab === tab.key ? undefined : 'var(--text-muted)' }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────────────────────── */}
      <div className="flex-1 p-8 pt-6">

        {/* ── Board ────────────────────────────────────────────────────── */}
        {activeTab === 'board' && (
          <>
            {/* 🔍 Barra de busca nas tarefas */}
            <div className="flex items-center gap-3 mb-5">
              <div className="relative max-w-xs w-full">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                <input
                  className="input pl-9 pr-8"
                  placeholder="Buscar tarefas..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 hover:text-red-400 transition-colors"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
              {search && (
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {filterTasks(tasks).length} resultado{filterTasks(tasks).length !== 1 ? 's' : ''} para "{search}"
                </p>
              )}
            </div>

            {/* Colunas Kanban */}
            <div className="grid grid-cols-3 gap-4 min-h-[60vh]">
              {STATUS_COLS.map(({ key, label, icon: Icon, color }) => {
                const colTasks = tasksByStatus(key)
                return (
                  <div key={key} className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon size={14} className={color} />
                        <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                          {label}
                        </span>
                        <span
                          className="text-xs rounded-full px-1.5 py-0.5"
                          style={{ color: 'var(--text-muted)', background: 'var(--surface-3)' }}
                        >
                          {colTasks.length}
                        </span>
                      </div>
                      <button
                        onClick={() => openCreateTask(key)}
                        className="btn-icon w-6 h-6 hover:text-brand"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        <Plus size={13} />
                      </button>
                    </div>

                    <div className="flex flex-col gap-2 min-h-[8rem]">
                      {loadingTasks ? (
                        <div className="flex justify-center py-8">
                          <Spinner size={16} className="text-brand" />
                        </div>
                      ) : colTasks.length === 0 ? (
                        <button
                          onClick={() => openCreateTask(key)}
                          className="rounded-xl p-4 text-center text-xs transition-all"
                          style={{
                            border: '1px dashed var(--border)',
                            color: 'var(--text-muted)',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = 'var(--border-strong)'
                            e.currentTarget.style.color = 'var(--text-secondary)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = 'var(--border)'
                            e.currentTarget.style.color = 'var(--text-muted)'
                          }}
                        >
                          + Adicionar tarefa
                        </button>
                      ) : (
                        colTasks.map((t) => (
                          <TaskCard
                            key={t.id}
                            task={t}
                            onEdit={openEditTask}
                            onDelete={(tid) => deleteTask.mutate(tid)}
                          />
                        ))
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* ── Members ────────────────────────────────────────────────── */}
        {activeTab === 'members' && (
          <div className="max-w-lg flex flex-col gap-2">
            {project.members?.map((m) => (
              <div key={m.id} className="card flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-brand/15 border border-brand/20 flex items-center justify-center font-semibold text-brand">
                  {m.user.name[0].toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{m.user.name}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{m.user.email}</p>
                </div>
                <Badge type={m.role_in_project} />
              </div>
            ))}
          </div>
        )}

        {/* ── GitHub ─────────────────────────────────────────────────── */}
        {activeTab === 'github' && (
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-4 text-sm" style={{ color: 'var(--text-muted)' }}>
              <GitCommit size={14} />
              <span>Commits de <span className="text-brand font-mono">{project.github_repo}</span></span>
            </div>
            {loadingCommits ? (
              <div className="flex justify-center py-12"><Spinner size={20} className="text-brand" /></div>
            ) : !commits?.length ? (
              <Empty icon={GitCommit} title="Nenhum commit encontrado" description="Verifique se o repositório está correto." />
            ) : (
              <div className="flex flex-col gap-0">
                {commits.map((c) => (
                  <a key={c.sha} href={c.url} target="_blank" rel="noreferrer"
                    className="flex items-start gap-3 py-3 px-2 rounded-lg transition-colors"
                    style={{ borderBottom: '1px solid var(--border)' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-3)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <span className="font-mono text-xs text-brand bg-brand/10 border border-brand/20 px-1.5 py-0.5 rounded mt-0.5 shrink-0">
                      {c.sha}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate" style={{ color: 'var(--text-primary)' }}>{c.message}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        {c.author} — {format(new Date(c.date), "dd MMM yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Activity ───────────────────────────────────────────────── */}
        {activeTab === 'activity' && (
          <div className="max-w-lg">
            {!activity?.length ? (
              <Empty icon={Clock} title="Sem atividade" description="Ações no projeto aparecerão aqui." />
            ) : (
              <div className="flex flex-col gap-0">
                {activity?.map((log) => (
                  <div key={log.id} className="flex items-start gap-3 py-3"
                    style={{ borderBottom: '1px solid var(--border)' }}>
                    <div className="w-2 h-2 rounded-full bg-brand mt-1.5 shrink-0" />
                    <div>
                      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        <span className="capitalize font-medium" style={{ color: 'var(--text-primary)' }}>
                          {log.action}
                        </span>
                        {' '}{log.entity_type}
                        {log.detail && <span style={{ color: 'var(--text-muted)' }}> — {log.detail}</span>}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: ptBR })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Task Modal ───────────────────────────────────────────────────── */}
      <Modal
        open={taskModal.open}
        onClose={closeTaskModal}
        title={taskModal.task ? 'Editar Tarefa' : 'Nova Tarefa'}
        size="lg"
      >
        <form onSubmit={handleTaskSubmit} className="flex flex-col gap-4">
          <Alert type="error" message={taskError} />
          <Input
            label="Título *"
            placeholder="Descreva a tarefa"
            value={taskForm.title}
            onChange={(e) => setTaskForm((f) => ({ ...f, title: e.target.value }))}
            autoFocus
          />
          <Textarea
            label="Descrição"
            placeholder="Detalhes opcionais..."
            value={taskForm.description}
            onChange={(e) => setTaskForm((f) => ({ ...f, description: e.target.value }))}
          />
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Status"
              value={taskForm.status}
              onChange={(e) => setTaskForm((f) => ({ ...f, status: e.target.value }))}
              options={[
                { value: 'todo',        label: 'A Fazer' },
                { value: 'in_progress', label: 'Em Progresso' },
                { value: 'done',        label: 'Concluído 🎉' },
              ]}
            />
            <Select
              label="Prioridade"
              value={taskForm.priority}
              onChange={(e) => setTaskForm((f) => ({ ...f, priority: e.target.value }))}
              options={[
                { value: 'low',    label: 'Baixa' },
                { value: 'medium', label: 'Média' },
                { value: 'high',   label: 'Alta' },
              ]}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Data limite"
              type="date"
              value={taskForm.due_date}
              onChange={(e) => setTaskForm((f) => ({ ...f, due_date: e.target.value }))}
            />
            <Select
              label="Responsável"
              value={taskForm.assignee_id}
              onChange={(e) => setTaskForm((f) => ({ ...f, assignee_id: e.target.value }))}
              options={memberOptions}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="ghost" className="flex-1 justify-center" onClick={closeTaskModal}>
              Cancelar
            </Button>
            <Button
              type="submit"
              loading={createTask.isPending || updateTask.isPending}
              className="flex-1 justify-center"
            >
              {taskModal.task ? 'Salvar' : 'Criar Tarefa'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
