import { describe, expect, it } from 'vitest'
import manifest from '../../public/manifest.json'

describe('manifest.json', () => {
  it('has required PWA fields', () => {
    expect(manifest.name).toBeTruthy()
    expect(manifest.short_name).toBeTruthy()
    expect(manifest.start_url).toBe('/')
    expect(manifest.display).toBe('standalone')
  })

  it('has at least one icon', () => {
    expect(manifest.icons.length).toBeGreaterThanOrEqual(1)
    expect(manifest.icons[0].src).toBeTruthy()
  })

  it('includes maskable icon purpose', () => {
    const hasMaskable = manifest.icons.some((icon) =>
      icon.purpose?.includes('maskable')
    )
    expect(hasMaskable).toBe(true)
  })

  it('opts out of related applications', () => {
    expect(manifest.prefer_related_applications).toBe(false)
  })

  it('has shortcuts defined', () => {
    expect(manifest.shortcuts).toBeDefined()
    expect(manifest.shortcuts!.length).toBeGreaterThan(0)
  })
})
