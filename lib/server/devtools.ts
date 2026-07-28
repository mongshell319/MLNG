/**
 * 시연 도구.
 *
 * 학생 스무 명이 전달하는 상황을 손으로 만들려면 브라우저 스무 개가 필요하다.
 * 그래서 서버가 대신 눌러 주는 경로를 둔다 — 다만 이건 남의 말랑이로 행동하는 것이므로
 * 권한 검사를 통째로 건너뛴다. 프로덕션에서는 절대 켜지면 안 된다.
 *
 * 개발에서는 기본으로 켜지고, 배포본에서 보려면 MLNG_DEMO_TOOLS=1 을 명시해야 한다.
 * (교실에 실제로 쓰는 서버라면 켜지 말 것 — 누구든 GM이면 반 전체를 조작할 수 있다.)
 */
export function devToolsEnabled(): boolean {
  if (process.env.MLNG_DEMO_TOOLS === '1') return true
  return process.env.NODE_ENV !== 'production'
}
