import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { Badge, Alert, Button, Input } from '@/components/ui'

// ── Badge ─────────────────────────────────────────────────────────────────────
describe('Badge component', () => {
  it('renders todo status badge', () => {
    render(<Badge type="todo" />)
    expect(screen.getByText('A Fazer')).toBeInTheDocument()
  })

  it('renders in_progress status badge', () => {
    render(<Badge type="in_progress" />)
    expect(screen.getByText('Em Progresso')).toBeInTheDocument()
  })

  it('renders done status badge', () => {
    render(<Badge type="done" />)
    expect(screen.getByText('Concluído')).toBeInTheDocument()
  })

  it('renders priority badges', () => {
    const { rerender } = render(<Badge type="low" />)
    expect(screen.getByText('Baixa')).toBeInTheDocument()

    rerender(<Badge type="high" />)
    expect(screen.getByText('Alta')).toBeInTheDocument()
  })

  it('renders custom label', () => {
    render(<Badge type="todo" label="Custom" />)
    expect(screen.getByText('Custom')).toBeInTheDocument()
  })
})

// ── Alert ─────────────────────────────────────────────────────────────────────
describe('Alert component', () => {
  it('renders error message', () => {
    render(<Alert type="error" message="Erro de teste" />)
    expect(screen.getByText('Erro de teste')).toBeInTheDocument()
  })

  it('renders nothing when no message', () => {
    const { container } = render(<Alert type="error" message="" />)
    expect(container.firstChild).toBeNull()
  })

  it('renders success message', () => {
    render(<Alert type="success" message="Sucesso!" />)
    expect(screen.getByText('Sucesso!')).toBeInTheDocument()
  })
})

// ── Button ────────────────────────────────────────────────────────────────────
describe('Button component', () => {
  it('renders with text', () => {
    render(<Button>Salvar</Button>)
    expect(screen.getByText('Salvar')).toBeInTheDocument()
  })

  it('is disabled when loading', () => {
    render(<Button loading>Salvar</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('calls onClick handler', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Clique</Button>)
    await user.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('does not call onClick when disabled', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(<Button disabled onClick={onClick}>Clique</Button>)
    await user.click(screen.getByRole('button'))
    expect(onClick).not.toHaveBeenCalled()
  })
})

// ── Input ─────────────────────────────────────────────────────────────────────
describe('Input component', () => {
  it('renders with label', () => {
    render(<Input label="E-mail" />)
    expect(screen.getByText('E-mail')).toBeInTheDocument()
  })

  it('renders error message', () => {
    render(<Input error="Campo obrigatório" />)
    expect(screen.getByText('Campo obrigatório')).toBeInTheDocument()
  })

  it('calls onChange handler', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Input onChange={onChange} />)
    await user.type(screen.getByRole('textbox'), 'teste')
    expect(onChange).toHaveBeenCalled()
  })

  it('accepts placeholder', () => {
    render(<Input placeholder="Digite aqui..." />)
    expect(screen.getByPlaceholderText('Digite aqui...')).toBeInTheDocument()
  })
})
