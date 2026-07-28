import type { Phase, Session } from './types'

/**
 * 세션 시간 파생 (handoff §세션 상태 머신 · §상태 5 정산).
 *
 * 저장되는 phase는 GM이 누른 굵은 단계뿐이다.
 *   before → opening → live → settling → after → night → finale
 * 오프닝 40초와 정산 125초의 세부 구간은 시작 시각에서 계산한다.
 * 서버 티커가 없으므로 세 클라이언트가 같은 값을 같은 순간에 얻는다 —
 * "정산 시퀀스는 프레임 동기" 요구를 폴링 없이 만족시킨다.
 */

export const OPENING_SECONDS = 40

/** 정산 구간 (기본 125초). 빠른 정산은 같은 비율로 압축한 60초 변형. */
export const SETTLE_STAGES = [
  { stage: 'countdown', phase: 'settling', seconds: 5 },
  { stage: 'total', phase: 'total', seconds: 15 },
  { stage: 'return', phase: 'return', seconds: 15 },
  { stage: 'spotlight', phase: 'spotlight', seconds: 60 },
  { stage: 'badgesum', phase: 'badgesum', seconds: 10 },
  { stage: 'growth', phase: 'growth', seconds: 8 },
  { stage: 'wrap', phase: 'growth', seconds: 12 },
] as const

export type SettleStage = (typeof SETTLE_STAGES)[number]['stage']

export const SETTLE_TOTAL_SECONDS = SETTLE_STAGES.reduce((a, s) => a + s.seconds, 0)
export const FAST_SETTLE_SECONDS = 60

export interface DerivedPhase {
  phase: Phase
  /** 정산 중일 때의 세부 구간. 'wrap'은 촬영·내보내기용 정지 화면. */
  stage: SettleStage | null
  /** 현재 구간 안에서 흐른 초 */
  inStage: number
  /** 현재 구간 길이(초) */
  stageLength: number
  /** 오프닝 진행도 0–1 */
  openingProgress: number
}

function elapsed(from: string | null, now: number): number {
  if (!from) return 0
  return Math.max(0, (now - Date.parse(from)) / 1000)
}

/**
 * 스포트라이트 후보가 0명이면 해당 구간을 통째로 생략한다 (§상태 5).
 */
export function settlePlan(session: Session): { stage: SettleStage; phase: Phase; seconds: number }[] {
  const skipSpotlight = session.spotlight.length === 0
  const base = SETTLE_STAGES.filter((s) => !(skipSpotlight && s.stage === 'spotlight'))
  const baseTotal = base.reduce((a, s) => a + s.seconds, 0)
  const scale = session.fastSettle ? FAST_SETTLE_SECONDS / baseTotal : 1
  return base.map((s) => ({ stage: s.stage, phase: s.phase as Phase, seconds: s.seconds * scale }))
}

export function derivePhase(session: Session, now: number = Date.now()): DerivedPhase {
  const empty: DerivedPhase = {
    phase: session.phase,
    stage: null,
    inStage: 0,
    stageLength: 0,
    openingProgress: 0,
  }

  if (session.phase === 'opening') {
    const t = elapsed(session.openingStartedAt, now)
    if (t >= OPENING_SECONDS) return { ...empty, phase: 'live', openingProgress: 1 }
    return { ...empty, phase: 'opening', inStage: t, stageLength: OPENING_SECONDS, openingProgress: t / OPENING_SECONDS }
  }

  if (session.phase === 'settling') {
    const t = elapsed(session.settleStartedAt, now)
    let acc = 0
    for (const s of settlePlan(session)) {
      if (t < acc + s.seconds) {
        return { phase: s.phase, stage: s.stage, inStage: t - acc, stageLength: s.seconds, openingProgress: 1 }
      }
      acc += s.seconds
    }
    return { ...empty, phase: 'after' }
  }

  return empty
}

/** 남은 원정 시간(초). 음수가 되지 않는다 — 상실 연출을 만들지 않기 위해. */
export function remainingSeconds(session: Session, now: number = Date.now()): number {
  if (!session.endsAt) return 0
  return Math.max(0, Math.round((Date.parse(session.endsAt) - now) / 1000))
}

export function crisisSeconds(session: Session, now: number = Date.now()): number {
  if (!session.crisis.endsAt) return 0
  return Math.max(0, Math.round((Date.parse(session.crisis.endsAt) - now) / 1000))
}

export function toolSeconds(session: Session, now: number = Date.now()): number {
  if (!session.toolOverlay.endsAt) return 0
  return Math.max(0, Math.round((Date.parse(session.toolOverlay.endsAt) - now) / 1000))
}

export function formatClock(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}
