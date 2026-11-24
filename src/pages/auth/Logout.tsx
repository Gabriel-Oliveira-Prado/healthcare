import { useEffect } from 'react'
import AuthLayout from '../../components/AuthLayout'
import { useAuth } from '../../auth/AuthContext'
import { setLoginRedirect } from '../../router'

export default function Logout() {
  const { logout } = useAuth()
  useEffect(() => { logout(); setLoginRedirect(null) }, [logout])
  return <AuthLayout eyebrow="ATÉ LOGO" title="Você saiu da sua conta" description="Sua sessão foi encerrada neste navegador.">
    <a className="btn btn-accent w-100" href="#/login">Voltar para o login</a>
  </AuthLayout>
}
