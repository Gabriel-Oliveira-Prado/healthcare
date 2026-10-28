import { createServer } from 'node:http'
import { readFile, writeFile, rename, mkdir } from 'node:fs/promises'
import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto'
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
const sessionAge = 8 * 60 * 60 * 1000
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
  const [salt, expectedHex] = stored.split(':')
  const expected = Buffer.from(expectedHex, 'hex')
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
  const key = `${request.socket.remoteAddress}:${route}`
  const now = Date.now()
  const entry = attempts.get(key)
  if (!entry || entry.until < now) { attempts.set(key, { count: 1, until: now + 15 * 60_000 }); return false }
  entry.count += 1
  return entry.count > 15
}

function sameOrigin(request) {
  const origin = request.headers.origin
  if (!origin) return false
  try {
    const url = new URL(origin)
    const host = request.headers.host
    if (url.host === host) return url.protocol === 'https:' || (url.protocol === 'http:' && process.env.NODE_ENV !== 'production')
    return process.env.NODE_ENV !== 'production' && url.protocol === 'http:' &&
      ['localhost', '127.0.0.1'].includes(url.hostname) && /^517[3-9]$/.test(url.port) &&
      /^127\.0\.0\.1:3001$/.test(host || '') && request.socket.remoteAddress === '127.0.0.1'
  } catch { return false }
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
    const name = String(body.name || '').trim()
    const email = String(body.email || '').trim().toLowerCase()
    const password = String(body.password || '')
    if (name.length < 2 || name.length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 8 || password.length > 128) return json(response, 400, { error: 'Informe nome, e-mail válido e senha com pelo menos 8 caracteres.' })
    if (users.some(user => user.email === email)) return json(response, 409, { error: 'Não foi possível cadastrar este e-mail.' })
    const recoveryCode = randomBytes(18).toString('base64url')
    users.push({ id: randomBytes(16).toString('hex'), name, email, passwordHash: await hashSecret(password), recoveryHash: await hashSecret(recoveryCode) })
    await saveUsers()
    return json(response, 201, { recoveryCode })
  }
  if (path === '/api/login') {
    const email = String(body.email || '').trim().toLowerCase()
    const password = String(body.password || '')
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
  if (path === '/api/recover') {
    const email = String(body.email || '').trim().toLowerCase()
    const code = String(body.recoveryCode || '')
    const newPassword = String(body.newPassword || '')
    if (newPassword.length < 8 || newPassword.length > 128) return json(response, 400, { error: 'A nova senha deve ter de 8 a 128 caracteres.' })
    const user = users.find(item => item.email === email)
    const valid = await verifySecret(code, user?.recoveryHash || dummyHash)
    if (!user || !valid) return json(response, 400, { error: 'Não foi possível recuperar o acesso com esses dados.' })
    const recoveryCode = randomBytes(18).toString('base64url')
    user.passwordHash = await hashSecret(newPassword)
    user.recoveryHash = await hashSecret(recoveryCode)
    for (const [token, session] of sessions) if (session.userId === user.id) sessions.delete(token)
    await saveUsers()
    return json(response, 200, { recoveryCode })
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
    try {
      const contents = await readFile(file)
      response.writeHead(200, { 'Content-Type': `${mime[extname(file)] || 'application/octet-stream'}` })
      response.end(contents)
    } catch { json(response, 404, { error: 'Arquivo não encontrado' }) }
  } catch (error) {
    console.error(error)
    json(response, 500, { error: 'Erro interno' })
  }
})
server.listen(port, process.env.HOST || '127.0.0.1', () => console.log(`Healthcare API em http://127.0.0.1:${server.address().port}`))
