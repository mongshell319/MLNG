import type { Identity } from '@/lib/server/auth'
import type { Action } from './actions'
import type { WorldSnapshot } from './types'

/**
 * 액션 권한.
 *
 * 리듀서는 "무슨 일이 일어나는가"만 안다. "누가 그걸 할 수 있는가"는 여기서 정한다.
 * 두 관심사를 섞지 않아야 리듀서를 그대로 테스트할 수 있다.
 *
 * 기본은 거부다. 새 액션을 추가하면 여기 등록하기 전까지는 아무도 못 부른다.
 */

/** GM만 움직일 수 있는 것 — 세션·검증·리모컨·시즌 */
const GM_ONLY: Action['type'][] = [
  'session.open',
  'session.live',
  'session.settle',
  'session.after',
  'session.night',
  'session.finale',
  'session.reset',
  'crisis.start',
  'crisis.end',
  'tool.open',
  'tool.close',
  'freetime.set',
  'verify.approve',
  'verify.reject',
  'verify.approveAll',
  'gm.award',
  'praise.reveal',
  'quest.publish',
  'season.weather',
  'season.exam',
  'village.found',
  'hall.open',
  'mallang.class',
]

/** 클래스 스크린이 자기 연출을 진행시키는 것 — 그 외에는 읽기만 한다 */
const SCREEN_ONLY: Action['type'][] = ['session.nightStep', 'session.finaleStep']

/**
 * 학생이 자기 말랑이에 대해 하는 것. 액션이 가리키는 mallangId가 본인이어야 한다.
 *
 * quest.photo 는 일부러 빠져 있다. 사진 경로는 서버(/api/upload)만 만든다 —
 * 클라이언트가 임의의 주소를 넣으면 그게 교실 TV와 교사 검증함에 그대로 걸린다.
 */
const STUDENT_SELF: Action['type'][] = [
  'quest.accept',
  'quest.check',
  'quest.deliver',
  'quest.retry',
  'mallang.wear',
  'mallang.form',
  'shop.buySnack',
  'shop.buyAccessory',
  'gather.catch',
  'field.classAction',
]

export type AuthzResult = { ok: true } | { ok: false; status: 401 | 403; reason: string }

const DENY = (status: 401 | 403, reason: string): AuthzResult => ({ ok: false, status, reason })

export function authorize(action: Action, identity: Identity | null, snapshot: WorldSnapshot): AuthzResult {
  if (!identity) return DENY(401, '입장이 필요해요')
  if (identity.villageId !== snapshot.village.id) return DENY(403, '다른 마을의 일이에요')

  if (identity.kind === 'gm') {
    // GM은 자기 마을 안에서 GM 액션과 스크린 연출을 할 수 있다.
    if (GM_ONLY.includes(action.type) || SCREEN_ONLY.includes(action.type)) return { ok: true }
    return DENY(403, 'GM이 할 수 있는 일이 아니에요')
  }

  if (identity.kind === 'screen') {
    if (SCREEN_ONLY.includes(action.type)) return { ok: true }
    return DENY(403, '클래스 스크린은 보기만 해요')
  }

  // ── 학생 ────────────────────────────────────────────
  const me = snapshot.mallangs.find((m) => m.code === identity.code)
  if (!me) return DENY(401, '말랑이를 찾지 못했어요')

  if (STUDENT_SELF.includes(action.type)) {
    const target = (action as { mallangId?: string }).mallangId
    if (target !== me.id) return DENY(403, '다른 말랑이의 일이에요')
    return { ok: true }
  }

  // 하트는 남에게 보내는 것이므로 대상이 본인일 필요가 없다.
  // 대신 스포트라이트에 오른 말랑이에게만, 정산 중에만 보낼 수 있다.
  if (action.type === 'heart.send') {
    if (!snapshot.session.spotlight.some((c) => c.mallangId === action.mallangId)) {
      return DENY(403, '지금 보낼 수 있는 곳이 아니에요')
    }
    return { ok: true }
  }

  if (action.type === 'letter.read') {
    const letter = snapshot.letters.find((l) => l.id === action.letterId)
    if (!letter || letter.mallangId !== me.id) return DENY(403, '내 편지가 아니에요')
    return { ok: true }
  }

  // 마을 공동의 것 — 편의시설 투표는 누구나 한 표를 놓을 수 있다.
  if (action.type === 'gather.vote') return { ok: true }

  // mallang.create 는 입장 경로(/api/enter/student)에서만 일어난다.
  return DENY(403, '지금 할 수 있는 일이 아니에요')
}
