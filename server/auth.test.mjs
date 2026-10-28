import test from 'node:test'
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve, join } from 'node:path'

test('cadastro, área restrita, logoff e recuperação de senha', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'healthcare-test-'))
  const dataFile = join(directory, 'users.json')
  const child = spawn(process.execPath, [resolve('server/index.mjs')], { env: { ...process.env, PORT: '0', HEALTHCARE_DATA_FILE: dataFile }, stdio: ['ignore', 'pipe', 'pipe'] })
  try {
    const port = await new Promise((resolvePort, reject) => {
      let output = ''
      const timer = setTimeout(() => reject(new Error('Servidor não iniciou')), 10000)
      child.stdout.on('data', chunk => {
        output += chunk
        const match = output.match(/127\.0\.0\.1:(\d+)/)
        if (match) { clearTimeout(timer); resolvePort(match[1]) }
      })
      child.once('error', error => { clearTimeout(timer); reject(error) })
      child.once('exit', code => { clearTimeout(timer); reject(new Error(`Servidor saiu: ${code}`)) })
    })
    const base = `http://127.0.0.1:${port}`
    async function request(path, body, cookie) {
      const response = await fetch(base + path, { method: body ? 'POST' : 'GET', headers: { ...(body ? { Origin: base, 'Content-Type': 'application/json' } : {}), ...(cookie ? { Cookie: cookie } : {}) }, body: body ? JSON.stringify(body) : undefined })
      return { status: response.status, data: await response.json(), cookie: response.headers.get('set-cookie')?.split(';')[0] }
    }

    assert.equal((await request('/api/me')).status, 401)
    const registered = await request('/api/register', { name: 'Pessoa Teste', email: 'teste@exemplo.com', password: 'senha-segura-123' })
    assert.equal(registered.status, 201)
    assert.ok(registered.data.recoveryCode)
    assert.equal((await request('/api/login', { email: 'teste@exemplo.com', password: 'errada' })).status, 401)
    const login = await request('/api/login', { email: 'teste@exemplo.com', password: 'senha-segura-123' })
    assert.equal(login.status, 200)
    assert.equal(login.data.user.name, 'Pessoa Teste')
    assert.equal((await request('/api/me', undefined, login.cookie)).status, 200)
    assert.equal((await request('/api/logout', {}, login.cookie)).status, 200)
    assert.equal((await request('/api/me', undefined, login.cookie)).status, 401)

    const loginAgain = await request('/api/login', { email: 'teste@exemplo.com', password: 'senha-segura-123' })
    const recovered = await request('/api/recover', { email: 'teste@exemplo.com', recoveryCode: registered.data.recoveryCode, newPassword: 'outra-senha-456' })
    assert.equal(recovered.status, 200)
    assert.notEqual(recovered.data.recoveryCode, registered.data.recoveryCode)
    assert.equal((await request('/api/me', undefined, loginAgain.cookie)).status, 401)
    assert.equal((await request('/api/login', { email: 'teste@exemplo.com', password: 'senha-segura-123' })).status, 401)
    assert.equal((await request('/api/login', { email: 'teste@exemplo.com', password: 'outra-senha-456' })).status, 200)
    const stored = await readFile(dataFile, 'utf8')
    assert.equal(stored.includes('senha-segura-123'), false)
    assert.equal(stored.includes(registered.data.recoveryCode), false)
  } finally {
    child.kill()
    await rm(directory, { recursive: true, force: true })
  }
})
