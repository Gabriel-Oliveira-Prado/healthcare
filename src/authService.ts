// "Back-end" simulado. Tudo fica no localStorage do navegador, então não há
// servidor, e-mail ou segurança real: serve para demonstrar os fluxos de
// cadastro, login, recuperação de senha e logout na interface.
import {
  normalizeEmail,
  normalizeName,
  validateEmail,
  validateName,
  validatePassword,
  validateRecoveryCode,
  RECOVERY_CODE_LENGTH,
} from "./validation";

export type User = { id: string; name: string; email: string };
export type AuthField = "name" | "email" | "password" | "code";

type StoredUser = User & {
  salt: string;
  passwordHash: string;
  createdAt: string;
};
type Session = { userId: string; expires: number };
type ResetRequest = { code: string; expires: number; attempts: number };

const USERS_KEY = "healthcare.users";
const SESSION_KEY = "healthcare.session";
const RESETS_KEY = "healthcare.resets";
const SESSION_MS = 8 * 60 * 60 * 1000;
const RESET_MS = 15 * 60 * 1000;
const MAX_RESET_ATTEMPTS = 5;

/** Atraso artificial (ms) para a interface mostrar estados de carregamento. */
export const simulation = { latency: 450 };

export class AuthError extends Error {
  field?: AuthField;
  constructor(message: string, field?: AuthField) {
    super(message);
    this.name = "AuthError";
    this.field = field;
  }
}

const wait = () =>
  new Promise<void>((resolve) => setTimeout(resolve, simulation.latency));

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    throw new AuthError("Não foi possível salvar os dados neste navegador.");
  }
}

const readUsers = () => read<StoredUser[]>(USERS_KEY, []);
const toUser = ({ id, name, email }: StoredUser): User => ({ id, name, email });

function randomHex(bytes: number) {
  return Array.from(crypto.getRandomValues(new Uint8Array(bytes)), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
}

// A senha nunca é guardada em texto puro. Em um sistema real o hash seria feito
// no servidor com scrypt/argon2; aqui usamos SHA-256 com sal via Web Crypto.
async function hashPassword(password: string, salt: string) {
  const data = new TextEncoder().encode(`${salt}:${password}`);
  const subtle = globalThis.crypto?.subtle;
  if (subtle)
    return Array.from(
      new Uint8Array(await subtle.digest("SHA-256", data)),
      (b) => b.toString(16).padStart(2, "0"),
    ).join("");
  let hash = 5381; // alternativa fraca para páginas servidas fora de contexto seguro (HTTP sem localhost)
  for (const byte of data) hash = ((hash * 33) ^ byte) >>> 0;
  return `simple-${hash.toString(16)}`;
}

function randomCode() {
  const [value] = crypto.getRandomValues(new Uint32Array(1));
  return String(value % 10 ** RECOVERY_CODE_LENGTH).padStart(
    RECOVERY_CODE_LENGTH,
    "0",
  );
}

function startSession(userId: string) {
  write(SESSION_KEY, {
    userId,
    expires: Date.now() + SESSION_MS,
  } satisfies Session);
}

/** Retorna o usuário da sessão ativa; sessões expiradas ou órfãs são removidas. */
export function getCurrentUser(): User | null {
  const session = read<Session | null>(SESSION_KEY, null);
  if (!session) return null;
  const user =
    session.expires > Date.now()
      ? readUsers().find((item) => item.id === session.userId)
      : undefined;
  if (!user) {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
  return toUser(user);
}

export async function register(input: {
  name: string;
  email: string;
  password: string;
}): Promise<User> {
  await wait();
  const name = normalizeName(input.name);
  const email = normalizeEmail(input.email);
  const nameError = validateName(name),
    emailError = validateEmail(email),
    passwordError = validatePassword(input.password);
  if (nameError) throw new AuthError(nameError, "name");
  if (emailError) throw new AuthError(emailError, "email");
  if (passwordError) throw new AuthError(passwordError, "password");

  const users = readUsers();
  if (users.some((user) => user.email === email))
    throw new AuthError(
      "Este e-mail já está cadastrado. Entre na sua conta ou recupere a senha.",
      "email",
    );
  const salt = randomHex(16);
  const stored: StoredUser = {
    id: randomHex(16),
    name,
    email,
    salt,
    passwordHash: await hashPassword(input.password, salt),
    createdAt: new Date().toISOString(),
  };
  write(USERS_KEY, [...users, stored]);
  return toUser(stored);
}

export async function login(
  emailInput: string,
  password: string,
): Promise<User> {
  await wait();
  const email = normalizeEmail(emailInput);
  const user = readUsers().find((item) => item.email === email);
  const valid = user
    ? (await hashPassword(password, user.salt)) === user.passwordHash
    : false;
  if (!user || !valid) throw new AuthError("E-mail ou senha inválidos.");
  startSession(user.id);
  return toUser(user);
}

export function logout() {
  localStorage.removeItem(SESSION_KEY);
}

/**
 * Simula o envio do e-mail de recuperação. Como não existe serviço de e-mail, o
 * código é devolvido para a interface exibi-lo. Para e-mails não cadastrados a
 * resposta é a mesma, só que sem código (como um e-mail que nunca chega).
 */
export async function requestPasswordReset(
  emailInput: string,
): Promise<{ code: string | null }> {
  await wait();
  const email = normalizeEmail(emailInput);
  const emailError = validateEmail(email);
  if (emailError) throw new AuthError(emailError, "email");
  if (!readUsers().some((user) => user.email === email)) return { code: null };
  const code = randomCode();
  write(RESETS_KEY, {
    ...read<Record<string, ResetRequest>>(RESETS_KEY, {}),
    [email]: { code, expires: Date.now() + RESET_MS, attempts: 0 },
  });
  return { code };
}

export async function resetPassword(input: {
  email: string;
  code: string;
  newPassword: string;
}): Promise<void> {
  await wait();
  const email = normalizeEmail(input.email);
  const code = input.code.trim();
  const codeError = validateRecoveryCode(code),
    passwordError = validatePassword(input.newPassword);
  if (codeError) throw new AuthError(codeError, "code");
  if (passwordError) throw new AuthError(passwordError, "password");

  const resets = read<Record<string, ResetRequest>>(RESETS_KEY, {});
  const request = resets[email];
  const users = readUsers();
  const user = users.find((item) => item.email === email);
  if (!request || !user || request.expires < Date.now())
    throw new AuthError(
      "Código inválido ou expirado. Solicite um novo código.",
      "code",
    );
  if (request.attempts >= MAX_RESET_ATTEMPTS) {
    delete resets[email];
    write(RESETS_KEY, resets);
    throw new AuthError("Muitas tentativas. Solicite um novo código.", "code");
  }
  if (request.code !== code) {
    write(RESETS_KEY, {
      ...resets,
      [email]: { ...request, attempts: request.attempts + 1 },
    });
    throw new AuthError(
      "Código incorreto. Confira o código e tente de novo.",
      "code",
    );
  }

  const salt = randomHex(16);
  const passwordHash = await hashPassword(input.newPassword, salt);
  write(
    USERS_KEY,
    users.map((item) =>
      item.id === user.id ? { ...item, salt, passwordHash } : item,
    ),
  );
  delete resets[email];
  write(RESETS_KEY, resets);
  if (read<Session | null>(SESSION_KEY, null)?.userId === user.id) logout(); // encerra sessões antigas
}
