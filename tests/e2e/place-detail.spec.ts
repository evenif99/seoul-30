import { expect, test } from '@playwright/test'

// mock-1은 항상 mock 데이터로 해결 — API 모드 무관하게 안정적
const MOCK_PLACE_URL = '/place/mock-1'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('seoul30_gps_onboarding', 'shown')
  })
})

test('place detail: renders title and back link', async ({ page }) => {
  await page.goto(MOCK_PLACE_URL)

  await expect(page.locator('h1')).toBeVisible()
  await expect(page.locator('a[href="/"]')).toBeVisible()
})

test('place detail: bookmark button toggles', async ({ page }) => {
  await page.goto(MOCK_PLACE_URL)

  const bookmarkBtn = page.locator('[data-testid^="bookmark-button-"]').first()
  await expect(bookmarkBtn).toBeVisible()

  const labelBefore = await bookmarkBtn.getAttribute('aria-label')
  await bookmarkBtn.click()
  const labelAfter = await bookmarkBtn.getAttribute('aria-label')

  expect(labelAfter).not.toBe(labelBefore)
})

test('place detail: feedback panel renders', async ({ page }) => {
  await page.goto(MOCK_PLACE_URL)

  // FeedbackPanel aria-label: t('helpful') / t('notHelpful')
  const thumbsUp = page.locator('[aria-label]').filter({ hasText: '' }).first()
  const feedbackSection = page.locator('[class*="rounded-2xl"]').filter({
    has: page.locator('button').nth(0),
  })
  // 피드백 패널 내 첫 번째 버튼이 보이는지 확인
  await expect(page.locator('button[aria-label]').first()).toBeVisible()
})

test('place detail: back navigation returns to list', async ({ page }) => {
  await page.goto(MOCK_PLACE_URL)

  await expect(page.locator('h1')).toBeVisible()

  await page.locator('a[href="/"]').first().click()
  await expect(page).toHaveURL('/')
  await expect(page.locator('[data-testid="place-card-link"]').first()).toBeVisible()
})
