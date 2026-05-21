import { expect, test } from '@playwright/test'

test('admin page renders diagnostics', async ({ page }) => {
  await page.goto('/admin')

  await expect(page.getByRole('heading', { name: /운영 현황/i })).toBeVisible()

  // 피처 플래그 섹션 존재
  await expect(page.getByText('피처 플래그')).toBeVisible()

  // 장소 데이터 섹션 존재
  await expect(page.getByText('장소 데이터')).toBeVisible()
})
