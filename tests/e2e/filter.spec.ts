import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('seoul30_gps_onboarding', 'shown')
  })
})

test('free-only filter toggles and affects results', async ({ page }) => {
  await page.goto('/')

  const placeLinks = page.locator('[data-testid="place-card-link"]')
  await expect(placeLinks.first()).toBeVisible()
  const totalCount = await placeLinks.count()
  expect(totalCount).toBeGreaterThan(0)

  const freeBtn = page.getByTestId('free-only-filter')
  await expect(freeBtn).toHaveAttribute('aria-pressed', 'false')

  await freeBtn.click()
  await expect(freeBtn).toHaveAttribute('aria-pressed', 'true')

  // 필터 적용 후 결과는 전체 이하여야 함
  const filteredCount = await placeLinks.count()
  expect(filteredCount).toBeLessThanOrEqual(totalCount)

  // 필터 해제 시 원래 수로 복귀
  await freeBtn.click()
  await expect(freeBtn).toHaveAttribute('aria-pressed', 'false')
  await expect(placeLinks).toHaveCount(totalCount)
})

test('tag filter: indoor narrows results', async ({ page }) => {
  await page.goto('/')

  const placeLinks = page.locator('[data-testid="place-card-link"]')
  await expect(placeLinks.first()).toBeVisible()
  const totalCount = await placeLinks.count()

  const indoorBtn = page.getByTestId('tag-filter-indoor')
  await indoorBtn.click()
  await expect(indoorBtn).toHaveAttribute('aria-pressed', 'true')

  const filteredCount = await placeLinks.count()
  expect(filteredCount).toBeGreaterThan(0)
  expect(filteredCount).toBeLessThanOrEqual(totalCount)
})

test('tag filter: toggling off restores full results', async ({ page }) => {
  await page.goto('/')

  const placeLinks = page.locator('[data-testid="place-card-link"]')
  await expect(placeLinks.first()).toBeVisible()
  const totalCount = await placeLinks.count()

  const indoorBtn = page.getByTestId('tag-filter-indoor')
  await indoorBtn.click()
  await expect(indoorBtn).toHaveAttribute('aria-pressed', 'true')

  await indoorBtn.click()
  await expect(indoorBtn).toHaveAttribute('aria-pressed', 'false')

  const restoredCount = await placeLinks.count()
  expect(restoredCount).toBe(totalCount)
})

test('tag filter: wheelchair filter toggles and narrows results', async ({ page }) => {
  await page.goto('/')

  const placeLinks = page.locator('[data-testid="place-card-link"]')
  const resultSection = page.locator('section[aria-busy]')
  await expect(resultSection).toHaveAttribute('aria-busy', 'false', { timeout: 10000 })
  await expect(placeLinks.first()).toBeVisible()
  const totalCount = await placeLinks.count()

  const wheelchairBtn = page.getByTestId('tag-filter-wheelchair')
  await wheelchairBtn.click()
  await expect(wheelchairBtn).toHaveAttribute('aria-pressed', 'true')

  // 필터 적용 후 로딩 완료 대기
  await expect(resultSection).toHaveAttribute('aria-busy', 'false', { timeout: 10000 })

  // wheelchair 필터는 결과를 줄이거나 동일해야 함 (데이터 소스에 무관)
  const filteredCount = await placeLinks.count()
  expect(filteredCount).toBeLessThanOrEqual(totalCount)

  // 필터 해제 시 원래 수로 복귀
  await wheelchairBtn.click()
  await expect(wheelchairBtn).toHaveAttribute('aria-pressed', 'false')
  await expect(placeLinks).toHaveCount(totalCount)
})

test('reset button clears active filters and URL query', async ({ page }) => {
  await page.goto('/?category=park&time=15&freeOnly=true&openNow=true&tags=outdoor,wifi&search=서울')

  await expect(page.getByTestId('active-filter-count')).toContainText('필터 7')
  await expect(page.getByTestId('free-only-filter')).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByTestId('open-now-filter')).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByTestId('tag-filter-outdoor')).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByTestId('tag-filter-wifi')).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByTestId('place-search-input')).toHaveValue('서울')

  await page.getByTestId('reset-filters-button').click()

  await expect(page.getByTestId('active-filter-count')).toBeHidden()
  await expect(page.getByTestId('free-only-filter')).toHaveAttribute('aria-pressed', 'false')
  await expect(page.getByTestId('open-now-filter')).toHaveAttribute('aria-pressed', 'false')
  await expect(page.getByTestId('tag-filter-outdoor')).toHaveAttribute('aria-pressed', 'false')
  await expect(page.getByTestId('tag-filter-wifi')).toHaveAttribute('aria-pressed', 'false')
  await expect(page.getByTestId('place-search-input')).toHaveValue('')
  expect(new URL(page.url()).search).toBe('')
})

test('URL restores time and tag filters on reload', async ({ page }) => {
  await page.goto('/?time=20&tags=indoor')

  await expect(page.getByTestId('active-filter-count')).toContainText('필터 2')
  await expect(page.getByRole('button', { name: '20분 이내' })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByTestId('tag-filter-indoor')).toHaveAttribute('aria-pressed', 'true')
})
