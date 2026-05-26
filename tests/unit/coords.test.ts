import { describe, expect, it } from 'vitest'
import { toSeoulLatLng } from '@/lib/utils/coords'

describe('toSeoulLatLng', () => {
  // 정상 케이스
  it('유효한 서울 좌표 문자열을 파싱하여 반환한다', () => {
    const result = toSeoulLatLng('37.5665', '126.9780')  // 서울 시청
    expect(result).toEqual({ latitude: 37.5665, longitude: 126.9780 })
  })

  it('숫자 타입 좌표도 올바르게 처리한다', () => {
    const result = toSeoulLatLng(37.5665, 126.9780)
    expect(result).toEqual({ latitude: 37.5665, longitude: 126.9780 })
  })

  it('경계값 최솟값(latMin/lngMin)을 포함한 좌표를 허용한다', () => {
    const result = toSeoulLatLng(37.413, 126.734)
    expect(result).toEqual({ latitude: 37.413, longitude: 126.734 })
  })

  it('경계값 최댓값(latMax/lngMax)을 포함한 좌표를 허용한다', () => {
    const result = toSeoulLatLng(37.715, 127.270)
    expect(result).toEqual({ latitude: 37.715, longitude: 127.270 })
  })

  // 무효 좌표 — 빈 객체 반환
  it('undefined 입력 시 빈 객체를 반환한다', () => {
    expect(toSeoulLatLng(undefined, undefined)).toEqual({})
  })

  it('null 입력 시 빈 객체를 반환한다', () => {
    expect(toSeoulLatLng(null, null)).toEqual({})
  })

  it('0 좌표 시 빈 객체를 반환한다 (미보정 API 데이터)', () => {
    expect(toSeoulLatLng(0, 0)).toEqual({})
    expect(toSeoulLatLng('0', '0')).toEqual({})
  })

  it('lat만 0인 경우 빈 객체를 반환한다', () => {
    expect(toSeoulLatLng(0, 126.978)).toEqual({})
  })

  it('lng만 0인 경우 빈 객체를 반환한다', () => {
    expect(toSeoulLatLng(37.566, 0)).toEqual({})
  })

  it('빈 문자열 입력 시 빈 객체를 반환한다', () => {
    expect(toSeoulLatLng('', '')).toEqual({})
  })

  it('NaN 문자열 입력 시 빈 객체를 반환한다', () => {
    expect(toSeoulLatLng('abc', 'xyz')).toEqual({})
  })

  // 서울 경계 밖
  it('위도가 서울 경계 남쪽(수원 방향)이면 빈 객체를 반환한다', () => {
    expect(toSeoulLatLng(37.0, 127.0)).toEqual({})
  })

  it('위도가 서울 경계 북쪽(의정부 방향)이면 빈 객체를 반환한다', () => {
    expect(toSeoulLatLng(38.0, 127.0)).toEqual({})
  })

  it('경도가 서울 경계 서쪽이면 빈 객체를 반환한다', () => {
    expect(toSeoulLatLng(37.5, 126.5)).toEqual({})
  })

  it('경도가 서울 경계 동쪽이면 빈 객체를 반환한다', () => {
    expect(toSeoulLatLng(37.5, 128.0)).toEqual({})
  })

  // 문화공간 API 특수 케이스 (X_COORD = 위도, Y_COORD = 경도)
  it('문화공간 API 방향 전환 후 올바르게 처리한다', () => {
    // DDP: X_COORD=37.567, Y_COORD=127.009
    const result = toSeoulLatLng('37.567', '127.009')
    expect(result).toEqual({ latitude: 37.567, longitude: 127.009 })
  })
})
