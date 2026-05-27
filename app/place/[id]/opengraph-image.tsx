import { ImageResponse } from 'next/og'
import { getPlaceDetailData } from '@/lib/data/place-detail'

export const runtime = 'nodejs'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const CATEGORY_LABEL: Record<string, string> = {
  culture: 'Culture / Exhibition',
  library: 'Library',
  park: 'Park',
  sports: 'Sports',
  welfare: 'Community Center',
}

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { place } = await getPlaceDetailData(id)

  const name = place?.name ?? 'Seoul 30'
  const category = place ? (CATEGORY_LABEL[place.category] ?? place.category) : ''
  const district = place?.district ?? ''
  const isFree = place?.isFree ?? false

  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #1A6B5A 0%, #0F4035 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          padding: '64px',
          justifyContent: 'space-between',
        }}
      >
        {/* 상단: 브랜드 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              background: 'rgba(255,255,255,0.15)',
              borderRadius: '12px',
              padding: '8px 18px',
              color: '#A8D5CB',
              fontSize: '22px',
              fontWeight: 700,
              letterSpacing: '1px',
            }}
          >
            Seoul 30
          </div>
          <div style={{ color: '#A8D5CB', fontSize: '20px' }}>
            30분 생활권 추천
          </div>
        </div>

        {/* 중단: 장소 정보 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {category && (
              <div
                style={{
                  background: 'rgba(168,213,203,0.2)',
                  border: '1px solid rgba(168,213,203,0.4)',
                  borderRadius: '8px',
                  padding: '6px 14px',
                  color: '#A8D5CB',
                  fontSize: '18px',
                }}
              >
                {category}
              </div>
            )}
            {isFree && (
              <div
                style={{
                  background: 'rgba(168,213,203,0.2)',
                  border: '1px solid rgba(168,213,203,0.4)',
                  borderRadius: '8px',
                  padding: '6px 14px',
                  color: '#A8D5CB',
                  fontSize: '18px',
                }}
              >
                Free
              </div>
            )}
          </div>

          <div style={{ color: '#ffffff', fontSize: '56px', fontWeight: 700, lineHeight: 1.2 }}>
            {name}
          </div>

          {district && (
            <div style={{ color: '#A8D5CB', fontSize: '28px' }}>
              {district} · Seoul
            </div>
          )}
        </div>

        {/* 하단: 도메인 */}
        <div style={{ color: 'rgba(168,213,203,0.6)', fontSize: '18px' }}>
          seoul-30.vercel.app
        </div>
      </div>
    ),
    { ...size },
  )
}
