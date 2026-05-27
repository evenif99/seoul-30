/**
 * a11y-structure.test.ts
 * Phase 59 — 접근성 구조 회귀 방지
 *
 * 렌더링 없이 소스 파일을 읽어 ARIA/HTML 구조 보장.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = join(process.cwd())

function read(rel: string) {
  return readFileSync(join(ROOT, rel), 'utf-8')
}

// ── 중첩 <main> 방지 ──────────────────────────────────────────────────────────
describe('layout.tsx — outer wrapper must not be <main>', () => {
  const src = read('app/layout.tsx')

  it('레이아웃은 <main id="main-content">를 직접 선언하지 않는다', () => {
    // layout이 <main id="main-content">를 가지면 각 페이지의 <main>과 중첩됨
    expect(src).not.toMatch(/<main[^>]*id=["']main-content["']/)
  })
})

// ── 각 페이지가 skip link 앵커를 제공 ─────────────────────────────────────────
describe('각 페이지에 id="main-content" skip link 앵커 존재', () => {
  const pages = [
    'app/page.tsx',
    'app/place/[id]/page.tsx',
    'app/bookmarks/page.tsx',
    'app/about/page.tsx',
    'app/privacy/page.tsx',
    'app/offline/page.tsx',
  ]

  for (const page of pages) {
    it(`${page} — id="main-content" 앵커 선언`, () => {
      const src = read(page)
      expect(src).toMatch(/id=["']main-content["']/)
    })
  }
})

// ── aria-pressed 토글 버튼 ─────────────────────────────────────────────────────
describe('page.tsx — 토글 버튼 aria-pressed', () => {
  const src = read('app/page.tsx')

  it('정렬 버튼에 aria-pressed 속성이 있다', () => {
    expect(src).toMatch(/aria-pressed=\{!sortByDistance\}/)
    expect(src).toMatch(/aria-pressed=\{sortByDistance\}/)
  })

  it('뷰 모드 버튼에 aria-pressed 속성이 있다', () => {
    expect(src).toMatch(/aria-pressed=\{viewMode === ['"]list['"]\}/)
    expect(src).toMatch(/aria-pressed=\{viewMode === ['"]map['"]\}/)
  })
})

// ── PushSubscribeButton — category chip aria-pressed ─────────────────────────
describe('PushSubscribeButton — 카테고리 칩 aria-pressed', () => {
  const src = read('components/seoul30/PushSubscribeButton.tsx')

  it('선택/편집 패널의 카테고리 버튼에 aria-pressed가 있다', () => {
    // selected.has(cat) 패턴으로 aria-pressed 두 번 이상 사용
    const matches = src.match(/aria-pressed=\{selected\.has\(cat\)\}/g) ?? []
    expect(matches.length).toBeGreaterThanOrEqual(2) // selecting + editing 패널
  })

  it('ESC 키 핸들러가 존재한다', () => {
    expect(src).toContain("e.key === 'Escape'")
  })
})

// ── bookmarks — tablist/tabpanel ARIA ────────────────────────────────────────
describe('bookmarks/page.tsx — tablist/tabpanel 완성도', () => {
  const src = read('app/bookmarks/page.tsx')

  it('tablist에 aria-label이 있다', () => {
    expect(src).toMatch(/role=["']tablist["']/)
    expect(src).toContain('aria-label')
  })

  it('tab 버튼에 id와 aria-controls가 있다', () => {
    expect(src).toContain('id="tab-saved"')
    expect(src).toContain('id="tab-recent"')
    expect(src).toContain('aria-controls="tabpanel-places"')
  })

  it('tabpanel에 role과 aria-labelledby가 있다', () => {
    expect(src).toContain('role="tabpanel"')
    expect(src).toContain('aria-labelledby')
    expect(src).toContain('id="tabpanel-places"')
  })
})

// ── i18n 키 — 신규 aria 레이블 ───────────────────────────────────────────────
describe('i18n — sortLabel / viewModeLabel 키 존재', () => {
  const ko = read('messages/ko.json')
  const en = read('messages/en.json')

  it('ko.json에 sortLabel 키가 있다', () => {
    expect(ko).toContain('"sortLabel"')
  })

  it('ko.json에 viewModeLabel 키가 있다', () => {
    expect(ko).toContain('"viewModeLabel"')
  })

  it('en.json에 sortLabel 키가 있다', () => {
    expect(en).toContain('"sortLabel"')
  })

  it('en.json에 viewModeLabel 키가 있다', () => {
    expect(en).toContain('"viewModeLabel"')
  })
})
