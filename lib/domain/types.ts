/**
 * 말랑스쿨 도메인 타입.
 *
 * 세계 구조 (handoff §세계 구조와 도메인 모델)
 *   대륙 └ 나라(학년 기수) └ 영지(학교) └ 마을(반) ├ 상회(과목별 일터) └ 원정대 └ 말랑이
 *                                                  └ (마을 바깥) 원정지
 */

/** 5분야 마스터 분류표의 축. 모든 시스템이 이 키를 참조한다. */
export type FieldKey = 'inquiry' | 'making' | 'care' | 'challenge' | 'steady'

/** 진화 형태 5종 (§2.2). 형태 간 우열 없음. */
export type EvolutionForm = 'base' | 'book' | 'tinker' | 'warm' | 'fire' | 'sprout'

/** 클래스 5직 — 한 직이 빠지면 못 하는 일이 생긴다. */
export type ClassRole = 'scout' | 'maker' | 'herald' | 'vanguard' | 'warden'

/** 표정 8종. 부정 감정 표정은 이 세계에 존재하지 않는다. */
export type Face = 'base' | 'glad' | 'full' | 'focus' | 'surprise' | 'star' | 'sleepy' | 'sleep'

/** 악세서리는 머리 위 한 슬롯. */
export type Accessory = '' | 'ribbon' | 'crown' | 'starpin' | 'strawhat' | 'sprout' | 'goggle' | 'glasses' | 'scarf'

/** 원정 유형 7종 — 진행 시각화가 유형마다 다르다. */
export type ExpeditionType = 'explore' | 'search' | 'breach' | 'repair' | 'carry' | 'decode' | 'raid'

/** 의뢰 계열. 색과 계열 아이콘이 고정 결합된다. */
export type QuestKind = 'main' | 'side' | 'guild' | 'flash'

/** 의뢰 카드 상태 4종 (§S3). */
export type QuestStatus = 'open' | 'doing' | 'delivering' | 'solved'

/** 세션(한 차시) 상태 머신 (handoff §세션 상태 머신). */
export type Phase =
  | 'before'
  | 'opening'
  | 'live'
  | 'settling'
  | 'total'
  | 'return'
  | 'spotlight'
  | 'badgesum'
  | 'growth'
  | 'after'
  | 'night'
  | 'finale'

/** 학생 화면의 장소. 원정 중에는 라우터가 이 값을 무시한다. */
export type Place = 'plaza' | 'board' | 'hall' | 'shop' | 'room' | 'lake' | 'map' | 'spring' | 'field'

export type Weather = '맑음' | '구름 조금' | '별똥별 소나기'

export type BadgeTier = 0 | 1 | 2 | 3 // 없음 → 기본 → 반짝 → 빛나는

/** 마을 건물. 5분야와 1:1로 붙는다. 각 4단계 성장. */
export type BuildingKey = 'library' | 'workshop' | 'plaza' | 'lighthouse' | 'garden'

// ─────────────────────────────────────────────────────────
// 영속 상태 — 말랑이의 것. 학년·학기·교사가 바뀌어도 말랑 코드로 이어짐.
// ─────────────────────────────────────────────────────────
export interface Mallang {
  id: string
  /** 말랑 코드 — 학생 식별의 유일한 키. 실명·이메일 없음 (§3-5). */
  code: string
  name: string
  bodyColor: string
  xp: number
  level: number
  badges: Record<FieldKey, BadgeTier>
  evolutionForm: EvolutionForm
  accessories: Accessory[]
  wearing: Accessory
  classRole: ClassRole
  villageId: string
  hallId: string
  createdAt: string

  /**
   * 아래 네 값은 스포트라이트 후보 산정과 소외 감지에만 쓰는 내부 지표다.
   * 어떤 학생 화면에도, 어떤 비교 형태로도 표시하지 않는다 (§3-1).
   */
  recentAvg: number
  deliveredToday: number
  lastSpotlightAt: string | null
  lastAwardAt: string | null
}

export interface Praise {
  id: string
  mallangId: string
  field: FieldKey
  text: string
  /** gm = GM 리모컨, peer = 하트, world = 시스템 */
  source: 'gm' | 'peer' | 'world'
  /** 정산 전까지 학생에게 보이지 않는다 (§T4). */
  revealed: boolean
  createdAt: string
}

export interface Discovery {
  id: string
  mallangId: string | null
  villageId: string
  name: string
  kind: 'map' | 'seed' | 'note' | 'rubbing'
  createdAt: string
}

export interface Letter {
  id: string
  mallangId: string
  from: string
  body: string
  read: boolean
  createdAt: string
}

