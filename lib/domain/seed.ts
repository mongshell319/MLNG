import { BODY_TINTS, FIELDS, QUEST_TEMPLATES } from './master'
import type { ClassRole, Mallang, Quest, WorldSnapshot } from './types'

/**
 * 새 세계.
 *
 * 실제로 개설되는 마을은 비어 있다 — 학생이 아직 아무도 없고, 마을은 빈 터에 캠프만 있다.
 * "여기에 우리 마을이 세워져요" (§6 첫 사용)가 그 상태의 화면이다.
 *
 * demo: true 는 개발·시연용이다. 28명과 지난 기록이 이미 들어 있어
 * 정산·스포트라이트·물드는 밤을 혼자서도 돌려볼 수 있다.
 */

const NAMES = [
  '몽실구름', '복숭아젤리', '느긋한오리', '민트별', '도토리묵', '보름달빵', '들꽃하나', '조약돌',
  '노을빛', '초코쿠키', '풀잎배', '반짝이', '눈송이', '바람개비', '해바라기', '앵두',
  '뭉게구름', '별사탕', '소금빵', '단풍잎', '개울물', '따뜻한밤', '오후세시', '작은숲',
  '무지개떡', '이슬방울', '까치발', '동그라미',
]

/**
 * 시연용 말랑 코드.
 *
 * 반드시 서로 달라야 한다 — 코드가 곧 신원이라, 겹치면 뒤쪽 학생이 아예 입장하지 못한다.
 * 그래서 첫 글자와 끝 글자가 i를 그대로 실어 나른다(24 × 8 = 192명까지 유일).
 * 가운데 네 자리는 그저 코드처럼 보이기 위한 것이다.
 */
function demoCode(i: number): string {
  const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const D = '23456789'
  return (
    A[i % A.length] +
    A[(i * 13 + 5) % A.length] +
    D[(i * 3) % D.length] +
    D[(i * 5 + 2) % D.length] +
    A[(i * 11 + 3) % A.length] +
    D[Math.floor(i / A.length) % D.length]
  )
}

function demoMallangs(villageId: string, hallId: string, at: string): Mallang[] {
  const roles: ClassRole[] = FIELDS.map((f) => f.classRole)
  return NAMES.map((name, i) => ({
    id: `m-${i + 1}`,
    code: demoCode(i),
    name,
    bodyColor: BODY_TINTS[i % BODY_TINTS.length],
    xp: 120 + ((i * 37) % 400),
    level: 1 + ((i * 3) % 3),
    badges: {
      inquiry: ((i * 2) % 4) as 0 | 1 | 2 | 3,
      making: ((i * 3) % 3) as 0 | 1 | 2,
      care: ((i + 1) % 3) as 0 | 1 | 2,
      challenge: ((i * 5) % 2) as 0 | 1,
      steady: ((i + 2) % 4) as 0 | 1 | 2 | 3,
    },
    evolutionForm: 'base',
    accessories: [],
    wearing: '',
    classRole: roles[i % roles.length],
    villageId,
    hallId,
    createdAt: at,
    recentAvg: 0.6 + ((i % 5) * 0.2),
    deliveredToday: 0,
    lastSpotlightAt: i % 4 === 0 ? null : new Date(Date.parse(at) - (i % 6) * 7 * 86_400_000).toISOString(),
    lastAwardAt: i % 3 === 0 ? null : new Date(Date.parse(at) - (i % 5) * 7 * 86_400_000).toISOString(),
  }))
}

/** T1 온보딩의 "추천 의뢰 5종"이 이 목록이다. 새 마을도 첫날 쓸 것을 갖고 시작한다. */
function starterQuests(hallId: string, at: string, demo: boolean): Quest[] {
  const day = 24 * 60 * 60 * 1000
  const t = QUEST_TEMPLATES
  const base: Quest[] = [
    {
      id: 'q-main',
      hallId,
      kind: 'main',
      field: 'making',
      title: t[0].title,
      client: 'making',
      story: {
        situation: '공방 선반이 하나 흔들려서 어제부터 물건을 못 올리고 있어.',
        request: '점검표대로 세 군데만 봐 주면 돼. 오래 안 걸려.',
        promise: '봐 주면 저녁에 쓰는 등 하나 새로 달아 둘게.',
      },
      reward: { mongle: 12, xp: 60 },
      checklist: t[0].checklist,
      verification: 'gm',
      expiresAt: new Date(Date.parse(at) + 2 * day).toISOString(),
      carriedOver: false,
      createdAt: at,
    },
    {
      id: 'q-side-1',
      hallId,
      kind: 'side',
      field: 'inquiry',
      title: '창고에서 이상한 소리 찾기',
      client: 'inquiry',
      story: {
        situation: '창고 쪽에서 밤마다 딸깍 소리가 난대.',
        request: '뭐가 나는 소린지 한 번만 들여다봐 줄래?',
        promise: '알아내면 도서관 구석 자리 하나 내줄게.',
      },
      reward: { mongle: 8, xp: 35 },
      checklist: ['소리가 난 곳을 찾았어요', '이유를 한 줄 적었어요', '사진을 찍었어요'],
      verification: 'auto',
      expiresAt: new Date(Date.parse(at) + 3 * day).toISOString(),
      carriedOver: false,
      createdAt: at,
    },
    {
      id: 'q-side-2',
      hallId,
      kind: 'side',
      field: 'care',
      title: '광장 벤치 자리 정하기',
      client: 'care',
      story: {
        situation: '벤치를 하나 더 놓기로 했는데 어디가 좋을지 모르겠어.',
        request: '앉아 보고 좋았던 자리를 알려 줘.',
        promise: '네가 고른 자리에 놓을게.',
      },
      reward: { mongle: 8, xp: 35 },
      checklist: ['자리를 골랐어요', '이유를 적었어요', '사진을 찍었어요'],
      verification: 'auto',
      expiresAt: null,
      carriedOver: false,
      createdAt: at,
    },
    {
      id: 'q-guild',
      hallId,
      kind: 'guild',
      field: 'steady',
      title: '마을 길 고르게 다지기',
      client: 'steady',
      story: {
        situation: '비 온 뒤로 길이 좀 울퉁불퉁해졌어.',
        request: '지나다니면서 눈에 띄는 곳을 하나씩 다져 줘.',
        promise: '스물넷이 모이면 길이 정원까지 이어져.',
      },
      reward: { mongle: 6, xp: 30 },
      checklist: ['한 곳을 골랐어요', '다져 두었어요', '사진을 찍었어요'],
      verification: 'auto',
      expiresAt: null,
      carriedOver: false,
      createdAt: at,
    },
  ]

  if (!demo) return base

  return [
    ...base,
    {
      id: 'q-carry',
      hallId,
      kind: 'main',
      field: 'inquiry',
      title: '아직 안 깬 의뢰 · 문장의 뼈대 찾기',
      client: 'inquiry',
      story: {
        situation: '지난번에 시작만 하고 접어 둔 게 있어.',
        request: '언제 해도 괜찮아. 하던 데서 다시 시작하면 돼.',
        promise: '보상은 그때랑 똑같아.',
      },
      reward: { mongle: 10, xp: 45 },
      checklist: t[2].checklist,
      verification: 'gm',
      expiresAt: null,
      carriedOver: true,
      createdAt: at,
    },
  ]
}

