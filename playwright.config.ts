import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  // CI에서 list reporter 사용: progress reporter 대비 Windows hang 빈도 낮음
  // 로컬에서도 list로 통일 — 테스트별 결과를 한 줄씩 즉시 출력
  reporter: 'list',
  expect: {
    timeout: 10_000,
  },
  use: {
    baseURL: 'http://localhost:3001',
    trace: 'on-first-retry',
    serviceWorkers: 'block',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3001',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      DATABASE_URL: process.env.DATABASE_URL ?? 'postgresql://ci:ci@localhost/ci',
      NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3001',
      USE_MOCK_DATA: 'true',
      ENABLE_REALTIME_CITY_DATA: 'false',
      ENABLE_CULTURE_EVENTS_API: 'false',
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
