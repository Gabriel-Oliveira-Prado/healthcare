import { describe, expect, it } from 'vitest'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'
import { setLoginRedirect } from './router'

const go = (hash: string) => act(() => { window.location.hash = hash })
const hashIs = (value: string) => waitFor(() => expect(window.location.hash).toBe(value))

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
    const user = userEvent.setup()
    render(<App />)
    await register(user)
    await go('#/campanhas')
    await hashIs('#/login')
    await screen.findByText('Faça login para acessar essa página.')
    await login(user)
    await hashIs('#/campanhas')
    expect(await screen.findByText('Olá, Maria')).toBeTruthy()
  })

  it('cadastro mostra erros de validação e não cria a conta', async () => {
    const user = userEvent.setup()
    render(<App />)
    await go('#/register')
    await user.type(await screen.findByLabelText('Nome completo'), 'Maria')
    await user.type(screen.getByLabelText('E-mail'), 'invalido')
    await user.type(screen.getByLabelText('Senha'), 'abc')
    await user.type(screen.getByLabelText('Confirmar senha'), 'xyz')
    await user.click(screen.getByRole('button', { name: 'Criar conta' }))
    expect(await screen.findByText('Informe nome e sobrenome.')).toBeTruthy()
    expect(screen.getByText(/e-mail válido/)).toBeTruthy()
    expect(screen.getByText('As senhas não são iguais.')).toBeTruthy()
    expect(localStorage.getItem('healthcare.users')).toBeNull()
  })

  it('login com senha errada mostra erro e continua fora do portal', async () => {
    const user = userEvent.setup()
    render(<App />)
    await register(user)
    await login(user, 'maria@exemplo.com', 'errada123')
    expect(await screen.findByText('E-mail ou senha inválidos.')).toBeTruthy()
    expect(window.location.hash).toBe('#/login')
  })

  it('login, navegação no portal, logout e bloqueio depois de sair', async () => {
    const user = userEvent.setup()
    render(<App />)
    await register(user)
    await login(user)
    await hashIs('#/inicio')
    await screen.findByText('O que você precisa hoje?')
    await go('#/logout')
    await screen.findByText('Você saiu da sua conta')
    expect(localStorage.getItem('healthcare.session')).toBeNull()
    setLoginRedirect(null)
    await go('#/agendamentos')
    await hashIs('#/login')
    await screen.findByRole('button', { name: 'Entrar' })
  })

  it('quem já está logado não vê o login e é levado ao portal', async () => {
    const user = userEvent.setup()
    render(<App />)
    await register(user)
    await login(user)
    await hashIs('#/inicio')
    await go('#/login')
    await hashIs('#/inicio')
  })

  it('recuperação de senha simulada troca a senha', async () => {
    const user = userEvent.setup()
    render(<App />)
    await register(user)
    await go('#/forgot')
    await user.type(await screen.findByLabelText('E-mail cadastrado'), 'maria@exemplo.com')
    await user.click(screen.getByRole('button', { name: 'Enviar código' }))
    const code = (await screen.findByLabelText('E-mail simulado')).querySelector('strong')!.textContent!
    await user.type(screen.getByLabelText('Código de recuperação'), code)
    await user.type(screen.getByLabelText('Nova senha'), 'novasenha9')
    await user.type(screen.getByLabelText('Confirmar nova senha'), 'novasenha9')
    await user.click(screen.getByRole('button', { name: 'Alterar senha' }))
    await screen.findByText('Sua senha foi alterada com sucesso.')
    await login(user, 'maria@exemplo.com', 'novasenha9')
    await hashIs('#/inicio')
  })
})
