import { useSyncExternalStore } from "react";
import type { PortalSection } from "./pages/Portal";

export type Route = "login" | "forgot" | "register" | "logout" | PortalSection;

const publicRoutes: Route[] = ["login", "forgot", "register", "logout"];
export const privateRoutes: PortalSection[] = [
  "inicio",
  "agendamentos",
  "campanhas",
  "unidades",
  "orientacoes",
];
const legacyAliases = ["dashboard", "crm", "portal"];

export const isPrivateRoute = (route: Route): route is PortalSection =>
  (privateRoutes as Route[]).includes(route);

function currentRoute(): Route {
  const name = window.location.hash.replace(/^#\/?/, "").split(/[/?]/)[0];
  if (legacyAliases.includes(name)) return "inicio";
  return ([...publicRoutes, ...privateRoutes] as string[]).includes(name)
    ? (name as Route)
    : "login";
}

function subscribe(callback: () => void) {
  window.addEventListener("hashchange", callback);
  return () => window.removeEventListener("hashchange", callback);
}

export const useHashRoute = () => useSyncExternalStore(subscribe, currentRoute);

/** `replace` troca a entrada do histórico, para o botão Voltar não cair em loop de redirecionamento. */
export function navigate(route: Route, { replace = false } = {}) {
  if (replace) window.location.replace(`#/${route}`);
  else window.location.hash = `/${route}`;
}

// Página que a pessoa tentou abrir sem estar logada; depois do login voltamos para ela.
let loginRedirect: PortalSection | null = null;
export const setLoginRedirect = (route: PortalSection | null) => {
  loginRedirect = route;
};
export const getLoginRedirect = () => loginRedirect;
export function takeLoginRedirect() {
  const route = loginRedirect;
  loginRedirect = null;
  return route;
}
