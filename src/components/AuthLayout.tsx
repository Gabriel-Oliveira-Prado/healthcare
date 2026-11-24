import type { ReactNode } from "react";
import Brand from "./Brand";

export default function AuthLayout({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="container-fluid p-0">
      <div className="row g-0 min-vh-100">
        <aside className="auth-aside col-lg-5 d-none d-lg-block">
          <img
            src="/images/healthcare-login-illustration.png"
            alt="Médica conversando com paciente em um consultório"
          />
        </aside>
        <main className="auth-main col-lg-7 d-flex flex-column">
          <div className="d-lg-none mobile-brand">
            <Brand />
          </div>
          <div className="auth-content d-flex align-items-center flex-grow-1">
            <div className="auth-form-wrap">
              <p className="eyebrow">{eyebrow}</p>
              <h1>{title}</h1>
              <p className="page-description">{description}</p>
              {children}
            </div>
          </div>
          <footer className="auth-footer">© 2026 Healthcare.</footer>
        </main>
      </div>
    </div>
  );
}
