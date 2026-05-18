// 서버 사이드 전용 — 클라이언트 컴포넌트에서 import 금지
export const env = {
  SEOUL_OPEN_API_KEY: process.env.SEOUL_OPEN_API_KEY ?? '',
  DATABASE_URL: process.env.DATABASE_URL ?? '',
  USE_MOCK_DATA: process.env.USE_MOCK_DATA !== 'false',
  ENABLE_REALTIME_CITY_DATA: process.env.ENABLE_REALTIME_CITY_DATA === 'true',
  ENABLE_CULTURE_EVENTS_API: process.env.ENABLE_CULTURE_EVENTS_API === 'true',
} as const
