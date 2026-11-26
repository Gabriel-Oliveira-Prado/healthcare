// Regras de validação do front-end. Funções puras: retornam '' quando o valor é
// válido ou a mensagem de erro (em português) quando não é.

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const NAME_PATTERN = /^[\p{L}][\p{L}' .-]*$/u;

export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 128;
export const RECOVERY_CODE_LENGTH = 6;

export function normalizeName(value: string) {
  return value.trim().replace(/\s+/g, " ");
}
export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function validateName(value: string) {
  const name = normalizeName(value);
  if (!name) return "Informe seu nome completo.";
  if (name.length > 100) return "O nome deve ter no máximo 100 caracteres.";
  if (!NAME_PATTERN.test(name)) return "Use apenas letras no nome.";
  if (name.split(" ").length < 2) return "Informe nome e sobrenome.";
  return "";
}

export function validateEmail(value: string) {
  const email = normalizeEmail(value);
  if (!email) return "Informe seu e-mail.";
  if (email.length > 254 || !EMAIL_PATTERN.test(email))
    return "Informe um e-mail válido, como nome@exemplo.com.";
  return "";
}

export function passwordChecks(value: string) {
  return [
    {
      label: `Pelo menos ${PASSWORD_MIN} caracteres`,
      ok: value.length >= PASSWORD_MIN,
    },
    { label: "Pelo menos uma letra", ok: /\p{L}/u.test(value) },
    { label: "Pelo menos um número", ok: /\d/.test(value) },
  ];
}

export function validatePassword(value: string) {
  if (!value) return "Crie uma senha.";
  if (value.length > PASSWORD_MAX)
    return `A senha deve ter no máximo ${PASSWORD_MAX} caracteres.`;
  if (passwordChecks(value).some((check) => !check.ok))
    return `A senha deve ter pelo menos ${PASSWORD_MIN} caracteres, com letras e números.`;
  return "";
}

export function validatePasswordConfirmation(
  password: string,
  confirmation: string,
) {
  if (!confirmation) return "Repita a senha para confirmar.";
  return password === confirmation ? "" : "As senhas não são iguais.";
}

export function validateRecoveryCode(value: string) {
  const code = value.trim();
  if (!code) return "Informe o código recebido.";
  return new RegExp(`^\\d{${RECOVERY_CODE_LENGTH}}$`).test(code)
    ? ""
    : `O código tem ${RECOVERY_CODE_LENGTH} números.`;
}
