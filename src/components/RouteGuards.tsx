import { useEffect, type ReactNode } from "react";
import { useAuth } from "../auth/AuthContext";
import {
  navigate,
  setLoginRedirect,
  takeLoginRedirect,
  type Route,
} from "../router";
import type { PortalSection } from "../pages/Portal";

/** Só mostra o conteúdo para quem está logado; os demais vão para o login e voltam depois. */
export function ProtectedRoute({
  route,
  children,
}: {
  route: PortalSection;
  children: ReactNode;
}) {
  const { user, refresh } = useAuth();
  useEffect(() => {
    refresh();
  }, [route, refresh]); // detecta sessão expirada a cada navegação
  useEffect(() => {
    if (user) return;
    setLoginRedirect(route);
    navigate("login", { replace: true });
  }, [user, route]);
  return user ? <>{children}</> : null;
}

/** Telas de login/cadastro/recuperação: quem já está logado é levado ao portal. */
export function PublicOnlyRoute({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  useEffect(() => {
    if (user)
      navigate((takeLoginRedirect() ?? "inicio") as Route, { replace: true });
  }, [user]);
  return user ? null : <>{children}</>;
}
