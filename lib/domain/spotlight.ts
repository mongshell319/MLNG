import type { FieldKey, Mallang, QuestProgress, SpotlightCard, WorldSnapshot } from './types'
import { FIELD_BY_KEY, FIELDS } from './master'

/**
 * 스포트라이트 후보 산정 (handoff §11 · §데이터 페칭).
 *
 * "이번 주 제출 최다"로 뽑으면 잘하고 빠른 학생이 독식한다.
 * 그래서 절대량이 아니라 (1) 최근 4주 평균 대비 본인의 증가분과
 * (2) 그동안 무대에 오르지 못한 정도를 더해 정렬한다.
 * 어느 값도 학생에게 노출되지 않는다.
 */

const WEEK = 7 * 24 * 60 * 60 * 1000

export interface Candidate {
  mallang: Mallang
  /** 본인 증가분 */
  lift: number
  /** 미노출 가중 */
  overdue: number
  score: number
  reason: string
}

function weeksSince(iso: string | null, now: number): number {
  if (!iso) return 8 // 한 번도 오르지 못한 학생에게 가장 큰 가중
  return Math.min(8, (now - Date.parse(iso)) / WEEK)
}

export function rankCandidates(
  mallangs: Mallang[],
  progress: QuestProgress[],
  now: number = Date.now(),
): Candidate[] {
  const solvedBy = new Map<string, number>()
  for (const p of progress) {
    if (p.status === 'solved') solvedBy.set(p.mallangId, (solvedBy.get(p.mallangId) ?? 0) + 1)
  }

  return mallangs
    .map((m) => {
      const today = solvedBy.get(m.id) ?? m.deliveredToday
      const lift = today - m.recentAvg
      const overdue = weeksSince(m.lastSpotlightAt, now) * 0.35
      return {
        mallang: m,
        lift,
        overdue,
        score: lift + overdue,
        reason: reasonFor(m, lift, overdue),
      }
    })
    .filter((c) => (solvedBy.get(c.mallang.id) ?? c.mallang.deliveredToday) > 0)
    .sort((a, b) => b.score - a.score)
}

/**
 * 한 줄 근거.
 *
 * 카드 다섯 장이 같은 문장을 달고 있으면 그건 아무 말도 하지 않은 것이다.
 * 그래서 (무엇이 눈에 띄었나) × (어느 분야인가)로 갈라서 각자의 말을 준다.
 * 우수의 언어는 쓰지 않는다 (§3-2) — 잘했다가 아니라 무엇을 했나를 적는다.
 */
type Situation = 'lift' | 'first' | 'steadfast' | 'growing' | 'finished'

const REASONS: Record<Situation, Record<FieldKey, string>> = {
  // 평소 자기 몫보다 눈에 띄게 더 간 날
  lift: {
    inquiry: '오늘은 질문을 한 번 더 들고 갔어요',
    making: '평소보다 한 번 더 고쳐 봤어요',
    care: '오늘은 옆자리까지 챙겼어요',
    challenge: '먼저 나서 본 날이에요',
    steady: '평소보다 한 걸음 더 갔어요',
  },
  // 한 번도 무대에 오른 적 없는 사람
  first: {
    inquiry: '묻고 싶은 걸 계속 적어 두고 있었어요',
    making: '만들던 걸 오늘 끝냈어요',
    care: '조용히 옆을 도와 온 사람이에요',
    challenge: '오늘 처음으로 앞에 나왔어요',
    steady: '빠진 날 없이 여기까지 왔어요',
  },
  // 오래 무대에 못 올랐지만 계속해 온 사람
  steadfast: {
    inquiry: '한동안 혼자 파고들고 있었어요',
    making: '손이 계속 움직이고 있었어요',
    care: '티 안 나게 계속 거들어 왔어요',
    challenge: '조용히 준비하고 있었어요',
    steady: '한동안 조용히 계속 해 왔어요',
  },
  // 그 분야 뱃지를 모아 가는 중
  growing: {
    inquiry: '질문이 점점 깊어지고 있어요',
    making: '만드는 게 점점 손에 붙었어요',
    care: '같이 하는 게 편해졌어요',
    challenge: '나서는 게 덜 무서워졌대요',
    steady: '하던 걸 계속 이어 가고 있어요',
  },
  // 오늘 끝까지 간 사람
  finished: {
    inquiry: '끝까지 알아보고 왔어요',
    making: '오늘 것을 마무리했어요',
    care: '끝날 때까지 같이 있었어요',
    challenge: '끝까지 밀고 갔어요',
    steady: '오늘 것을 끝까지 했어요',
  },
}

