import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const workflow = readFileSync(join(process.cwd(), '.github/workflows/ci.yml'), 'utf8')
const lhciConfig = readFileSync(join(process.cwd(), 'lighthouserc.cjs'), 'utf8')

describe('Lighthouse CI configuration', () => {
  it('runs Lighthouse CI in GitHub Actions', () => {
    expect(workflow).toContain('Lighthouse CI')
    expect(workflow).toContain('npx @lhci/cli@0.15.1 autorun')
  })

  it('sets quality gates and temporary upload storage', () => {
    expect(lhciConfig).toContain('http://localhost:3001/')
    expect(lhciConfig).toContain('npx next start -p 3001')
    expect(lhciConfig).toContain("target: 'temporary-public-storage'")
    expect(lhciConfig).toContain("'categories:performance'")
    expect(lhciConfig).toContain("'categories:accessibility'")
    expect(lhciConfig).toContain("'categories:pwa'")
  })
})
