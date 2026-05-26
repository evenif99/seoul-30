import { describe, expect, it } from 'vitest'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import manifest from '../../public/manifest.json'

describe('manifest.json', () => {
  it('has required PWA fields', () => {
    expect(manifest.name).toBeTruthy()
    expect(manifest.short_name).toBeTruthy()
    expect(manifest.id).toBe('/')
    expect(manifest.start_url).toBe('/')
    expect(manifest.display).toBe('standalone')
    expect(manifest.display_override).toContain('standalone')
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

  it('includes installable png icons that exist on disk', () => {
    const requiredIcons = [
      { src: '/icons/icon-192.png', sizes: '192x192' },
      { src: '/icons/icon-512.png', sizes: '512x512' },
    ]

    for (const required of requiredIcons) {
      const icon = manifest.icons.find((item) => item.src === required.src)
      expect(icon?.sizes).toBe(required.sizes)
      expect(icon?.type).toBe('image/png')
      expect(icon?.purpose).toContain('maskable')
      expect(existsSync(join(process.cwd(), 'public', required.src))).toBe(true)
    }
  })

  it('shortcut icons point to existing files', () => {
    for (const shortcut of manifest.shortcuts ?? []) {
      for (const icon of shortcut.icons ?? []) {
        expect(existsSync(join(process.cwd(), 'public', icon.src))).toBe(true)
      }
    }
  })

  it('includes narrow and wide screenshots that exist on disk', () => {
    expect(manifest.screenshots).toBeDefined()

    const requiredScreenshots = [
      { src: '/screenshots/mobile-home.png', sizes: '390x844', form_factor: 'narrow' },
      { src: '/screenshots/desktop-home.png', sizes: '1280x720', form_factor: 'wide' },
    ]

    for (const required of requiredScreenshots) {
      const screenshot = manifest.screenshots?.find((item) => item.src === required.src)
      expect(screenshot?.sizes).toBe(required.sizes)
      expect(screenshot?.type).toBe('image/png')
      expect(screenshot?.form_factor).toBe(required.form_factor)
      expect(screenshot?.label).toBeTruthy()
      expect(existsSync(join(process.cwd(), 'public', required.src))).toBe(true)
    }
  })
})
