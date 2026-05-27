import { test, expect } from '@playwright/test'

/**
 * Phase 67 — 지도·위치 회귀 테스트
 *
 * 대상:
 *  1. 지도 탭 전환 smoke
 *     - 리스트 → 지도 뷰 전환 시 map-view-container 가 DOM에 나타나고
 *       장소 카드 목록(list section)이 숨겨지는지 확인.
 *     - 지도 → 리스트 뷰 복귀 시 장소 카드가 재표시되는지 확인.
 *     - 주의: CLIENT_ID 유무에 따라 map-fallback / 로딩 화면 / 실제 지도가
 *       렌더될 수 있으므로 SDK 로딩 결과에 의존하지 않는다.
 *       (CLIENT_ID 미설정 → map-fallback 케이스는 MapView.test.tsx 유닛 테스트가 담당)
 *
 *  2. 위치 기반 smoke
 *     - Playwright 지오로케이션 모킹으로 geolocation.getCurrentPosition 이
 *       정상 처리되고 "내 위치 기반" 배지가 UI에 표시되는지 확인.
 */

// 서울 시청 좌표 (위치 기반 smoke 공통 사용)
const SEOUL_CITY_HALL = { latitude: 37.5665, longitude: 126.978 }

// ─────────────────────────────────────────────────────────────────────────────
// 1. 지도 탭 전환 smoke
// ─────────────────────────────────────────────────────────────────────────────
test.describe('지도 탭 전환 smoke', () => {
  test.beforeEach(async ({ page }) => {
    // GPS 온보딩 모달이 나타나지 않도록 localStorage 키를 사전 설정
    await page.addInitScript(() => {
      localStorage.setItem('seoul30_gps_onboarding', 'shown')
    })
  })

  test('지도 뷰 전환 시 map-view-container 렌더 + 장소 카드 숨겨짐', async ({ page }) => {
    await page.goto('/')
    // 리스트 뷰 기본 상태 확인
    await expect(page.locator('[data-testid="place-card-link"]').first()).toBeVisible()

    // 지도 뷰 토글 클릭
    await page.getByRole('button', { name: '지도 뷰' }).click()

    // map-view-container 가 DOM에 존재해야 함 (SDK 상태 무관)
    await expect(page.locator('[data-testid="map-view-container"]')).toBeVisible()

    // 리스트 섹션은 렌더되지 않으므로 장소 카드가 DOM에 없어야 함
    await expect(page.locator('[data-testid="place-card-link"]')).toHaveCount(0)

    // aria-pressed 상태 반영 확인
    await expect(page.getByRole('button', { name: '지도 뷰' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  test('지도 → 리스트 뷰 복귀 시 장소 카드 재표시', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('[data-testid="place-card-link"]').first()).toBeVisible()

    // 지도 탭으로 이동
    await page.getByRole('button', { name: '지도 뷰' }).click()
    await expect(page.locator('[data-testid="map-view-container"]')).toBeVisible()

    // 리스트 탭으로 복귀
    await page.getByRole('button', { name: '리스트 뷰' }).click()

    // 장소 카드 복원, map-view-container 사라짐
    await expect(page.locator('[data-testid="place-card-link"]').first()).toBeVisible()
    await expect(page.locator('[data-testid="map-view-container"]')).toHaveCount(0)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 2. 위치 기반 smoke
// ─────────────────────────────────────────────────────────────────────────────
test.describe('위치 기반 smoke', () => {
  test('온보딩 모달 "위치 허용하기" → 내 위치 기반 배지 표시', async ({
    page,
    context,
  }) => {
    // 지오로케이션 모킹 — 서울 시청
    await context.grantPermissions(['geolocation'])
    await context.setGeolocation(SEOUL_CITY_HALL)

    // localStorage 미설정 → 온보딩 모달이 자동으로 열림
    await page.goto('/')

    const allowBtn = page.getByRole('button', { name: '위치 허용하기' })
    await expect(allowBtn).toBeVisible()
    await allowBtn.click()

    // getCurrentPosition 해소 후 배지 표시 (최대 10초)
    // exact: true — "내 위치 기반 추천" 버튼 텍스트와 구분
    await expect(page.getByText('내 위치 기반', { exact: true })).toBeVisible({
      timeout: 10_000,
    })

    // 장소 카드도 정상 표시
    await expect(page.locator('[data-testid="place-card-link"]').first()).toBeVisible()
  })

  test('"내 위치 기반 추천" 버튼 직접 클릭 → 배지 표시', async ({
    page,
    context,
  }) => {
    await context.grantPermissions(['geolocation'])
    await context.setGeolocation(SEOUL_CITY_HALL)

    // 모달은 억제 — 버튼 직접 클릭 흐름 검증
    await page.addInitScript(() => {
      localStorage.setItem('seoul30_gps_onboarding', 'shown')
    })

    await page.goto('/')
    await expect(page.locator('[data-testid="place-card-link"]').first()).toBeVisible()

    // "내 위치 기반 추천" 버튼 클릭
    await page.getByRole('button', { name: '내 위치 기반 추천' }).click()

    await expect(page.getByText('내 위치 기반', { exact: true })).toBeVisible({
      timeout: 10_000,
    })
  })
})
