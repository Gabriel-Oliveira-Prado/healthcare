import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import * as service from "./authService";
import type { User } from "./authService";

type AuthValue = {
  user: User | null;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
  /** Revalida a sessão (por exemplo, se ela expirou) e atualiza o usuário. */
  refresh: () => void;
};

const AuthContext = createContext<AuthValue | null>(null);

const sameUser = (a: User | null, b: User | null) =>
  a?.id === b?.id && a?.name === b?.name && a?.email === b?.email;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(service.getCurrentUser);

  const refresh = useCallback(() => {
    const current = service.getCurrentUser();
    setUser((previous) => (sameUser(previous, current) ? previous : current));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const loggedIn = await service.login(email, password);
    setUser(loggedIn);
    return loggedIn;
  }, []);

  const logout = useCallback(() => {
    service.logout();
    setUser(null);
  }, []);

  // Mantém várias abas sincronizadas: sair em uma aba tira o acesso nas outras.
  useEffect(() => {
    window.addEventListener("storage", refresh);
    return () => window.removeEventListener("storage", refresh);
  }, [refresh]);

  const value = useMemo(
    () => ({ user, login, logout, refresh }),
    [user, login, logout, refresh],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context)
    throw new Error("useAuth deve ser usado dentro de <AuthProvider>.");
  return context;
}
