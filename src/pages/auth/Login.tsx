import { useState, type FormEvent } from 'react'
import AuthLayout from '../../components/AuthLayout'
import FormField from '../../components/FormField'
import { useAuth } from '../../auth/AuthContext'
import { useForm } from '../../auth/useForm'
import { validateEmail } from '../../auth/validation'
import { getLoginRedirect } from '../../router'

export default function Login() {
  const { login } = useAuth()
  const [formError, setFormError] = useState('')
  const [busy, setBusy] = useState(false)
  const [needsLogin] = useState(() => getLoginRedirect() !== null)
  const form = useForm({ email: validateEmail, password: (value: string) => value ? '' : 'Informe sua senha.' })

  async function submit(event: FormEvent) {
    event.preventDefault(); setFormError('')
    if (!form.validateAll()) return
    setBusy(true)
    try { await login(form.values.email, form.values.password) } // o redirecionamento acontece em PublicOnlyRoute
    catch (error) { setFormError(error instanceof Error ? error.message : 'Não foi possível entrar.'); setBusy(false) }
  }

  return <AuthLayout eyebrow="LOGIN · ÁREA RESTRITA" title="Boas-vindas de volta" description="Acesse seu espaço de cuidado e informação.">
    {needsLogin && <div className="alert alert-info py-2" role="status">Faça login para acessar essa página.</div>}
    <form onSubmit={submit} noValidate>
      <FormField id="login-email" label="E-mail" type="email" placeholder="seuemail@exemplo.com" autoComplete="email" value={form.values.email} error={form.errorOf('email')} onChange={value => form.change('email', value)} onBlur={() => form.blur('email')} disabled={busy} />
      <FormField id="login-password" label="Senha" type="password" placeholder="Digite sua senha" autoComplete="current-password" value={form.values.password} error={form.errorOf('password')} onChange={value => form.change('password', value)} onBlur={() => form.blur('password')} disabled={busy} />
      <div className="text-end mb-4"><a className="text-link" href="#/forgot">Esqueci minha senha</a></div>
      {formError && <div className="alert alert-danger py-2" role="alert">{formError}</div>}
      <button className="btn btn-accent w-100" type="submit" disabled={busy}>{busy ? 'Entrando...' : 'Entrar'}</button>
    </form>
    <p className="form-bottom">Ainda não tem uma conta? <a href="#/register">Cadastre-se</a></p>
  </AuthLayout>
}
