import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('seoul30_gps_onboarding', 'shown')
  })
})

test('language toggle switches to English', async ({ page }) => {
  await page.goto('/')

  const langBtn = page.getByRole('button', { name: /switch language/i })
  await expect(langBtn).toBeVisible()

  // 클릭 후 window.location.reload() 발생 — 리로드 완료까지 대기
  await Promise.all([
    page.waitForURL('/'),
    langBtn.click(),
  ])

  // EN 전환 후 필터 영역에 영어 텍스트 노출 확인
  await expect(page.getByTestId('free-only-filter')).toContainText(/free/i)
})

test('language toggle switches back to Korean', async ({ page }) => {
  // 영어 쿠키 세팅 후 진입
  await page.context().addCookies([
    { name: 'NEXT_LOCALE', value: 'en', domain: 'localhost', path: '/' },
  ])
  await page.goto('/')

  const langBtn = page.getByRole('button', { name: /switch language/i })

  // 클릭 후 리로드 완료까지 대기
  await Promise.all([
    page.waitForURL('/'),
    langBtn.click(),
  ])

  // 한국어 복귀 확인
  await expect(page.getByTestId('free-only-filter')).toContainText(/무료/)
})
