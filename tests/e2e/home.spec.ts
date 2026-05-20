import { expect, test } from '@playwright/test'

test('home to place detail golden path', async ({ page }) => {
  await page.goto('/')

  const firstPlaceLink = page.locator('a[href^="/place/"]').first()
  await expect(firstPlaceLink).toBeVisible()

  await firstPlaceLink.click()

  await expect(page).toHaveURL(/\/place\/mock-/)
  await expect(page.locator('h1')).toBeVisible()
})

test('search filter changes visible results', async ({ page }) => {
  await page.goto('/')

  const placeLinks = page.locator('a[href^="/place/"]')
  await expect(placeLinks.first()).toBeVisible()
  const initialCount = await placeLinks.count()

  await page.getByTestId('place-search-input').fill('no-such-place-for-e2e')

  await expect(placeLinks).toHaveCount(0)
  expect(initialCount).toBeGreaterThan(0)
})
