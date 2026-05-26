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
  await expect(langBtn).toBeVisible()

  // 버튼 클릭 → document.cookie에 NEXT_LOCALE=en 설정 + window.location.reload()
  await langBtn.click()

  // reload 완료 후 서버가 NEXT_LOCALE=en 쿠키를 읽어 영어로 렌더링될 때까지 재시도
  // toContainText는 페이지 리로드를 포함해 최대 15초간 자동 재시도
  await expect(page.getByTestId('free-only-filter')).toContainText(/free/i, { timeout: 15000 })
})

test('language toggle switches back to Korean', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => {
    document.cookie = 'NEXT_LOCALE=en; path=/; max-age=31536000; SameSite=Lax'
  })
  await page.goto('/')

  // 영어 상태 확인
  await expect(page.getByTestId('free-only-filter')).toContainText(/free/i)

  // 클릭 시점에 toggle()이 실제로 'en'을 읽는지 확인
  const localeBefore = await page.evaluate(() =>
    document.cookie.split('; ').find((c) => c.startsWith('NEXT_LOCALE='))?.split('=')[1] ?? '(not set)',
  )
  expect(localeBefore).toBe('en')

  const langBtn = page.getByRole('button', { name: /switch language/i })
  await expect(langBtn).toBeVisible()

  await Promise.all([
    page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 15000 }),
    langBtn.click(),
  ])

  // reload 후 한국어로 복귀 확인
  await expect(page.getByTestId('free-only-filter')).toContainText(/무료/, { timeout: 10000 })
})
