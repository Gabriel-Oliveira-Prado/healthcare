import { useState, type FormEvent } from 'react'
import AuthLayout from '../../components/AuthLayout'
import FormField from '../../components/FormField'
import PasswordRules from '../../components/PasswordRules'
import * as service from '../../auth/authService'
import { useForm } from '../../auth/useForm'
import { validateEmail, validateName, validatePassword, validatePasswordConfirmation } from '../../auth/validation'

export default function Register() {
  const [formError, setFormError] = useState('')
  const [busy, setBusy] = useState(false)
  const [createdName, setCreatedName] = useState('')
  const form = useForm({
    name: validateName,
    email: validateEmail,
    password: validatePassword,
    confirm: (value: string, values) => validatePasswordConfirmation(values.password, value),
  })

  async function submit(event: FormEvent) {
    event.preventDefault(); setFormError('')
    if (!form.validateAll()) return
    setBusy(true)
    try {
      const user = await service.register({ name: form.values.name, email: form.values.email, password: form.values.password })
      setCreatedName(user.name.split(' ')[0])
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Não foi possível criar a conta.'
      const field = error instanceof service.AuthError ? error.field : undefined
      if (field === 'name' || field === 'email' || field === 'password') form.setServerError(field, message); else setFormError(message)
    } finally { setBusy(false) }
  }

  if (createdName) return <AuthLayout eyebrow="CADASTRO CONCLUÍDO" title="Conta criada!" description="Agora é só entrar com o e-mail e a senha que você cadastrou.">
    <div className="alert alert-success" role="status">Tudo certo, {createdName}. Sua conta foi criada com sucesso.</div>
    <a className="btn btn-accent w-100" href="#/login">Ir para o login</a>
  </AuthLayout>

  return <AuthLayout eyebrow="NOVO CADASTRO" title="Crie sua conta" description="Cadastre-se para acessar o portal Healthcare.">
    <form onSubmit={submit} noValidate>
      <FormField id="register-name" label="Nome completo" type="text" placeholder="Seu nome e sobrenome" autoComplete="name" value={form.values.name} error={form.errorOf('name')} onChange={value => form.change('name', value)} onBlur={() => form.blur('name')} disabled={busy} />
      <FormField id="register-email" label="E-mail" type="email" placeholder="seuemail@exemplo.com" autoComplete="email" value={form.values.email} error={form.errorOf('email')} onChange={value => form.change('email', value)} onBlur={() => form.blur('email')} disabled={busy} />
      <FormField id="register-password" label="Senha" type="password" placeholder="Pelo menos 8 caracteres" autoComplete="new-password" value={form.values.password} error={form.errorOf('password')} onChange={value => form.change('password', value)} onBlur={() => form.blur('password')} disabled={busy} />
      <PasswordRules password={form.values.password} />
      <FormField id="register-confirm" label="Confirmar senha" type="password" placeholder="Repita a senha" autoComplete="new-password" value={form.values.confirm} error={form.errorOf('confirm')} onChange={value => form.change('confirm', value)} onBlur={() => form.blur('confirm')} disabled={busy} />
      {formError && <div className="alert alert-danger py-2" role="alert">{formError}</div>}
      <button className="btn btn-accent w-100 mt-2" type="submit" disabled={busy}>{busy ? 'Criando...' : 'Criar conta'}</button>
    </form>
    <p className="form-bottom">Já tem uma conta? <a href="#/login">Entrar</a></p>
  </AuthLayout>
}
