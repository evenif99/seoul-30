/**
 * KST(UTC+9) 기준 시간 유틸리티
 * scoring.ts(calcTimefit) 및 app/page.tsx(isOpenNow) 양쪽에서 공유하여
 * 시간 판정 로직의 단일 진실 공급원(single source of truth)을 유지한다.
 */

/** 현재 KST 시각을 자정 기준 분(0–1439)으로 반환. UTC+9 고정 오프셋 사용. */
export function kstCurrentMinutes(): number {
  const now = new Date()
  return (now.getUTCHours() * 60 + now.getUTCMinutes() + 9 * 60) % (24 * 60)
}

/**
 * "HH:MM" 형식 문자열을 자정 기준 분(0–1439)으로 파싱한다.
 * 파싱 실패(비표준 형식, 범위 초과) 시 null 반환.
 *
 * 허용: "9:00", "09:00", "23:59"
 * 거부: "09시", "오전 9:00", "09:00:00", ""
 */
export function parseHHMM(text: string): number | null {
  const m = text.match(/^(\d{1,2}):(\d{2})/)
  if (!m) return null
  const h = Number(m[1])
  const min = Number(m[2])
  if (h > 23 || min > 59) return null
  return h * 60 + min
}

/**
 * 현재 KST 시각이 [openText, closeText) 범위 내인지 판단한다.
 *
 * - 자정 넘김(closeTime <= openTime) 처리: 22:00–02:00 → cur >= 1320 || cur < 120
 * - 24시간 영업 특수 처리: openText === "00:00" && closeText === "23:59"
 * - 파싱 실패 시 false 반환 (닫힘 안전 처리)
 */
export function isCurrentlyOpen(openText: string, closeText: string): boolean {
  // 24시간 영업 특수 케이스
  if (openText === '00:00' && closeText === '23:59') return true

  const openMin = parseHHMM(openText)
  const closeMin = parseHHMM(closeText)

  // 파싱 실패 → 닫힘으로 처리 (이전 NaN 비교와 동일 결과, 명시적)
  if (openMin === null || closeMin === null) return false

  const cur = kstCurrentMinutes()

  // 자정 넘김: closeMin <= openMin (예: 22:00–02:00)
  if (closeMin <= openMin) {
    return cur >= openMin || cur < closeMin
  }

  return cur >= openMin && cur < closeMin
}
