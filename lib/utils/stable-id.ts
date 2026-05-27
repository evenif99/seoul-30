/**
 * 콘텐츠 기반 안정 ID 생성 유틸리티
 *
 * 배경: 기존 index 기반 ID(`ce-0-...`)는 API 응답 순서가 바뀌면 같은 장소가
 * 다른 ID를 가져 PlaceFeedback DB 매핑이 깨지는 BUG-03 문제가 있었다.
 *
 * FNV-1a 32비트 해시를 사용해 (prefix, 자치구, 이름, 보조키)의 조합으로
 * 순서에 무관한 안정적 ID를 생성한다.
 *
 * 알고리즘: FNV-1a (Fowler–Noll–Vo)
 *   - 순수 JS 구현 — Node.js crypto 또는 Edge Runtime 의존 없음
 *   - 32비트 → base36 → 최대 7자리 (충돌률: 500개 기준 약 0.003%)
 *   - 동기 실행 (map() 내에서 사용 가능)
 */

const FNV_OFFSET = 2166136261 // 32-bit FNV offset basis
const FNV_PRIME = 16777619     // 32-bit FNV prime

function fnv1a32(input: string): number {
  let hash = FNV_OFFSET
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i)
    // Math.imul: 32비트 정수 곱셈 (오버플로 안전)
    hash = Math.imul(hash, FNV_PRIME)
    hash >>>= 0 // 부호 없는 32비트로 정규화
  }
  return hash
}

/**
 * 안정 ID 생성.
 *
 * @param prefix - 소스 타입 접두사 ('ce', 'cs', 'lib', 'park', 'sport')
 * @param parts  - 고유성 보장을 위한 필드들 (자치구, 이름, 보조키 순서 권장)
 * @returns      - `${prefix}-${base36 hash}` 형식의 안정 ID
 *
 * @example
 *   stableId('lib', '강남구', '역삼도서관', '서울 강남구 역삼동')
 *   // → 'lib-1f2a3b4c'
 */
export function stableId(prefix: string, ...parts: string[]): string {
  const input = parts.join('|')
  const hash = fnv1a32(input)
  return `${prefix}-${hash.toString(36)}`
}
