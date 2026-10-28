import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import Brand from './components/Brand'
import Portal, { type PortalSection } from './pages/Portal'

type User = { id: string, name: string, email: string }
type Page = 'login' | 'forgot' | 'register' | 'logout' | PortalSection
const pages: Page[] = ['login', 'forgot', 'register', 'logout', 'inicio', 'agendamentos', 'campanhas', 'unidades', 'orientacoes']
const privatePages: Page[] = ['inicio', 'agendamentos', 'campanhas', 'unidades', 'orientacoes']

function currentPage(): Page {
  const page = window.location.hash.replace('#/', '')
  if (page === 'dashboard' || page === 'crm' || page === 'portal') return 'inicio'
  return pages.includes(page as Page) ? page as Page : 'login'
}

async function api<T>(path: string, body?: object): Promise<T> {
  const response = await fetch(path, { method: body ? 'POST' : 'GET', credentials: 'same-origin', headers: body ? { 'Content-Type': 'application/json' } : undefined, body: body ? JSON.stringify(body) : undefined })
  const data = await response.json()
  if (!response.ok) throw new Error(data.error || 'Não foi possível concluir a solicitação.')
  return data as T
}

function errorText(error: unknown) { return error instanceof Error ? error.message : 'Não foi possível conectar ao servidor.' }

function AuthLayout({ eyebrow, title, description, children }: { eyebrow: string, title: string, description: string, children: ReactNode }) {
  return <div className="container-fluid p-0"><div className="row g-0 min-vh-100">
    <aside className="auth-aside col-lg-5 d-none d-lg-block"><img src="/images/healthcare-login-illustration.png" alt="Médica conversando com paciente em um consultório" /></aside>
    <main className="auth-main col-lg-7 d-flex flex-column">
      <div className="d-lg-none mobile-brand"><Brand /></div>
      <div className="auth-content d-flex align-items-center flex-grow-1"><div className="auth-form-wrap">
        <p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p className="page-description">{description}</p>{children}
      </div></div>
      <footer className="auth-footer">© 2026 Healthcare.</footer>
    </main>
  </div></div>
}

function Field({ id, name, label, type, placeholder, autocomplete, minLength }: { id: string, name: string, label: string, type: string, placeholder: string, autocomplete: string, minLength?: number }) {
  return <div className="mb-3"><label className="form-label" htmlFor={id}>{label}</label><input className="form-control" id={id} name={name} type={type} placeholder={placeholder} autoComplete={autocomplete} minLength={minLength} required /></div>
}

function Alert({ error }: { error: string }) { return error ? <div className="alert alert-danger py-2" role="alert">{error}</div> : null }

function RecoveryCode({ code }: { code: string }) {
  return <div className="alert alert-success" role="status"><strong>Guarde seu código de recuperação.</strong><p className="mb-2 mt-2">Você precisará dele caso esqueça a senha. Ele aparece somente agora:</p><code className="d-block bg-white p-2 rounded user-select-all text-break">{code}</code><p className="mb-0 mt-2 small">Salve em um lugar seguro. Um novo código será gerado quando você recuperar o acesso.</p></div>
}

function Login({ onLogin }: { onLogin: (user: User) => void }) {
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setBusy(true)
    const form = new FormData(event.currentTarget)
    try {
      const result = await api<{ user: User }>('/api/login', { email: form.get('email'), password: form.get('password') })
      onLogin(result.user); window.location.hash = '/inicio'
    } catch (error) { setError(errorText(error)) } finally { setBusy(false) }
  }
  return <AuthLayout eyebrow="LOGIN · ÁREA RESTRITA" title="Boas-vindas de volta" description="Acesse seu espaço de cuidado e informação.">
    <form onSubmit={submit}>
      <Field id="login-email" name="email" label="E-mail" type="email" placeholder="seuemail@exemplo.com" autocomplete="email" />
      <Field id="login-password" name="password" label="Senha" type="password" placeholder="Digite sua senha" autocomplete="current-password" />
      <div className="text-end mb-4"><a className="text-link" href="#/forgot">Esqueci minha senha</a></div>
      <Alert error={error} /><button className="btn btn-accent w-100" type="submit" disabled={busy}>{busy ? 'Entrando...' : 'Entrar'}</button>
    </form>
    <p className="form-bottom">Ainda não tem uma conta? <a href="#/register">Cadastre-se</a></p>
  </AuthLayout>
}

