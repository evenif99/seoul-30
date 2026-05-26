// 서버 사이드 전용 — 클라이언트 컴포넌트에서 import 금지
export const env = {
  SEOUL_OPEN_API_KEY: process.env.SEOUL_OPEN_API_KEY ?? '',
  TOUR_API_KEY: process.env.TOUR_API_KEY ?? '',
  DATABASE_URL: process.env.DATABASE_URL ?? '',
  USE_MOCK_DATA: process.env.USE_MOCK_DATA !== 'false',
  ENABLE_REALTIME_CITY_DATA: process.env.ENABLE_REALTIME_CITY_DATA === 'true',
  ENABLE_CULTURE_EVENTS_API: process.env.ENABLE_CULTURE_EVENTS_API === 'true',
  ADMIN_SECRET: process.env.ADMIN_SECRET ?? '',   // 미설정 시 /admin 공개
} as const

// 런타임 시작 시 필수 환경변수 존재 여부를 검증한다.
// 빌드 타임이 아닌 /api/health 요청 시점에 호출해 fast-fail 메시지를 제공한다.
export function validateEnv(): void {
  const errors: string[] = []

  if (!process.env.DATABASE_URL) {
    errors.push('DATABASE_URL is required')
  }

  if (process.env.ENABLE_CULTURE_EVENTS_API === 'true' && !process.env.SEOUL_OPEN_API_KEY) {
    errors.push('SEOUL_OPEN_API_KEY is required when ENABLE_CULTURE_EVENTS_API=true')
  }

  if (process.env.ENABLE_CULTURE_EVENTS_API === 'true' && !process.env.TOUR_API_KEY) {
    errors.push('TOUR_API_KEY is required when ENABLE_CULTURE_EVENTS_API=true')
  }

  if (process.env.VAPID_PUBLIC_KEY && !process.env.VAPID_PRIVATE_KEY) {
    errors.push('VAPID_PRIVATE_KEY is required when VAPID_PUBLIC_KEY is set')
  }

  if (process.env.VAPID_PRIVATE_KEY && !process.env.VAPID_PUBLIC_KEY) {
    errors.push('VAPID_PUBLIC_KEY is required when VAPID_PRIVATE_KEY is set')
  }

  if (errors.length > 0) {
    throw new Error(
      `[env] Configuration error:\n${errors.map((e) => `  • ${e}`).join('\n')}`
    )
  }
}
