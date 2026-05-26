/**
 * ADMIN_SECRET 기반 /admin 페이지 접근 제어 유틸리티.
 * ADMIN_SECRET 환경변수가 설정되지 않은 경우 페이지는 공개 접근 허용 (하위 호환).
 */

/**
 * `secret` 파라미터가 ADMIN_SECRET 환경변수와 일치하는지 확인합니다.
 * - ADMIN_SECRET 미설정 → 항상 true (공개)
 * - ADMIN_SECRET 설정 + secret 일치 → true
 * - ADMIN_SECRET 설정 + secret 불일치/미제공 → false
 */
export function isAdminAuthorized(secret: string | undefined): boolean {
  const required = process.env.ADMIN_SECRET ?? ''
  if (!required) return true          // 환경변수 미설정 → 공개
  return secret === required
}