function ForgotPassword({ onRecovered }: { onRecovered: () => void }) {
  const [error, setError] = useState('')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setBusy(true)
    const form = new FormData(event.currentTarget)
    try {
      const result = await api<{ recoveryCode: string }>('/api/recover', { email: form.get('email'), recoveryCode: form.get('recoveryCode'), newPassword: form.get('newPassword') })
      onRecovered()
      setCode(result.recoveryCode)
    } catch (error) { setError(errorText(error)) } finally { setBusy(false) }
  }
  return <AuthLayout eyebrow="RECUPERAÇÃO DE ACESSO" title="Esqueceu sua senha?" description="Use o código recebido no cadastro para definir uma nova senha.">
    {code ? <><RecoveryCode code={code} /><a className="btn btn-accent w-100" href="#/login">Ir para o login</a></> : <form onSubmit={submit}>
      <Field id="recovery-email" name="email" label="E-mail cadastrado" type="email" placeholder="seuemail@exemplo.com" autocomplete="email" />
      <Field id="recovery-code" name="recoveryCode" label="Código de recuperação" type="text" placeholder="Código salvo no cadastro" autocomplete="off" />
      <Field id="recovery-password" name="newPassword" label="Nova senha" type="password" placeholder="Pelo menos 8 caracteres" autocomplete="new-password" minLength={8} />
      <Alert error={error} /><button className="btn btn-accent w-100 mt-2" type="submit" disabled={busy}>{busy ? 'Alterando...' : 'Alterar senha'}</button>
    </form>}
    <p className="form-bottom"><a href="#/login">← Voltar para o login</a></p>
  </AuthLayout>
}

function Register() {
  const [error, setError] = useState('')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setBusy(true)
    const form = new FormData(event.currentTarget)
    try {
      const result = await api<{ recoveryCode: string }>('/api/register', { name: form.get('name'), email: form.get('email'), password: form.get('password') })
      setCode(result.recoveryCode)
    } catch (error) { setError(errorText(error)) } finally { setBusy(false) }
  }
  return <AuthLayout eyebrow="NOVO CADASTRO" title="Crie sua conta" description="Cadastre-se para acessar o portal Healthcare.">
    {code ? <><RecoveryCode code={code} /><a className="btn btn-accent w-100" href="#/login">Ir para o login</a></> : <form onSubmit={submit}>
      <Field id="register-name" name="name" label="Nome completo" type="text" placeholder="Seu nome" autocomplete="name" minLength={2} />
      <Field id="register-email" name="email" label="E-mail" type="email" placeholder="seuemail@exemplo.com" autocomplete="email" />
      <Field id="register-password" name="password" label="Senha" type="password" placeholder="Pelo menos 8 caracteres" autocomplete="new-password" minLength={8} />
      <Alert error={error} /><button className="btn btn-accent w-100 mt-2" type="submit" disabled={busy}>{busy ? 'Criando...' : 'Criar conta'}</button>
    </form>}
    <p className="form-bottom">Já tem uma conta? <a href="#/login">Entrar</a></p>
  </AuthLayout>
}

function Logout({ status, retry }: { status: 'pending' | 'done' | 'error', retry: () => void }) {
  return <AuthLayout eyebrow="ATÉ LOGO" title={status === 'done' ? 'Você saiu da sua conta' : 'Encerrando sua sessão'} description={status === 'done' ? 'Sua sessão foi encerrada.' : 'Aguarde um instante.'}>
    {status === 'done' && <a className="btn btn-accent w-100" href="#/login">Voltar para o login</a>}
    {status === 'pending' && <div className="text-center">Saindo...</div>}
    {status === 'error' && <><div className="alert alert-danger" role="alert">Não foi possível encerrar a sessão. Tente novamente.</div><button className="btn btn-accent w-100" onClick={retry}>Tentar novamente</button></>}
  </AuthLayout>
}

function App() {
  const [page, setPage] = useState<Page>(currentPage)
  const [user, setUser] = useState<User | null>(null)
  const [checking, setChecking] = useState(true)
  const [logoutStatus, setLogoutStatus] = useState<'pending' | 'done' | 'error'>('pending')
  function logout() {
    setUser(null)
    setLogoutStatus('pending')
    api('/api/logout', {}).then(() => setLogoutStatus('done')).catch(() => setLogoutStatus('error'))
  }
  useEffect(() => { const update = () => { setChecking(true); setPage(currentPage()) }; window.addEventListener('hashchange', update); return () => window.removeEventListener('hashchange', update) }, [])
  useEffect(() => {
    if (page === 'logout') return
    let cancelled = false
    api<{ user: User }>('/api/me').then(result => { if (!cancelled) setUser(result.user) }).catch(() => { if (!cancelled) setUser(null) }).finally(() => { if (!cancelled) setChecking(false) })
    return () => { cancelled = true }
  }, [page])
  useEffect(() => {
    if (page !== 'logout') return
    logout()
  }, [page])
  useEffect(() => { if (!checking && !user && privatePages.includes(page)) window.location.hash = '/login' }, [checking, user, page])

  if (page === 'logout') return <Logout status={logoutStatus} retry={logout} />
  if (privatePages.includes(page)) {
    if (checking || !user) return <div className="d-flex min-vh-100 align-items-center justify-content-center">Carregando...</div>
    return <Portal page={page as PortalSection} />
  }
  if (page === 'forgot') return <ForgotPassword onRecovered={() => setUser(null)} />
  if (page === 'register') return <Register />
  return <Login onLogin={setUser} />
}

export default App
