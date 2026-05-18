import type { RealtimeSignal } from '@/lib/types/realtime'

// TODO(P1): 실시간 도시데이터 실제 API 샘플 확보 후 areaCode 값 확정
// 현재 district name을 임시 key로 사용
export const MOCK_REALTIME: Record<string, RealtimeSignal> = {
  성동구: {
    areaCode: 'SEONGDONG',
    areaName: '성동구',
    congestionLevel: '보통',
    congestionMessage: '사람이 몰려있을 수 있어요.',
    updatedAt: new Date().toISOString(),
    isMock: true,
  },
  종로구: {
    areaCode: 'JONGNO',
    areaName: '종로구',
    congestionLevel: '여유',
    congestionMessage: '사람이 적어 쾌적해요.',
    updatedAt: new Date().toISOString(),
    isMock: true,
  },
  강남구: {
    areaCode: 'GANGNAM',
    areaName: '강남구',
    congestionLevel: '약간붐빔',
    congestionMessage: '다소 붐벼요.',
    updatedAt: new Date().toISOString(),
    isMock: true,
  },
  마포구: {
    areaCode: 'MAPO',
    areaName: '마포구',
    congestionLevel: '여유',
    congestionMessage: '사람이 적어 쾌적해요.',
    updatedAt: new Date().toISOString(),
    isMock: true,
  },
  용산구: {
    areaCode: 'YONGSAN',
    areaName: '용산구',
    congestionLevel: '보통',
    congestionMessage: '사람이 몰려있을 수 있어요.',
    updatedAt: new Date().toISOString(),
    isMock: true,
  },
}

export function getMockRealtime(district: string): RealtimeSignal {
  return (
    MOCK_REALTIME[district] ?? {
      areaCode: district,
      areaName: district,
      congestionLevel: null,
      updatedAt: new Date().toISOString(),
      isMock: true,
    }
  )
}
