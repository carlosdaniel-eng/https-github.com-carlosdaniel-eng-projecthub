import { useState } from 'react'
import { Link, useNavigate, Navigate } from 'react-router-dom'
import { Hexagon, ArrowRight } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { getErrorMessage } from '@/api/client'
import { Button, Input, Alert } from '@/components/ui'

export default function Register() {
  const { user, register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (user) return <Navigate to="/dashboard" replace />

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres.')
      return
    }
    setError('')
    setLoading(true)
    try {
      await register(form.name, form.email, form.password)
      navigate('/dashboard')
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen page-bg flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm animate-slide-up">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-brand flex items-center justify-center shadow-glow mb-4">
            <Hexagon size={22} className="text-white" fill="currentColor" />
          </div>
          <h1 className="text-xl font-semibold text-text-primary">Criar conta</h1>
          <p className="text-sm text-text-muted mt-1">Comece a gerenciar seus projetos</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Alert type="error" message={error} />
            <Input
              label="Nome"
              type="text"
              placeholder="Seu nome completo"
              value={form.name}
              onChange={set('name')}
              required
              autoFocus
            />
            <Input
              label="E-mail"
              type="email"
              placeholder="seu@email.com"
              value={form.email}
              onChange={set('email')}
              required
            />
            <Input
              label="Senha"
              type="password"
              placeholder="Mínimo 8 caracteres"
              value={form.password}
              onChange={set('password')}
              required
            />
            <Button type="submit" loading={loading} className="mt-1 w-full justify-center">
              Criar conta <ArrowRight size={14} />
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-text-muted mt-5">
          Já tem conta?{' '}
          <Link to="/login" className="text-brand hover:text-brand-hover font-medium transition-colors">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  )
}
