import { passwordChecks } from "../auth/validation";

export default function PasswordRules({ password }: { password: string }) {
  return (
    <ul className="password-rules" aria-label="Requisitos da senha">
      {passwordChecks(password).map((check) => (
        <li key={check.label} className={check.ok ? "ok" : ""}>
          <i
            className={`bi ${check.ok ? "bi-check-circle-fill" : "bi-circle"}`}
            aria-hidden="true"
          />{" "}
          {check.label}
          <span className="visually-hidden">
            {check.ok ? " (atendido)" : " (pendente)"}
          </span>
        </li>
      ))}
    </ul>
  );
}