// ─────────────────────────────────────────────────────────
// 시즌 상태 — 무대의 것. 학기 단위 리셋, 몽글은 전액 이월.
// ─────────────────────────────────────────────────────────
export interface Village {
  id: string
  estateId: string
  name: string
  season: number
  buildings: Record<BuildingKey, 1 | 2 | 3 | 4>
  amenities: string[]
  monuments: string[]
  /** 길드 게이지 n/24 */
  guildProgress: number
  guildGoal: number
  mongle: number
  weather: Weather
  examMode: boolean
  /** 첫 사용 = 빈 터 + 캠프 (§6) */
  founded: boolean
}

export interface Hall {
  id: string
  villageId: string
  name: string
  subject: string
  teacherKey: string
}

export interface ExpeditionSite {
  id: string
  villageId: string
  name: string
  type: ExpeditionType
  /** 단원 = 원정지 하나, 차시 = 그 원정지의 구간 하나. */
  segments: { name: string; progress: number; done: boolean }[]
  unlocked: boolean
  cleared: boolean
}

// ─────────────────────────────────────────────────────────
// 의뢰
// ─────────────────────────────────────────────────────────
export interface Quest {
  id: string
  hallId: string
  kind: QuestKind
  field: FieldKey
  title: string
  /** 터줏말랑 키 */
  client: FieldKey
  /** 사정 · 부탁 · 약속 3부 문구 (§S3) */
  story: { situation: string; request: string; promise: string }
  reward: { mongle: number; xp: number }
  checklist: [string, string, string]
  verification: 'gm' | 'auto'
  /** 의뢰 만료 (학생 어휘에서 '마감' 금지) */
  expiresAt: string | null
  carriedOver: boolean
  createdAt: string
}

export interface QuestProgress {
  questId: string
  mallangId: string
  status: QuestStatus
  photoUrl: string | null
  checks: [boolean, boolean, boolean]
  /** 승인 시 터줏말랑 답장이 카드에 도착 */
  reply: string | null
  updatedAt: string
}

// ─────────────────────────────────────────────────────────
// 세션 — 한 차시. 세 클라이언트가 공유하는 하나의 실시간 상태.
// ─────────────────────────────────────────────────────────
export interface CrisisState {
  active: boolean
  kind: 'fog' | 'raid'
  label: string
  counter: number
  goal: number
  /** 라운드 타이머 종료 시각. 남은 초는 파생값이다. */
  endsAt: string | null
  /** 미달로 끝났을 때의 차분한 마무리 상태 */
  settled: 'none' | 'cleared' | 'calmed'
}

export interface SpotlightCard {
  mallangId: string
  name: string
  bodyColor: string
  form: EvolutionForm
  field: FieldKey
  /** 한 줄 근거 */
  reason: string
}

/**
 * 세 클라이언트가 공유하는 하나의 세션 상태.
 *
 * 시간에 관한 값은 전부 "종료 시각"으로 저장하고 남은 초는 파생시킨다.
 * 서버 티커 없이도 C1·교사·학생의 정산 시퀀스가 프레임 단위로 맞는다.
 */
export interface Session {
  id: string
  hallId: string
  villageId: string
  /** 저장되는 굵은 phase. 정산 세부 구간은 settleStartedAt에서 파생된다. */
  phase: Phase
  siteId: string
  segmentIndex: number
  expeditionType: ExpeditionType
  /** 구간 진행도 0–100. 제출 1건마다 실시간 반영. */
  prog: number
  crisis: CrisisState
  /** 원정 종료 예정 시각 */
  endsAt: string | null
  /** 오프닝 시작 시각 (40초 시퀀스) */
  openingStartedAt: string | null
  /** 정산 시작 시각 */
  settleStartedAt: string | null
  /** 빠른 정산 60초 변형 */
  fastSettle: boolean
  spotlight: SpotlightCard[]
  hearts: { id: number; left: string; size: number }[]
  /** 복구형 원정은 제출 사진 URL을 구조물 파츠로 직접 렌더 */
  repairParts: (string | null)[]
  nightIndex: number
  finaleStep: number
  freeTime: 'closed' | 'all' | 'delivered'
  toolOverlay: { kind: '' | 'timer' | 'raffle' | 'party'; endsAt: string | null; raffleName: string }
  updatedAt: string
}

/** 세 클라이언트가 구독하는 하나의 스냅샷. */
export interface WorldSnapshot {
  village: Village
  halls: Hall[]
  sites: ExpeditionSite[]
  session: Session
  mallangs: Mallang[]
  quests: Quest[]
  progress: QuestProgress[]
  praises: Praise[]
  discoveries: Discovery[]
  letters: Letter[]
  /** GM 리모컨 일일 한도 잔여 */
  gmAwardsRemaining: number
  version: number
}
