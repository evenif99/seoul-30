import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.tsx'],
    include: ['tests/unit/**/*.{test,spec}.{ts,tsx}', 'tests/components/**/*.{test,spec}.{ts,tsx}'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
      '@tests': path.resolve(__dirname, 'tests'),
      // next-intl은 Next.js 플러그인 컨텍스트가 필요하다.
      // 테스트 환경에서는 mock 모듈로 대체해 초기화 실패를 방지한다.
      'next-intl': path.resolve(__dirname, 'tests/__mocks__/next-intl.tsx'),
      'next-intl/server': path.resolve(__dirname, 'tests/__mocks__/next-intl-server.ts'),
    },
  },
})
