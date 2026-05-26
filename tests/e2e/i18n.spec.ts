import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('seoul30_gps_onboarding', 'shown')
  })
})

test('language toggle switches to English', async ({ page }) => {
  await page.goto('/')

  // 한국어 초기 상태 확인
  await expect(page.getByTestId('free-only-filter')).toContainText(/무료/)

  const langBtn = page.getByRole('button', { name: /switch language/i })
  await langBtn.click()

  // window.location.reload() 후 텍스트가 영어로 바뀔 때까지 대기
  // expect().toContainText()는 타임아웃까지 자동 재시도
  await expect(page.getByTestId('free-only-filter')).toContainText(/free/i)
})

test('language toggle switches back to Korean', async ({ page }) => {
  // 영어 쿠키를 LanguageToggle과 동일한 방식으로 설정
  await page.goto('/')
  await page.evaluate(() => {
    document.cookie = 'NEXT_LOCALE=en; path=/; max-age=31536000; SameSite=Lax'
  })
  await page.goto('/')

  // 영어 상태 확인
  await expect(page.getByTestId('free-only-filter')).toContainText(/free/i)

  const langBtn = page.getByRole('button', { name: /switch language/i })
  await langBtn.click()

  // 한국어로 돌아올 때까지 자동 재시도 대기
  await expect(page.getByTestId('free-only-filter')).toContainText(/무료/)
})
