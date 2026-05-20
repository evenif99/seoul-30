import { describe, it, expect, vi, afterEach } from 'vitest'
import { validateEnv } from '@/lib/config/env'

afterEach(() => vi.unstubAllEnvs())

describe('validateEnv', () => {
  it('passes when DATABASE_URL is set', () => {
    vi.stubEnv('DATABASE_URL', 'postgresql://localhost/test')
    vi.stubEnv('ENABLE_CULTURE_EVENTS_API', 'false')
    expect(() => validateEnv()).not.toThrow()
  })

  it('throws when DATABASE_URL is missing', () => {
    vi.stubEnv('DATABASE_URL', '')
    expect(() => validateEnv()).toThrow('DATABASE_URL is required')
  })

  it('throws when ENABLE_CULTURE_EVENTS_API=true but SEOUL_OPEN_API_KEY is missing', () => {
    vi.stubEnv('DATABASE_URL', 'postgresql://localhost/test')
    vi.stubEnv('ENABLE_CULTURE_EVENTS_API', 'true')
    vi.stubEnv('SEOUL_OPEN_API_KEY', '')
    expect(() => validateEnv()).toThrow('SEOUL_OPEN_API_KEY is required')
  })

  it('throws when only one VAPID key is set', () => {
    vi.stubEnv('DATABASE_URL', 'postgresql://localhost/test')
    vi.stubEnv('ENABLE_CULTURE_EVENTS_API', 'false')
    vi.stubEnv('VAPID_PUBLIC_KEY', 'pk_test')
    vi.stubEnv('VAPID_PRIVATE_KEY', '')
    expect(() => validateEnv()).toThrow('VAPID_PRIVATE_KEY is required')
  })

  it('error message lists all violations', () => {
    vi.stubEnv('DATABASE_URL', '')
    vi.stubEnv('ENABLE_CULTURE_EVENTS_API', 'true')
    vi.stubEnv('SEOUL_OPEN_API_KEY', '')
    expect(() => validateEnv()).toThrow('[env] Configuration error')
  })
})
