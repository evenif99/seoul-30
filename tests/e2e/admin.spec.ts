import { expect, test } from '@playwright/test'

// ADMIN_SECRET가 설정되지 않은 테스트 환경에서 /admin은 공개 상태
test('admin page renders diagnostics without secret (public mode)', async ({ page }) => {
  await page.goto('/admin')

  await expect(page.getByRole('heading', { name: /운영 현황/i })).toBeVisible()

  // 피처 플래그 섹션 존재
  await expect(page.getByText('피처 플래그')).toBeVisible()

  // 장소 데이터 섹션 존재
  await expect(page.getByText('장소 데이터')).toBeVisible()
})

// 잘못된 secret이 있어도 ADMIN_SECRET 미설정이면 공개 접근 가능
test('admin page is accessible with any secret when ADMIN_SECRET is not set', async ({ page }) => {
  await page.goto('/admin?secret=random-value')

  await expect(page.getByRole('heading', { name: /운영 현황/i })).toBeVisible()
})
