import { NextResponse } from 'next/server'
import { featureFlags } from '@/lib/config/feature-flags'
import { getMockRealtime } from '@/lib/mock/realtime'
import { fetchSeoulCongestion } from '@/lib/adapters/seoul-citydata.adapter'
import type { ApiResponse } from '@/lib/types/api'
import type { RealtimeSignal } from '@/lib/types/realtime'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ areaCode: string }> },
) {
  const { areaCode } = await params

  if (featureFlags.realtimeCityData) {
    const signal = await fetchSeoulCongestion(areaCode)
    if (signal) {
      const body: ApiResponse<RealtimeSignal> = { data: signal, isMock: false }
      return NextResponse.json(body)
    }
  }

  const signal = getMockRealtime(areaCode)
  const body: ApiResponse<RealtimeSignal> = { data: signal, isMock: true }
  return NextResponse.json(body)
}
