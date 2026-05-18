import { NextResponse } from 'next/server'
import { featureFlags } from '@/lib/config/feature-flags'
import { getMockRealtime } from '@/lib/mock/realtime'
import type { ApiResponse } from '@/lib/types/api'
import type { RealtimeSignal } from '@/lib/types/realtime'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ areaCode: string }> },
) {
  const { areaCode } = await params

  if (!featureFlags.realtimeCityData) {
    const signal = getMockRealtime(areaCode)
    const body: ApiResponse<RealtimeSignal> = { data: signal, isMock: true }
    return NextResponse.json(body)
  }

  // TODO(P5): ENABLE_REALTIME_CITY_DATA=true 시 서울 열린데이터광장 citydata_ppltn 호출
  // TODO(P1): 실제 API 샘플 확보 후 congestionLevel 필드 경로 확정. 현재 mock fallback 사용
  const signal = getMockRealtime(areaCode)
  const body: ApiResponse<RealtimeSignal> = { data: signal, isMock: true }
  return NextResponse.json(body)
}
