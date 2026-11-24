import { webcrypto } from 'node:crypto'
import { afterEach, beforeEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import { simulation } from './auth/authService'
import { setLoginRedirect } from './router'

// O jsdom não traz crypto.subtle; usamos o do Node.
Object.defineProperty(globalThis, 'crypto', { value: webcrypto, configurable: true })

beforeEach(() => { simulation.latency = 0; setLoginRedirect(null); localStorage.clear(); window.location.hash = '' })
afterEach(() => cleanup())
