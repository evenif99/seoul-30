import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('seoul30_gps_onboarding', 'shown')
  })
})

test('place detail: renders title and back link', async ({ page }) => {
  await page.goto('/')

  await page.locator('[data-testid="place-card-link"]').first().click()
  await expect(page).toHaveURL(/\/place\//)

  await expect(page.locator('h1')).toBeVisible()
  await expect(page.locator('a[href="/"]')).toBeVisible()
})

test('place detail: bookmark button toggles', async ({ page }) => {
  await page.goto('/')

  await page.locator('[data-testid="place-card-link"]').first().click()
  await expect(page).toHaveURL(/\/place\//)

  const bookmarkBtn = page.locator('[data-testid^="bookmark-button-"]').first()
  await expect(bookmarkBtn).toBeVisible()

  const labelBefore = await bookmarkBtn.getAttribute('aria-label')
  await bookmarkBtn.click()
  const labelAfter = await bookmarkBtn.getAttribute('aria-label')

  expect(labelAfter).not.toBe(labelBefore)
})

test('place detail: feedback panel renders', async ({ page }) => {
  await page.goto('/')

  await page.locator('[data-testid="place-card-link"]').first().click()
  await expect(page).toHaveURL(/\/place\//)

  const thumbsUp = page.getByRole('button', { name: /helpful|도움/i }).first()
  await expect(thumbsUp).toBeVisible()
})

test('place detail: back navigation returns to list', async ({ page }) => {
  await page.goto('/')

  await page.locator('[data-testid="place-card-link"]').first().click()
  await expect(page).toHaveURL(/\/place\//)

  await page.locator('a[href="/"]').first().click()
  await expect(page).toHaveURL('/')
  await expect(page.locator('[data-testid="place-card-link"]').first()).toBeVisible()
})