function situationOf(m: Mallang, lift: number, overdue: number): Situation {
  if (lift >= 1.5) return 'lift'
  if (m.lastSpotlightAt === null) return 'first'
  if (overdue >= 2) return 'steadfast'
  if (m.badges[fieldOf(m)] >= 2) return 'growing'
  return 'finished'
}

/** 우선순위. 같은 문장이 겹치면 이 순서로 다음 것을 찾는다. */
const SITUATION_ORDER: Situation[] = ['lift', 'first', 'steadfast', 'growing', 'finished']

function reasonFor(m: Mallang, lift: number, overdue: number, taken?: Set<string>): string {
  const primary = situationOf(m, lift, overdue)
  const field = fieldOf(m)
  const first = REASONS[primary][field]
  if (!taken || !taken.has(first)) {
    taken?.add(first)
    return first
  }
  // 무대는 다섯 장이 나란히 놓인다. 같은 문장이 둘이면 아무 말도 안 한 것이 된다.
  for (const s of SITUATION_ORDER) {
    const alt = REASONS[s][field]
    if (!taken.has(alt)) {
      taken.add(alt)
      return alt
    }
  }
  return first
}

function fieldOf(m: Mallang) {
  const owned = FIELDS.filter((f) => m.badges[f.key] > 0)
  if (owned.length === 0) return FIELDS[0].key
  return owned.reduce((a, b) => (m.badges[b.key] > m.badges[a.key] ? b : a)).key
}

/** 카드 3–5장. 후보가 없으면 빈 배열 — 해당 정산 구간이 생략된다. */
export function pickSpotlight(snapshot: WorldSnapshot, now: number = Date.now()): SpotlightCard[] {
  const ranked = rankCandidates(snapshot.mallangs, snapshot.progress, now)
  if (ranked.length === 0) return []
  const taken = new Set<string>()
  return ranked.slice(0, 5).map((c) => ({
    mallangId: c.mallang.id,
    name: c.mallang.name,
    bodyColor: c.mallang.bodyColor,
    form: c.mallang.evolutionForm,
    field: fieldOf(c.mallang),
    reason: reasonFor(c.mallang, c.lift, c.overdue, taken),
  }))
}

/**
 * 소외 감지 (§T4). 칭찬 수신 공백 · 스포트라이트 미노출 학생을 찾아
 * 근거 제안을 붙여 교사 본인에게만 보여 준다.
 */
export function detectOverlooked(snapshot: WorldSnapshot, now: number = Date.now()) {
  const praiseByMallang = new Map<string, number>()
  for (const p of snapshot.praises) praiseByMallang.set(p.mallangId, (praiseByMallang.get(p.mallangId) ?? 0) + 1)

  return snapshot.mallangs
    .map((m) => ({
      mallang: m,
      weeksUnseen: weeksSince(m.lastSpotlightAt, now),
      weeksUnpraised: weeksSince(m.lastAwardAt, now),
      praises: praiseByMallang.get(m.id) ?? 0,
      suggestion: suggestionFor(m),
    }))
    .filter((r) => r.weeksUnseen >= 3 || r.weeksUnpraised >= 3)
    .sort((a, b) => b.weeksUnseen + b.weeksUnpraised - (a.weeksUnseen + a.weeksUnpraised))
    .slice(0, 4)
}

function suggestionFor(m: Mallang): { field: (typeof FIELDS)[number]['key']; text: string } {
  const f = FIELD_BY_KEY[fieldOf(m)]
  if (m.deliveredToday > 0) return { field: 'steady', text: '3주 연속 완수 — 꾸준함 후보로 어울려요' }
  if (m.badges[f.key] > 0) return { field: f.key, text: `${f.label} 쪽 뱃지를 모으는 중이에요` }
  return { field: 'care', text: '옆자리를 자주 돕는 편이에요' }
}

/**
 * 분포 거울 (§T4). "최근 4주 리모컨 수여의 n%가 m명에게 갔어요".
 * 중립적 톤이며 교사 본인에게만 보인다.
 */
export function awardMirror(snapshot: WorldSnapshot): { share: number; people: number; total: number } {
  const gm = snapshot.praises.filter((p) => p.source === 'gm')
  if (gm.length === 0) return { share: 0, people: 0, total: 0 }
  const counts = new Map<string, number>()
  for (const p of gm) counts.set(p.mallangId, (counts.get(p.mallangId) ?? 0) + 1)
  const sorted = [...counts.values()].sort((a, b) => b - a)
  const people = Math.min(5, sorted.length)
  const top = sorted.slice(0, people).reduce((a, b) => a + b, 0)
  return { share: Math.round((top / gm.length) * 100), people, total: gm.length }
}
