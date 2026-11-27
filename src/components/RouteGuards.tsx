import { useEffect, type ReactNode } from 'react'
import { useAuth } from '../auth/AuthContext'
import { navigate, setLoginRedirect, takeLoginRedirect, type Route } from '../router'
import type { PortalSection } from '../pages/Portal'
export function ProtectedRoute({ route, children }: { route: PortalSection; children: ReactNode }) {
 const { user, loading, refresh } = useAuth()
 useEffect(() => { if (!loading) refresh() }, [route, refresh])
 useEffect(() => { if (loading || user) return; setLoginRedirect(route); navigate('login', { replace: true }) }, [loading, user, route])
 return loading || !user ? null : <>{children}</>
}
export function PublicOnlyRoute({ children }: { children: ReactNode }) {
 const { user, loading } = useAuth()
 useEffect(() => { if (user) navigate((takeLoginRedirect() ?? 'inicio') as Route, { replace: true }) }, [user])
 return loading || user ? null : <>{children}</>
}
