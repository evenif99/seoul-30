import { env } from './env'

export const featureFlags = {
  useMockData: env.USE_MOCK_DATA,
  realtimeCityData: env.ENABLE_REALTIME_CITY_DATA,
  cultureEventsApi: env.ENABLE_CULTURE_EVENTS_API,
} as const