export interface SeedOptions {
  villageId: string
  villageName: string
  classCode: string
  hallId: string
  hallName: string
  subject?: string
  at?: string
  /** 개발·시연용 세계를 만든다. 학생 28명과 지난 기록이 들어 있다. */
  demo?: boolean
}

export function seedWorld(opts: SeedOptions): WorldSnapshot {
  const { villageId, villageName, classCode, hallId, hallName, subject = '공통', demo = false } = opts
  const at = opts.at ?? new Date().toISOString()

  return {
    village: {
      id: villageId,
      estateId: 'e-1',
      name: villageName,
      classCode,
      season: 1,
      // 새 마을은 빈 터에서 시작한다. 시연용만 이미 자라 있다.
      buildings: demo
        ? { library: 2, workshop: 2, plaza: 3, lighthouse: 1, garden: 2 }
        : { library: 1, workshop: 1, plaza: 1, lighthouse: 1, garden: 1 },
      amenities: demo ? ['벤치', '가로등'] : [],
      monuments: demo ? ['첫 완공 기념비'] : [],
      guildProgress: demo ? 15 : 0,
      guildGoal: 24,
      mongle: demo ? 40 : 0,
      weather: '맑음',
      examMode: false,
      founded: demo,
    },
    halls: [{ id: hallId, villageId, name: hallName, subject, teacherKey: 'gm' }],
    sites: [
      {
        id: 'site-forest',
        villageId,
        name: '숲 어귀',
        type: 'explore',
        segments: demo
          ? [
              { name: '오솔길', progress: 100, done: true },
              { name: '고목 아래', progress: 35, done: false },
              { name: '숲 안쪽', progress: 0, done: false },
            ]
          : [
              { name: '오솔길', progress: 0, done: false },
              { name: '고목 아래', progress: 0, done: false },
              { name: '숲 안쪽', progress: 0, done: false },
            ],
        unlocked: true,
        cleared: false,
      },
      {
        id: 'site-lake',
        villageId,
        name: '호숫가',
        type: 'search',
        segments: [
          { name: '잔교', progress: 0, done: false },
          { name: '갈대밭', progress: 0, done: false },
        ],
        unlocked: true,
        cleared: false,
      },
      {
        id: 'site-mine',
        villageId,
        name: '폐광',
        type: 'repair',
        segments: [
          { name: '무너진 갱도', progress: 0, done: false },
          { name: '광차 선로', progress: 0, done: false },
        ],
        unlocked: false,
        cleared: false,
      },
      {
        id: 'site-light',
        villageId,
        name: '등대섬',
        type: 'raid',
        segments: [{ name: '잠든 큰 나무', progress: 0, done: false }],
        unlocked: false,
        cleared: false,
      },
    ],
    session: {
      id: `s-${villageId}`,
      hallId,
      villageId,
      phase: 'before',
      siteId: 'site-forest',
      segmentIndex: demo ? 1 : 0,
      expeditionType: 'explore',
      prog: 0,
      crisis: { active: false, kind: 'fog', label: '', counter: 0, goal: 0, endsAt: null, settled: 'none' },
      endsAt: null,
      openingStartedAt: null,
      settleStartedAt: null,
      fastSettle: false,
      spotlight: [],
      hearts: [],
      repairParts: Array(9).fill(null),
      nightIndex: 0,
      finaleStep: 0,
      freeTime: 'all',
      toolOverlay: { kind: '', endsAt: null, raffleName: '' },
      updatedAt: at,
    },
    mallangs: demo ? demoMallangs(villageId, hallId, at) : [],
    quests: starterQuests(hallId, at, demo),
    progress: [],
    praises: [],
    discoveries: demo
      ? [
          { id: 'd-1', mallangId: null, villageId, name: '접힌 지도 조각', kind: 'map', createdAt: at },
          { id: 'd-2', mallangId: null, villageId, name: '이름 모를 씨앗', kind: 'seed', createdAt: at },
          { id: 'd-3', mallangId: null, villageId, name: '고목의 탁본', kind: 'rubbing', createdAt: at },
        ]
      : [],
    letters: [],
    gmAwardsRemaining: 5,
    version: 1,
  }
}
