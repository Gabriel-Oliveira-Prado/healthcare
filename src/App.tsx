import { AuthProvider } from './auth/AuthContext'
import { PublicOnlyRoute, ProtectedRoute } from './components/RouteGuards'
import Portal from './pages/Portal'
import ForgotPassword from './pages/auth/ForgotPassword'
import Login from './pages/auth/Login'
import Logout from './pages/auth/Logout'
import Register from './pages/auth/Register'
import { isPrivateRoute, useHashRoute } from './router'

function Routes() {
  const route = useHashRoute()
  if (route === 'logout') return <Logout />
  if (isPrivateRoute(route)) return <ProtectedRoute route={route}><Portal page={route} /></ProtectedRoute>
  return <PublicOnlyRoute>{route === 'register' ? <Register /> : route === 'forgot' ? <ForgotPassword /> : <Login />}</PublicOnlyRoute>
}

export default function App() {
  return <AuthProvider><Routes /></AuthProvider>
}
