import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'
import { setLoginRedirect } from './router'

const go = (hash: string) => act(() => { window.location.hash = hash })
const hashIs = (value: string) => waitFor(() => expect(window.location.hash).toBe(value))

beforeEach(() => {
  window.location.hash = '#/login'
  localStorage.clear()
  let users: Array<{ id: string; name: string; email: string; password: string }> = []
  let session: { id: string; name: string; email: string } | null = null
  let recovery: { email: string; code: string } | null = null
  vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const path = String(input)
    const body = init?.body ? JSON.parse(String(init.body)) : {}
    let status = 200, data: Record<string, unknown> = {}
    if (path === '/api/me') {
      if (session) data = { user: session }
      else { status = 401; data = { error: 'Não autenticado' } }
    } else if (path === '/api/register') {
      if (users.some(user => user.email === body.email)) { status = 409; data = { error: 'Este e-mail já está cadastrado.' } }
      else {
        const user = { id: String(users.length + 1), name: body.name, email: body.email, password: body.password }
        users.push(user); data = { user: { id: user.id, name: user.name, email: user.email } }; status = 201
      }
    } else if (path === '/api/login') {
      const user = users.find(item => item.email === body.email && item.password === body.password)
      if (!user) { status = 401; data = { error: 'E-mail ou senha inválidos.' } }
      else { session = { id: user.id, name: user.name, email: user.email }; data = { user: session } }
    } else if (path === '/api/logout') {
      session = null; data = { ok: true }
    } else if (path === '/api/forgot-password') {
      recovery = users.some(user => user.email === body.email) ? { email: body.email, code: '123456' } : null
      data = { ok: true }
    } else if (path === '/api/reset-password') {
      if (!recovery || recovery.email !== body.email || recovery.code !== body.code) {
        status = 400; data = { error: 'Código incorreto ou expirado.' }
      } else {
        const user = users.find(item => item.email === body.email)!
        user.password = body.newPassword; recovery = null; session = null; data = { ok: true }
      }
    } else { status = 404; data = { error: 'Não encontrado' } }
    return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } })
  }))
})

async function register(user: ReturnType<typeof userEvent.setup>, email = 'maria@exemplo.com', password = 'senha1234') {
  await go('#/register')
  await user.type(await screen.findByLabelText('Nome completo'), 'Maria Silva')
  await user.type(screen.getByLabelText('E-mail'), email)
  await user.type(screen.getByLabelText('Senha'), password)
  await user.type(screen.getByLabelText('Confirmar senha'), password)
  await user.click(screen.getByRole('button', { name: 'Criar conta' }))
  await screen.findByText('Conta criada!')
}
async function login(user: ReturnType<typeof userEvent.setup>, email = 'maria@exemplo.com', password = 'senha1234') {
  await go('#/login')
  await user.type(await screen.findByLabelText('E-mail'), email)
  await user.type(screen.getByLabelText('Senha'), password)
  await user.click(screen.getByRole('button', { name: 'Entrar' }))
}

describe('fluxo de acesso', () => {
  it('rota protegida sem sessão leva ao login, avisa e volta para a página depois do login', async () => {
    const user = userEvent.setup(); render(<App />); await register(user)
    await go('#/campanhas'); await hashIs('#/login')
    await screen.findByText('Faça login para acessar essa página.')
    await login(user); await hashIs('#/campanhas')
    expect(await screen.findByText('Olá, Maria')).toBeTruthy()
  })
  it('cadastro mostra erros de validação e não cria a conta', async () => {
    const user = userEvent.setup(); render(<App />); await go('#/register')
    await user.type(await screen.findByLabelText('Nome completo'), 'Maria')
    await user.type(screen.getByLabelText('E-mail'), 'invalido')
    await user.type(screen.getByLabelText('Senha'), 'abc')
    await user.type(screen.getByLabelText('Confirmar senha'), 'xyz')
    await user.click(screen.getByRole('button', { name: 'Criar conta' }))
    expect(await screen.findByText('Informe nome e sobrenome.')).toBeTruthy()
    expect(screen.getByText(/e-mail válido/)).toBeTruthy()
    expect(screen.getByText('As senhas não são iguais.')).toBeTruthy()
    expect(fetch).not.toHaveBeenCalledWith('/api/register', expect.anything())
  })
  it('login com senha errada mostra erro e continua fora do portal', async () => {
    const user = userEvent.setup(); render(<App />); await register(user)
    await login(user, 'maria@exemplo.com', 'errada123')
    expect(await screen.findByText('E-mail ou senha inválidos.')).toBeTruthy()
    expect(window.location.hash).toBe('#/login')
  })
  it('login, navegação no portal, logout e bloqueio depois de sair', async () => {
    const user = userEvent.setup(); render(<App />); await register(user); await login(user)
    await hashIs('#/inicio'); await screen.findByText('O que você precisa hoje?')
    await go('#/logout'); await screen.findByText('Você saiu da sua conta')
    setLoginRedirect(null); await go('#/agendamentos'); await hashIs('#/login')
    await screen.findByRole('button', { name: 'Entrar' })
  })
  it('quem já está logado não vê o login e é levado ao portal', async () => {
    const user = userEvent.setup(); render(<App />); await register(user); await login(user)
    await hashIs('#/inicio'); await go('#/login'); await hashIs('#/inicio')
  })
  it('recuperação de senha troca a senha usando o código recebido por e-mail', async () => {
    const user = userEvent.setup(); render(<App />); await register(user); await go('#/forgot')
    await user.type(await screen.findByLabelText('E-mail cadastrado'), 'maria@exemplo.com')
    await user.click(screen.getByRole('button', { name: 'Enviar código' }))
    await screen.findByText(/enviamos um código/)
    await user.type(screen.getByLabelText('Código de recuperação'), '123456')
    await user.type(screen.getByLabelText('Nova senha'), 'novasenha9')
    await user.type(screen.getByLabelText('Confirmar nova senha'), 'novasenha9')
    await user.click(screen.getByRole('button', { name: 'Alterar senha' }))
    await screen.findByText('Sua senha foi alterada com sucesso.')
    await login(user, 'maria@exemplo.com', 'novasenha9'); await hashIs('#/inicio')
  })
})
