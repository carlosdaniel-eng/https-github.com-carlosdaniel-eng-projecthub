import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft, Plus, GitCommit, Users, Settings, Trash2,
  ChevronDown, GripVertical, Check, Clock, Circle, MoreHorizontal
} from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { projectsApi } from '@/api/projects'
import { tasksApi } from '@/api/tasks'
import { getErrorMessage } from '@/api/client'
import { useAuth } from '@/context/AuthContext'
import { Button, Input, Textarea, Select, Modal, Badge, Alert, Empty, Spinner } from '@/components/ui'
import { clsx } from 'clsx'

const STATUS_COLS = [
  { key: 'todo', label: 'A Fazer', icon: Circle, color: 'text-slate-400' },
  { key: 'in_progress', label: 'Em Progresso', icon: Clock, color: 'text-amber-400' },
  { key: 'done', label: 'Concluído', icon: Check, color: 'text-green-400' },
]

const PRIORITY_DOT = { low: 'bg-green-400', medium: 'bg-amber-400', high: 'bg-red-400' }

function TaskCard({ task, onEdit, onDelete }) {
  return (
    <div className="bg-surface-3 border border-border hover:border-border-strong rounded-xl p-3.5 group transition-all duration-150 cursor-pointer animate-fade-in"
      onClick={() => onEdit(task)}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-sm font-medium text-text-primary leading-snug line-clamp-2">{task.title}</p>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(task.id) }}
          className="btn-icon w-6 h-6 opacity-0 group-hover:opacity-100 shrink-0 text-text-muted hover:text-red-400"
        >
          <Trash2 size={11} />
        </button>
      </div>
      {task.description && (
        <p className="text-xs text-text-muted mb-2 line-clamp-2">{task.description}</p>
      )}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={clsx('w-1.5 h-1.5 rounded-full', PRIORITY_DOT[task.priority])} title={task.priority} />
          <Badge type={task.priority} />
        </div>
        {task.due_date && (
          <span className="text-xs text-text-muted">
            {format(new Date(task.due_date + 'T00:00:00'), 'dd MMM', { locale: ptBR })}
          </span>
        )}
      </div>
      {task.assignee && (
        <div className="mt-2 pt-2 border-t border-border flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-brand/20 border border-brand/30 flex items-center justify-center text-[9px] text-brand font-bold">
            {task.assignee.name[0].toUpperCase()}
          </div>
          <span className="text-xs text-text-muted truncate">{task.assignee.name}</span>
        </div>
      )}
    </div>
  )
}

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
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tasks', id] }); closeTaskModal() },
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
      assignee_id: task.assignee?.id || '',
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
        <p className="text-text-muted">Projeto não encontrado.</p>
        <Button variant="ghost" onClick={() => navigate('/projects')} className="mt-4">
          <ArrowLeft size={14} /> Voltar
        </Button>
      </div>
    )
  }

  const tasksByStatus = (status) => (tasks || []).filter((t) => t.status === status)
  const isOwner = project.owner_id === user?.id || user?.role === 'admin'

  const memberOptions = [
    { value: '', label: 'Sem responsável' },
    ...(project.members || []).map((m) => ({ value: String(m.user.id), label: m.user.name })),
  ]

  const TABS = [
    { key: 'board', label: 'Board' },
    { key: 'members', label: `Membros (${project.members?.length ?? 0})` },
    ...(project.github_repo ? [{ key: 'github', label: 'GitHub' }] : []),
    { key: 'activity', label: 'Atividade' },
  ]

  return (
    <div className="flex flex-col min-h-screen">
      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-surface-1/80 backdrop-blur-md border-b border-border px-8 py-4">
        <div className="flex items-center gap-4">
          <Link to="/projects" className="btn-icon">
            <ArrowLeft size={16} />
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5">
              <h1 className="text-lg font-semibold text-text-primary truncate">{project.title}</h1>
              <Badge type={project.status} />
            </div>
            {project.description && (
              <p className="text-xs text-text-muted truncate mt-0.5">{project.description}</p>
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
                  : 'border-transparent text-text-muted hover:text-text-secondary'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-8 pt-6">

        {/* ── Board ────────────────────────────────── */}
        {activeTab === 'board' && (
          <div className="grid grid-cols-3 gap-4 min-h-[60vh]">
            {STATUS_COLS.map(({ key, label, icon: Icon, color }) => {
              const colTasks = tasksByStatus(key)
              return (
                <div key={key} className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon size={14} className={color} />
                      <span className="text-sm font-medium text-text-secondary">{label}</span>
                      <span className="text-xs text-text-muted bg-surface-3 rounded-full px-1.5 py-0.5">
                        {colTasks.length}
                      </span>
                    </div>
                    <button onClick={() => openCreateTask(key)} className="btn-icon w-6 h-6 text-text-muted hover:text-brand">
                      <Plus size={13} />
                    </button>
                  </div>
                  <div className="flex flex-col gap-2 min-h-[8rem]">
                    {loadingTasks ? (
                      <div className="flex justify-center py-8"><Spinner size={16} className="text-brand" /></div>
                    ) : colTasks.length === 0 ? (
                      <button
                        onClick={() => openCreateTask(key)}
                        className="border border-dashed border-border rounded-xl p-4 text-center text-xs text-text-muted hover:text-text-secondary hover:border-border-strong transition-all"
                      >
                        + Adicionar tarefa
                      </button>
                    ) : (
                      colTasks.map((t) => (
                        <TaskCard key={t.id} task={t} onEdit={openEditTask} onDelete={(id) => deleteTask.mutate(id)} />
                      ))
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ── Members ──────────────────────────────── */}
        {activeTab === 'members' && (
          <div className="max-w-lg">
            <div className="flex flex-col gap-2">
              {project.members?.map((m) => (
                <div key={m.id} className="card flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-brand/15 border border-brand/20 flex items-center justify-center font-semibold text-brand">
                    {m.user.name[0].toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-text-primary">{m.user.name}</p>
                    <p className="text-xs text-text-muted">{m.user.email}</p>
                  </div>
                  <Badge type={m.role_in_project} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── GitHub ───────────────────────────────── */}
        {activeTab === 'github' && (
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-4 text-sm text-text-muted">
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
                  <a
                    key={c.sha}
                    href={c.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-start gap-3 py-3 border-b border-border last:border-0 hover:bg-surface-3/50 px-2 rounded-lg transition-colors"
                  >
                    <span className="font-mono text-xs text-brand bg-brand/10 border border-brand/20 px-1.5 py-0.5 rounded mt-0.5 shrink-0">
                      {c.sha}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-text-primary truncate">{c.message}</p>
                      <p className="text-xs text-text-muted mt-0.5">{c.author} — {format(new Date(c.date), "dd MMM yyyy 'às' HH:mm", { locale: ptBR })}</p>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Activity ─────────────────────────────── */}
        {activeTab === 'activity' && (
          <div className="max-w-lg">
            {!activity?.length ? (
              <Empty icon={Clock} title="Sem atividade" description="Ações no projeto aparecerão aqui." />
            ) : (
              <div className="flex flex-col gap-0">
                {activity?.map((log) => (
                  <div key={log.id} className="flex items-start gap-3 py-3 border-b border-border last:border-0">
                    <div className="w-2 h-2 rounded-full bg-brand mt-1.5 shrink-0" />
                    <div>
                      <p className="text-sm text-text-secondary">
                        <span className="capitalize font-medium text-text-primary">{log.action}</span>
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
        )}
      </div>

      {/* Task Modal */}
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
                { value: 'todo', label: 'A Fazer' },
                { value: 'in_progress', label: 'Em Progresso' },
                { value: 'done', label: 'Concluído' },
              ]}
            />
            <Select
              label="Prioridade"
              value={taskForm.priority}
              onChange={(e) => setTaskForm((f) => ({ ...f, priority: e.target.value }))}
              options={[
                { value: 'low', label: 'Baixa' },
                { value: 'medium', label: 'Média' },
                { value: 'high', label: 'Alta' },
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
