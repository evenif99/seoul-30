import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { isAdminAuthorized } from '@/lib/utils/admin-auth'

describe('isAdminAuthorized', () => {
  beforeEach(() => {
    vi.stubEnv('ADMIN_SECRET', '')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  describe('ADMIN_SECRET 미설정 (공개 모드)', () => {
    it('ADMIN_SECRET 없이 secret undefined → 공개 접근 허용', () => {
      expect(isAdminAuthorized(undefined)).toBe(true)
    })

    it('ADMIN_SECRET 없이 임의 secret 제공 → 공개 접근 허용', () => {
      expect(isAdminAuthorized('anyvalue')).toBe(true)
    })

    it('ADMIN_SECRET 없이 빈 문자열 secret → 공개 접근 허용', () => {
      expect(isAdminAuthorized('')).toBe(true)
    })
  })

  describe('ADMIN_SECRET 설정 (보호 모드)', () => {
    beforeEach(() => {
      vi.stubEnv('ADMIN_SECRET', 'super-secret-42')
    })

    it('올바른 secret 제공 → 접근 허용', () => {
      expect(isAdminAuthorized('super-secret-42')).toBe(true)
    })

    it('틀린 secret 제공 → 접근 거부', () => {
      expect(isAdminAuthorized('wrong-secret')).toBe(false)
    })

    it('secret 미제공 (undefined) → 접근 거부', () => {
      expect(isAdminAuthorized(undefined)).toBe(false)
    })

    it('빈 문자열 secret → 접근 거부', () => {
      expect(isAdminAuthorized('')).toBe(false)
    })

    it('대소문자 구분 — 잘못된 케이스 → 접근 거부', () => {
      expect(isAdminAuthorized('Super-Secret-42')).toBe(false)
    })
  })
})
