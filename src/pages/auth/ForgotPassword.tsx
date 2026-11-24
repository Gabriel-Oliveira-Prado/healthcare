import { useState, type FormEvent } from 'react'
import AuthLayout from '../../components/AuthLayout'
import FormField from '../../components/FormField'
import PasswordRules from '../../components/PasswordRules'
import * as service from '../../auth/authService'
import { useForm } from '../../auth/useForm'
import { RECOVERY_CODE_LENGTH, validateEmail, validatePassword, validatePasswordConfirmation, validateRecoveryCode } from '../../auth/validation'

type Step = 'request' | 'reset' | 'done'

export default function ForgotPassword() {
  const [step, setStep] = useState<Step>('request')
  const [email, setEmail] = useState('')
  const [sentCode, setSentCode] = useState<string | null>(null)
  const [formError, setFormError] = useState('')
  const [busy, setBusy] = useState(false)
  const request = useForm({ email: validateEmail })
  const reset = useForm({
    code: validateRecoveryCode,
    password: validatePassword,
    confirm: (value: string, values) => validatePasswordConfirmation(values.password, value),
  })

  async function sendCode(event: FormEvent) {
    event.preventDefault(); setFormError('')
    if (!request.validateAll()) return
    setBusy(true)
    try {
      const result = await service.requestPasswordReset(request.values.email)
      setEmail(request.values.email); setSentCode(result.code); reset.reset(); setStep('reset')
    } catch (error) { setFormError(error instanceof Error ? error.message : 'Não foi possível enviar o código.') }
    finally { setBusy(false) }
  }

  async function changePassword(event: FormEvent) {
    event.preventDefault(); setFormError('')
    if (!reset.validateAll()) return
    setBusy(true)
    try {
      await service.resetPassword({ email, code: reset.values.code, newPassword: reset.values.password })
      setStep('done')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Não foi possível alterar a senha.'
      const field = error instanceof service.AuthError ? error.field : undefined
      if (field === 'code' || field === 'password') reset.setServerError(field, message); else setFormError(message)
    } finally { setBusy(false) }
  }

  const backToLogin = <p className="form-bottom"><a href="#/login">← Voltar para o login</a></p>

  if (step === 'done') return <AuthLayout eyebrow="RECUPERAÇÃO DE ACESSO" title="Senha alterada" description="Você já pode entrar com a nova senha.">
    <div className="alert alert-success" role="status">Sua senha foi alterada com sucesso.</div>
    <a className="btn btn-accent w-100" href="#/login">Ir para o login</a>
  </AuthLayout>

  if (step === 'reset') return <AuthLayout eyebrow="RECUPERAÇÃO DE ACESSO" title="Defina uma nova senha" description={`Digite o código enviado para ${email} e escolha a nova senha.`}>
    <div className="alert alert-info py-2" role="status">Se este e-mail estiver cadastrado, enviamos um código de {RECOVERY_CODE_LENGTH} números. O código vale por 15 minutos.</div>
    {sentCode && <div className="simulated-mail" aria-label="E-mail simulado">
      <span className="simulated-mail-tag">E-MAIL SIMULADO</span>
      <p className="mb-1">Esta versão não envia e-mails de verdade, então o código aparece aqui:</p>
      <strong className="simulated-mail-code user-select-all">{sentCode}</strong>
    </div>}
    <form onSubmit={changePassword} noValidate>
      <FormField id="reset-code" label="Código de recuperação" type="text" placeholder="000000" autoComplete="one-time-code" inputMode="numeric" maxLength={RECOVERY_CODE_LENGTH} value={reset.values.code} error={reset.errorOf('code')} onChange={value => reset.change('code', value.replace(/\D/g, ''))} onBlur={() => reset.blur('code')} disabled={busy} />
      <FormField id="reset-password" label="Nova senha" type="password" placeholder="Pelo menos 8 caracteres" autoComplete="new-password" value={reset.values.password} error={reset.errorOf('password')} onChange={value => reset.change('password', value)} onBlur={() => reset.blur('password')} disabled={busy} />
      <PasswordRules password={reset.values.password} />
      <FormField id="reset-confirm" label="Confirmar nova senha" type="password" placeholder="Repita a nova senha" autoComplete="new-password" value={reset.values.confirm} error={reset.errorOf('confirm')} onChange={value => reset.change('confirm', value)} onBlur={() => reset.blur('confirm')} disabled={busy} />
      {formError && <div className="alert alert-danger py-2" role="alert">{formError}</div>}
      <button className="btn btn-accent w-100 mt-2" type="submit" disabled={busy}>{busy ? 'Alterando...' : 'Alterar senha'}</button>
    </form>
    <p className="form-bottom"><button type="button" className="btn-link-inline" onClick={() => { setStep('request'); setFormError('') }}>Usar outro e-mail ou pedir novo código</button></p>
    {backToLogin}
  </AuthLayout>

  return <AuthLayout eyebrow="RECUPERAÇÃO DE ACESSO" title="Esqueceu sua senha?" description="Informe seu e-mail para receber um código de recuperação.">
    <form onSubmit={sendCode} noValidate>
      <FormField id="recovery-email" label="E-mail cadastrado" type="email" placeholder="seuemail@exemplo.com" autoComplete="email" value={request.values.email} error={request.errorOf('email')} onChange={value => request.change('email', value)} onBlur={() => request.blur('email')} disabled={busy} />
      {formError && <div className="alert alert-danger py-2" role="alert">{formError}</div>}
      <button className="btn btn-accent w-100 mt-2" type="submit" disabled={busy}>{busy ? 'Enviando...' : 'Enviar código'}</button>
    </form>
    {backToLogin}
  </AuthLayout>
}
