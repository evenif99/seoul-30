import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Seoul 30 — 30분 안에 갈 수 있는 장소 추천'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#1A6B5A',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'flex-end',
          padding: '72px 80px',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: 520,
            height: 520,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.06)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 80,
            right: 160,
            width: 280,
            height: 280,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.08)',
          }}
        />
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            marginBottom: 24,
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              background: 'rgba(255,255,255,0.18)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 28,
            }}
          >
            📍
          </div>
          <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: 22, letterSpacing: 2 }}>
            SEOUL 30
          </span>
        </div>
        <div
          style={{
            color: '#ffffff',
            fontSize: 56,
            fontWeight: 700,
            lineHeight: 1.15,
            marginBottom: 20,
            maxWidth: 700,
          }}
        >
          30분 안에 갈 수 있는
          <br />
          서울 공공장소 추천
        </div>
        <div
          style={{
            color: 'rgba(255,255,255,0.72)',
            fontSize: 24,
            lineHeight: 1.5,
            maxWidth: 620,
          }}
        >
          도서관 · 공원 · 문화공간 · 스포츠시설
        </div>
        <div
          style={{
            marginTop: 40,
            display: 'flex',
            gap: 12,
          }}
        >
          {['무료 우선', '혼잡도 반영', '대중교통 기준'].map((tag) => (
            <div
              key={tag}
              style={{
                background: 'rgba(255,255,255,0.14)',
                border: '1px solid rgba(255,255,255,0.22)',
                borderRadius: 100,
                padding: '8px 20px',
                color: 'rgba(255,255,255,0.88)',
                fontSize: 18,
              }}
            >
              {tag}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size },
  )
}
