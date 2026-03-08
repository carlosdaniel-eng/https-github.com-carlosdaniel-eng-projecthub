import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Mock useAuth
const mockLogin = vi.fn()
const mockUser = null
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ user: mockUser, login: mockLogin, loading: false }),
}))

// Mock navigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

import Login from '@/pages/Login'

const renderLogin = () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('Login page', () => {
  beforeEach(() => {
    mockLogin.mockReset()
    mockNavigate.mockReset()
  })

  it('renders login form elements', () => {
    renderLogin()
    expect(screen.getByText('Entrar no ProjectHub')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('seu@email.com')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument()
  })

  it('renders link to register page', () => {
    renderLogin()
    expect(screen.getByText('Criar conta')).toBeInTheDocument()
  })

  it('calls login and navigates on success', async () => {
    mockLogin.mockResolvedValueOnce({})
    const user = userEvent.setup()
    renderLogin()

    await user.type(screen.getByPlaceholderText('seu@email.com'), 'carlos@test.com')
    await user.type(screen.getByPlaceholderText('••••••••'), 'senha1234')
    await user.click(screen.getByRole('button', { name: /entrar/i }))

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('carlos@test.com', 'senha1234')
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
    })
  })

  it('shows error message on failed login', async () => {
    mockLogin.mockRejectedValueOnce({
      response: { data: { detail: 'Credenciais inválidas.' } },
    })
    const user = userEvent.setup()
    renderLogin()

    await user.type(screen.getByPlaceholderText('seu@email.com'), 'wrong@test.com')
    await user.type(screen.getByPlaceholderText('••••••••'), 'wrongpass')
    await user.click(screen.getByRole('button', { name: /entrar/i }))

    await waitFor(() => {
      expect(screen.getByText('Credenciais inválidas.')).toBeInTheDocument()
    })
  })

  it('disables button while loading', async () => {
    mockLogin.mockImplementation(() => new Promise(() => {})) // never resolves
    const user = userEvent.setup()
    renderLogin()

    await user.type(screen.getByPlaceholderText('seu@email.com'), 'carlos@test.com')
    await user.type(screen.getByPlaceholderText('••••••••'), 'senha1234')
    await user.click(screen.getByRole('button', { name: /entrar/i }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '' })).toBeDisabled()
    })
  })
})
