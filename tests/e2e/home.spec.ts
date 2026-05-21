import { expect, test } from '@playwright/test'

// GPS 온보딩 모달이 열리지 않도록 localStorage 키를 사전 설정
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('seoul30_gps_onboarding', 'shown')
  })
})

test('home to place detail golden path', async ({ page }) => {
  await page.goto('/')

  const firstPlaceLink = page.locator('[data-testid="place-card-link"]').first()
  await expect(firstPlaceLink).toBeVisible()

  await firstPlaceLink.click()

  await expect(page).toHaveURL(/\/place\//)
  await expect(page.locator('h1')).toBeVisible()
})

test('search filter changes visible results', async ({ page }) => {
  await page.goto('/')

  const placeLinks = page.locator('[data-testid="place-card-link"]')
  await expect(placeLinks.first()).toBeVisible()
  const initialCount = await placeLinks.count()

  await page.getByTestId('place-search-input').fill('no-such-place-for-e2e')

  await expect(placeLinks).toHaveCount(0)
  expect(initialCount).toBeGreaterThan(0)
})
