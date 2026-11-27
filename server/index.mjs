import { createServer } from 'node:http'
import { readFile, writeFile, rename, mkdir } from 'node:fs/promises'
import { randomBytes, randomInt, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'
import { dirname, resolve, sep, extname } from 'node:path'
import { fileURLToPath } from 'node:url'

const scrypt = promisify(scryptCallback)
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const dataFile = process.env.HEALTHCARE_DATA_FILE || resolve(root, 'server/data/users.json')
const dist = resolve(root, 'dist')
const port = process.env.PORT === undefined ? 3001 : Number(process.env.PORT)
const sessions = new Map()
const attempts = new Map()
const resets = new Map()
const sessionAge = 8 * 60 * 60 * 1000
const resetAge = 15 * 60 * 1000
const maxResetAttempts = 5
let users = []
let saving = Promise.resolve()

try { users = JSON.parse(await readFile(dataFile, 'utf8')) } catch (error) { if (error.code !== 'ENOENT') throw error }
const dummyHash = await hashSecret('not-a-real-password')

function json(response, status, data, cookie) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...(cookie ? { 'Set-Cookie': cookie } : {}) })
  response.end(JSON.stringify(data))
}
function cookieFor(token, request) {
  const secure = process.env.NODE_ENV === 'production' || request.socket.encrypted
  return `healthcare_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${token ? sessionAge / 1000 : 0}${secure ? '; Secure' : ''}`
}
function sessionUser(request) {
  const token = request.headers.cookie?.split(';').map(part => part.trim()).find(part => part.startsWith('healthcare_session='))?.split('=')[1]
  const session = token && sessions.get(token)
  if (!session || session.expires < Date.now()) { if (token) sessions.delete(token); return null }
  return users.find(user => user.id === session.userId) || null
}
function publicUser(user) { return { id: user.id, name: user.name, email: user.email } }
async function hashSecret(value) {
  const salt = randomBytes(16).toString('hex')
  const hash = await scrypt(value, salt, 64)
  return `${salt}:${hash.toString('hex')}`
}
async function verifySecret(value, stored) {
  if (!stored || typeof stored !== 'string' || !stored.includes(':')) return false
  const [salt, expectedHex] = stored.split(':')
  const expected = Buffer.from(expectedHex, 'hex')
  if (!expected.length) return false
  const actual = await scrypt(value, salt, expected.length)
  return timingSafeEqual(expected, actual)
}
function saveUsers() {
  const contents = JSON.stringify(users, null, 2)
  saving = saving.then(async () => {
    await mkdir(dirname(dataFile), { recursive: true })
    const temporary = `${dataFile}.${randomBytes(8).toString('hex')}.tmp`
    await writeFile(temporary, contents, { mode: 0o600 })
    await rename(temporary, dataFile)
  })
  return saving
}
async function bodyOf(request) {
  if (!request.headers['content-type']?.startsWith('application/json')) throw new Error('JSON necessário')
  let body = ''
  for await (const chunk of request) {
    body += chunk
    if (body.length > 16_384) throw new Error('Dados muito grandes')
  }
  return JSON.parse(body)
}
function limited(request, route) {
  const key = `${request.socket.remoteAddress}:${route}`, now = Date.now(), entry = attempts.get(key)
  if (!entry || entry.until < now) { attempts.set(key, { count: 1, until: now + 15 * 60_000 }); return false }
  entry.count += 1
  return entry.count > 15
}
function sameOrigin(request) {
  const origin = request.headers.origin
  if (!origin) return false
  try {
    const url = new URL(origin), host = request.headers.host
    if (url.host === host) return url.protocol === 'https:' || (url.protocol === 'http:' && process.env.NODE_ENV !== 'production')
    return process.env.NODE_ENV !== 'production' && url.protocol === 'http:' &&
      ['localhost', '127.0.0.1'].includes(url.hostname) && /^517[3-9]$/.test(url.port) &&
      /^127\.0\.0\.1:3001$/.test(host || '') && request.socket.remoteAddress === '127.0.0.1'
  } catch { return false }
}
async function sendRecoveryEmail(user, code) {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.EMAIL_FROM
  if (!apiKey || !from) throw new Error('E-mail não configurado no servidor (RESEND_API_KEY e EMAIL_FROM).')
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from,
      to: [user.email],
      subject: 'Código para redefinir sua senha - Healthcare',
      text: `Olá, ${user.name}. Seu código de recuperação é ${code}. Ele expira em 15 minutos e só pode ser usado uma vez. Se você não solicitou a troca, ignore este e-mail.`,
      html: `<p>Olá, ${user.name}.</p><p>Seu código de recuperação do Healthcare é:</p><p style="font-size:28px;font-weight:bold;letter-spacing:6px">${code}</p><p>Ele expira em 15 minutos e só pode ser usado uma vez. Se você não solicitou a troca, ignore este e-mail.</p>`,
    }),
  })
  if (!response.ok) throw new Error(`Falha no serviço de e-mail: HTTP ${response.status}`)
}
async function api(request, response, path) {
  if (request.method === 'GET' && path === '/api/me') {
    const user = sessionUser(request)
    return json(response, user ? 200 : 401, user ? { user: publicUser(user) } : { error: 'Não autenticado' })
  }
  if (request.method !== 'POST' || !sameOrigin(request)) return json(response, 403, { error: 'Acesso negado' })
  if (limited(request, path)) return json(response, 429, { error: 'Muitas tentativas. Tente novamente mais tarde.' })
  let body
  try { body = await bodyOf(request) } catch { return json(response, 400, { error: 'Dados inválidos' }) }

  if (path === '/api/register') {
    const name = String(body.name || '').trim().replace(/\s+/g, ' ')
    const email = String(body.email || '').trim().toLowerCase()
    const password = String(body.password || '')
    if (name.length < 2 || name.length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 8 || password.length > 128 || !/[a-zA-ZÀ-ÿ]/.test(password) || !/\d/.test(password)) return json(response, 400, { error: 'Informe nome, e-mail válido e senha com pelo menos 8 caracteres, letras e números.' })
    if (users.some(user => user.email === email)) return json(response, 409, { error: 'Este e-mail já está cadastrado. Entre na sua conta ou recupere a senha.' })
    const user = { id: randomBytes(16).toString('hex'), name, email, passwordHash: await hashSecret(password) }
    users.push(user)
    await saveUsers()
    return json(response, 201, { user: publicUser(user) })
  }
  if (path === '/api/login') {
    const email = String(body.email || '').trim().toLowerCase(), password = String(body.password || '')
    const user = users.find(item => item.email === email)
    const valid = await verifySecret(password, user?.passwordHash || dummyHash)
    if (!user || !valid) return json(response, 401, { error: 'E-mail ou senha inválidos.' })
    const token = randomBytes(32).toString('base64url')
    sessions.set(token, { userId: user.id, expires: Date.now() + sessionAge })
    return json(response, 200, { user: publicUser(user) }, cookieFor(token, request))
  }
  if (path === '/api/logout') {
    const token = request.headers.cookie?.split(';').map(part => part.trim()).find(part => part.startsWith('healthcare_session='))?.split('=')[1]
    if (token) sessions.delete(token)
    return json(response, 200, { ok: true }, cookieFor('', request))
  }
  if (path === '/api/forgot-password') {
    const email = String(body.email || '').trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json(response, 400, { error: 'Informe um e-mail válido.' })
    const user = users.find(item => item.email === email)
    if (!user) return json(response, 200, { ok: true })
    const code = String(randomInt(0, 1_000_000)).padStart(6, '0')
    const codeHash = await hashSecret(code)
    try {
      await sendRecoveryEmail(user, code)
      resets.set(email, { codeHash, expires: Date.now() + resetAge, attempts: 0 })
      return json(response, 200, { ok: true })
    } catch (error) {
      console.error('Falha ao enviar e-mail de recuperação:', error.message)
      return json(response, 503, { error: 'Não foi possível enviar o e-mail de recuperação. Verifique a configuração do serviço de e-mail e tente novamente.' })
    }
  }
  if (path === '/api/reset-password') {
    const email = String(body.email || '').trim().toLowerCase(), code = String(body.code || ''), newPassword = String(body.newPassword || '')
    if (!/^\d{6}$/.test(code) || newPassword.length < 8 || newPassword.length > 128 || !/[a-zA-ZÀ-ÿ]/.test(newPassword) || !/\d/.test(newPassword)) return json(response, 400, { error: 'Informe um código de 6 números e uma senha válida com letras e números.' })
    const reset = resets.get(email), user = users.find(item => item.email === email)
    if (!reset || !user || reset.expires < Date.now()) { resets.delete(email); return json(response, 400, { error: 'Código inválido ou expirado. Solicite um novo código.' }) }
    if (reset.attempts >= maxResetAttempts) { resets.delete(email); return json(response, 429, { error: 'Muitas tentativas. Solicite um novo código.' }) }
    if (!await verifySecret(code, reset.codeHash)) { reset.attempts += 1; return json(response, 400, { error: 'Código incorreto. Confira o e-mail e tente novamente.' }) }
    user.passwordHash = await hashSecret(newPassword)
    resets.delete(email)
    for (const [token, session] of sessions) if (session.userId === user.id) sessions.delete(token)
    await saveUsers()
    return json(response, 200, { ok: true })
  }
  return json(response, 404, { error: 'Não encontrado' })
}

const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff': 'font/woff', '.woff2': 'font/woff2' }
const server = createServer(async (request, response) => {
  try {
    const path = new URL(request.url, 'http://localhost').pathname
    if (path.startsWith('/api/')) return await api(request, response, path)
    if (request.method !== 'GET') return json(response, 405, { error: 'Método inválido' })
    const file = resolve(dist, `.${path === '/' ? '/index.html' : path}`)
    if (!file.startsWith(dist + sep)) return json(response, 403, { error: 'Acesso negado' })
    try { const contents = await readFile(file); response.writeHead(200, { 'Content-Type': mime[extname(file)] || 'application/octet-stream' }); response.end(contents) }
    catch { json(response, 404, { error: 'Arquivo não encontrado' }) }
  } catch (error) { console.error(error); json(response, 500, { error: 'Erro interno' }) }
})
server.listen(port, process.env.HOST || '127.0.0.1', () => console.log(`Healthcare API em http://127.0.0.1:${server.address().port}`))
