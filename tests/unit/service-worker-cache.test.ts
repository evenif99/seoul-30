import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const sw = readFileSync(join(process.cwd(), 'public/sw.js'), 'utf8')

describe('service worker API cache fallback', () => {
  it('marks cached /api/places responses as offline stale data', () => {
    expect(sw).toContain('networkFirstApiWithCache')
    expect(sw).toContain('isOfflineCache: true')
    expect(sw).toContain('isStale: true')
    expect(sw).toContain("'x-sw-cache': 'offline'")
  })
})
