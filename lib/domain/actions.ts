import {
  CLASS_ABILITY,
  FIELDS,
  FIELD_BY_KEY,
  GATHER_DAILY_CAP,
  KEEPER_REPLIES,
  SHOP_ACCESSORIES,
  SNACKS,
  WEEKLY_ITEM,
} from './master'
import { pickSpotlight } from './spotlight'
import type {
  Accessory,
  BuildingKey,
  ClassRole,
  EvolutionForm,
  ExpeditionType,
  FieldKey,
  Mallang,
  Quest,
  QuestKind,
  Weather,
  WorldSnapshot,
} from './types'

/**
 * 세계에 일어날 수 있는 일의 전부.
 *
 * 세 클라이언트(학생 · 교사 GM · 클래스 스크린)는 모두 이 액션만 보낸다.
 * applyAction은 순수 함수이므로 어떤 저장소를 쓰든 결과가 같다.
 */
export type Action =
  // ── 입장 · 캐릭터 (S1)
  | { type: 'mallang.create'; id: string; code: string; name: string; bodyColor: string; hallId: string; at: string }
  | { type: 'mallang.wear'; mallangId: string; accessory: Accessory }
  | { type: 'mallang.form'; mallangId: string; form: EvolutionForm }
  | { type: 'mallang.class'; mallangId: string; role: ClassRole }
  // ── 의뢰 (S3 · S7)
  | { type: 'quest.accept'; questId: string; mallangId: string; at: string }
  | { type: 'quest.check'; questId: string; mallangId: string; index: 0 | 1 | 2; value: boolean; at: string }
  | { type: 'quest.photo'; questId: string; mallangId: string; photoUrl: string; at: string }
  | { type: 'quest.deliver'; questId: string; mallangId: string; at: string }
  | { type: 'quest.publish'; quest: Quest }
  | { type: 'quest.retry'; questId: string; mallangId: string; at: string }
  // ── 검증 (T3)
  | { type: 'verify.approve'; questId: string; mallangId: string; at: string }
  | { type: 'verify.reject'; questId: string; mallangId: string; reason: string; at: string }
  | { type: 'verify.approveAll'; at: string }
  // ── 세션 (T4 리모컨 · C1)
  | { type: 'session.open'; siteId: string; segmentIndex: number; expeditionType: ExpeditionType; minutes: number; at: string }
  | { type: 'session.live'; at: string }
  | { type: 'session.settle'; fast: boolean; at: string }
  | { type: 'session.after'; at: string }
  | { type: 'session.night'; at: string }
  | { type: 'session.nightStep' }
  | { type: 'session.finale'; at: string }
  | { type: 'session.finaleStep' }
  | { type: 'session.reset'; at: string }
  | { type: 'crisis.start'; kind: 'fog' | 'raid'; goal: number; seconds: number; at: string }
  | { type: 'crisis.end'; at: string }
  | { type: 'tool.open'; kind: 'timer' | 'raffle' | 'party'; seconds: number; raffleName: string; at: string }
  | { type: 'tool.close' }
  | { type: 'freetime.set'; mode: 'closed' | 'all' | 'delivered' }
  // ── 칭찬 · 하트
  | { type: 'gm.award'; id: string; mallangId: string; field: FieldKey; text: string; at: string }
  | { type: 'heart.send'; mallangId: string; at: string }
  | { type: 'praise.reveal'; at: string }
  // ── 필드 행동 (S7)
  | { type: 'field.classAction'; mallangId: string; at: string }
  // ── 가게 (S5)
  | { type: 'shop.buySnack'; mallangId: string; key: string; at: string }
  | { type: 'shop.buyAccessory'; mallangId: string; key: Accessory; at: string }
  // ── 채집 (S8)
  | { type: 'gather.catch'; id: string; mallangId: string; name: string; at: string }
  | { type: 'gather.vote'; amenity: string }
  // ── 시즌 운영 (T5)
  | { type: 'season.weather'; weather: Weather }
  | { type: 'season.exam'; on: boolean }
  | { type: 'village.found'; name: string; hallName: string; subject: string; at: string }
  | { type: 'hall.open'; id: string; name: string; subject: string }
  | { type: 'letter.read'; letterId: string }

export interface ActionResult {
  snapshot: WorldSnapshot
  /** 실패해도 예외를 던지지 않는다. 부정 상태를 만들지 않기 위해 조용히 사유만 돌려준다. */
  note?: string
}

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n))

function bumpXp(m: Mallang, xp: number): Mallang {
  const total = m.xp + xp
  return { ...m, xp: total, level: Math.max(1, Math.floor(total / 400) + 1) }
}

function mapMallang(s: WorldSnapshot, id: string, fn: (m: Mallang) => Mallang): WorldSnapshot {
  return { ...s, mallangs: s.mallangs.map((m) => (m.id === id ? fn(m) : m)) }
}

function progressOf(s: WorldSnapshot, questId: string, mallangId: string) {
  return s.progress.find((p) => p.questId === questId && p.mallangId === mallangId)
}

function upsertProgress(
  s: WorldSnapshot,
  questId: string,
  mallangId: string,
  patch: Partial<WorldSnapshot['progress'][number]>,
  at: string,
): WorldSnapshot {
  const found = progressOf(s, questId, mallangId)
  if (found) {
    return {
      ...s,
      progress: s.progress.map((p) =>
        p.questId === questId && p.mallangId === mallangId ? { ...p, ...patch, updatedAt: at } : p,
      ),
    }
  }
  return {
    ...s,
    progress: [
      ...s.progress,
      {
        questId,
        mallangId,
        status: 'open',
        photoUrl: null,
        checks: [false, false, false],
        reply: null,
        ...patch,
        updatedAt: at,
      },
    ],
  }
}

/** 구간 진행도는 전달이 승인된 수로 자란다 — 제출 1건마다 실시간 반영. */
function stepProg(s: WorldSnapshot, step = 100 / Math.max(8, s.mallangs.length)): WorldSnapshot {
  return { ...s, session: { ...s.session, prog: clamp(s.session.prog + step, 0, 100) } }
}

/** 건물 성장 4단계. 자원이 마을로 옮겨지는 정산 마지막에만 오른다. */
function growBuilding(s: WorldSnapshot, key: BuildingKey): WorldSnapshot {
  const cur = s.village.buildings[key]
  const next = clamp(cur + 1, 1, 4) as 1 | 2 | 3 | 4
  return { ...s, village: { ...s.village, buildings: { ...s.village.buildings, [key]: next } } }
}

export function applyAction(input: WorldSnapshot, action: Action): ActionResult {
  let s: WorldSnapshot = { ...input, version: input.version + 1 }

  switch (action.type) {
    // ── S1 입장 ─────────────────────────────────────────
    case 'mallang.create': {
      if (s.mallangs.some((m) => m.code === action.code)) return { snapshot: input, note: '이미 있는 말랑 코드예요' }
      const roles: ClassRole[] = FIELDS.map((f) => f.classRole)
      const mallang: Mallang = {
        id: action.id,
        code: action.code,
        name: action.name.slice(0, 8),
        bodyColor: action.bodyColor,
        xp: 0,
        level: 1,
        badges: { inquiry: 0, making: 0, care: 0, challenge: 0, steady: 0 },
        evolutionForm: 'base',
        accessories: [],
        wearing: '',
        classRole: roles[s.mallangs.length % roles.length],
        villageId: s.village.id,
        hallId: action.hallId,
        createdAt: action.at,
        recentAvg: 0,
        deliveredToday: 0,
        lastSpotlightAt: null,
        lastAwardAt: null,
      }
      return { snapshot: { ...s, mallangs: [...s.mallangs, mallang] }, note: '새 주민이 이사 왔습니다' }
    }

    case 'mallang.wear':
      return { snapshot: mapMallang(s, action.mallangId, (m) => ({ ...m, wearing: action.accessory })) }

    case 'mallang.form':
      // 되돌림의 샘 — 변경에 비용도 제한도 없다 (§S10).
      return { snapshot: mapMallang(s, action.mallangId, (m) => ({ ...m, evolutionForm: action.form })) }

    case 'mallang.class':
      return { snapshot: mapMallang(s, action.mallangId, (m) => ({ ...m, classRole: action.role })) }

    // ── S3 의뢰 ─────────────────────────────────────────
    case 'quest.accept':
      return { snapshot: upsertProgress(s, action.questId, action.mallangId, { status: 'doing' }, action.at) }

    case 'quest.check': {
      const cur = progressOf(s, action.questId, action.mallangId)
      const checks: [boolean, boolean, boolean] = [...(cur?.checks ?? [false, false, false])] as [
        boolean,
        boolean,
        boolean,
      ]
      checks[action.index] = action.value
      return {
        snapshot: upsertProgress(s, action.questId, action.mallangId, { checks, status: cur?.status ?? 'doing' }, action.at),
      }
    }

    case 'quest.photo':
      return {
        snapshot: upsertProgress(
          s,
          action.questId,
          action.mallangId,
          { photoUrl: action.photoUrl, status: 'doing' },
          action.at,
        ),
      }

    case 'quest.retry':
      return { snapshot: upsertProgress(s, action.questId, action.mallangId, { status: 'doing' }, action.at) }

    case 'quest.deliver': {
      const p = progressOf(s, action.questId, action.mallangId)
      const quest = s.quests.find((q) => q.id === action.questId)
      if (!quest) return { snapshot: input, note: '그 의뢰를 찾지 못했어요' }
      // 사진 + 체크 3개 전부 충족해야 전달할 수 있다 (§폼 규칙).
      if (!p?.photoUrl) return { snapshot: input, note: '사진을 첨부해주세요' }
      if (!p.checks.every(Boolean)) return { snapshot: input, note: '체크 항목이 조금 남았어요' }

      if (quest.verification === 'auto') {
        s = settleDelivery(s, action.questId, action.mallangId, action.at)
        return { snapshot: s }
      }
      return { snapshot: upsertProgress(s, action.questId, action.mallangId, { status: 'delivering' }, action.at) }
    }

    case 'quest.publish':
      return { snapshot: { ...s, quests: [...s.quests, action.quest] } }

    // ── T3 검증함 ───────────────────────────────────────
    case 'verify.approve':
      return { snapshot: settleDelivery(s, action.questId, action.mallangId, action.at) }

    case 'verify.reject':
      // 반려는 상실이 아니라 조건 안내다. 카드는 '진행 중'으로 조용히 돌아간다.
      return {
        snapshot: upsertProgress(s, action.questId, action.mallangId, { status: 'doing', reply: action.reason }, action.at),
      }

    case 'verify.approveAll': {
      const pending = s.progress.filter((p) => p.status === 'delivering')
      for (const p of pending) s = settleDelivery(s, p.questId, p.mallangId, action.at)
      return { snapshot: s }
    }

    // ── 세션 ────────────────────────────────────────────
    case 'session.open':
      return {
        snapshot: {
          ...s,
          session: {
            ...s.session,
            phase: 'opening',
            siteId: action.siteId,
            segmentIndex: action.segmentIndex,
            expeditionType: action.expeditionType,
            openingStartedAt: action.at,
            settleStartedAt: null,
            endsAt: new Date(Date.parse(action.at) + action.minutes * 60_000).toISOString(),
            prog: 0,
            hearts: [],
            spotlight: [],
            repairParts: Array(9).fill(null),
            freeTime: 'closed',
            crisis: { active: false, kind: 'fog', label: '', counter: 0, goal: 0, endsAt: null, settled: 'none' },
            updatedAt: action.at,
          },
          mallangs: s.mallangs.map((m) => ({ ...m, deliveredToday: 0 })),
        },
      }

    case 'session.live':
      return { snapshot: { ...s, session: { ...s.session, phase: 'live', updatedAt: action.at } } }

    case 'session.settle': {
      const spotlight = pickSpotlight(s, Date.parse(action.at))
      return {
        snapshot: {
          ...s,
          session: {
            ...s.session,
            phase: 'settling',
            settleStartedAt: action.at,
            fastSettle: action.fast,
            spotlight,
            crisis: { ...s.session.crisis, active: false },
            updatedAt: action.at,
          },
          mallangs: s.mallangs.map((m) =>
            spotlight.some((c) => c.mallangId === m.id) ? { ...m, lastSpotlightAt: action.at } : m,
          ),
          praises: s.praises.map((p) => ({ ...p, revealed: true })),
        },
      }
    }

    case 'session.after': {
      // 정산 마지막에 발견물과 자원이 마을로 옮겨지고 건물이 자란다.
      const solved = s.progress.filter((p) => p.status === 'solved').length
      if (solved >= 6) {
        const busiest = FIELDS.reduce((a, b) =>
          countField(s, b.key) > countField(s, a.key) ? b : a,
        )
        s = growBuilding(s, busiest.building)
      }
      const site = s.sites.find((x) => x.id === s.session.siteId)
      if (site) {
        const segments = site.segments.map((seg, i) =>
          i === s.session.segmentIndex
            ? { ...seg, progress: Math.max(seg.progress, s.session.prog), done: s.session.prog >= 100 }
            : seg,
        )
        s = {
          ...s,
          sites: s.sites.map((x) =>
            x.id === site.id ? { ...x, segments, cleared: segments.every((g) => g.done) } : x,
          ),
        }
      }
      return {
        snapshot: {
          ...s,
          session: { ...s.session, phase: 'after', freeTime: 'all', updatedAt: action.at },
        },
      }
    }

    case 'session.night':
      return {
        snapshot: { ...s, session: { ...s.session, phase: 'night', nightIndex: 0, updatedAt: action.at } },
      }

    case 'session.nightStep': {
      const idx = s.session.nightIndex
      const target = s.mallangs[idx]
      if (!target) return { snapshot: { ...s } }
      // 진화 시점은 활동량이 아니라 시간. 전원 진화 보장, 형태 간 우열 없음.
      const field = FIELDS[idx % FIELDS.length]
      return {
        snapshot: {
          ...mapMallang(s, target.id, (m) => ({ ...m, evolutionForm: field.form })),
          session: { ...s.session, nightIndex: idx + 1 },
        },
      }
    }

    case 'session.finale':
      return {
        snapshot: { ...s, session: { ...s.session, phase: 'finale', finaleStep: 0, updatedAt: action.at } },
      }

    case 'session.finaleStep':
      return { snapshot: { ...s, session: { ...s.session, finaleStep: clamp(s.session.finaleStep + 1, 0, 4) } } }

    case 'session.reset':
      return {
        snapshot: {
          ...s,
          session: {
            ...s.session,
            phase: 'before',
            prog: 0,
            openingStartedAt: null,
            settleStartedAt: null,
            endsAt: null,
            hearts: [],
            spotlight: [],
            freeTime: 'all',
            updatedAt: action.at,
          },
        },
      }

    case 'crisis.start':
      return {
        snapshot: {
          ...s,
          session: {
            ...s.session,
            crisis: {
              active: true,
              kind: action.kind,
              label: action.kind === 'raid' ? '잠든 큰 나무' : '짙어진 안개',
              counter: 0,
              goal: action.goal,
              endsAt: new Date(Date.parse(action.at) + action.seconds * 1000).toISOString(),
              settled: 'none',
            },
            updatedAt: action.at,
          },
        },
      }

    case 'crisis.end': {
      const c = s.session.crisis
      return {
        snapshot: {
          ...s,
          session: {
            ...s.session,
            crisis: { ...c, active: false, endsAt: null, settled: c.counter >= c.goal ? 'cleared' : 'calmed' },
            updatedAt: action.at,
          },
        },
      }
    }

    case 'tool.open':
      return {
        snapshot: {
          ...s,
          session: {
            ...s.session,
            toolOverlay: {
              kind: action.kind,
              endsAt: new Date(Date.parse(action.at) + action.seconds * 1000).toISOString(),
              raffleName: action.raffleName,
            },
          },
        },
      }

    case 'tool.close':
      return { snapshot: { ...s, session: { ...s.session, toolOverlay: { kind: '', endsAt: null, raffleName: '' } } } }

    case 'freetime.set':
      return { snapshot: { ...s, session: { ...s.session, freeTime: action.mode } } }

    // ── 칭찬 ────────────────────────────────────────────
    case 'gm.award': {
      if (s.gmAwardsRemaining <= 0) return { snapshot: input, note: '오늘 표시는 여기까지예요' }
      const f = FIELD_BY_KEY[action.field]
      const tier = clamp((s.mallangs.find((m) => m.id === action.mallangId)?.badges[action.field] ?? 0) + 1, 1, 3)
      return {
        snapshot: {
          ...mapMallang(s, action.mallangId, (m) => ({
            ...bumpXp(m, 40),
            badges: { ...m.badges, [action.field]: tier as 1 | 2 | 3 },
            lastAwardAt: action.at,
          })),
          gmAwardsRemaining: s.gmAwardsRemaining - 1,
          praises: [
            ...s.praises,
            {
              id: action.id,
              mallangId: action.mallangId,
              field: action.field,
              text: action.text || f.praise,
              source: 'gm',
              // 표시한 업적은 정산 전까지 학생에게 보이지 않는다 (§T4).
              revealed: false,
              createdAt: action.at,
            },
          ],
        },
      }
    }

    case 'heart.send': {
      // 하트는 개수 없이 떠오르는 연출로만. 학생당 최대 2회.
      const sent = s.session.hearts.filter((h) => h.id === hashId(action.mallangId)).length
      if (sent >= 2) return { snapshot: input, note: '' }
      return {
        snapshot: {
          ...s,
          session: {
            ...s.session,
            hearts: [
              ...s.session.hearts,
              {
                id: hashId(action.mallangId),
                left: `${15 + ((Date.parse(action.at) / 7) % 70)}%`,
                size: 22 + ((Date.parse(action.at) / 3) % 12),
              },
            ].slice(-8),
          },
        },
      }
    }

    case 'praise.reveal':
      return { snapshot: { ...s, praises: s.praises.map((p) => ({ ...p, revealed: true })) } }

    // ── S7 필드 ─────────────────────────────────────────
    case 'field.classAction': {
      const m = s.mallangs.find((x) => x.id === action.mallangId)
      if (!m) return { snapshot: input }
      const ability = CLASS_ABILITY[m.classRole]
      s = stepProg(s, 4)
      s = { ...s, session: { ...s.session, crisis: bumpCrisis(s) } }
      return { snapshot: mapMallang(s, m.id, (x) => bumpXp(x, 15)), note: ability.result }
    }

    // ── S5 가게 ─────────────────────────────────────────
    case 'shop.buySnack': {
      const item = SNACKS.find((x) => x.key === action.key)
      if (!item) return { snapshot: input }
      if (s.village.mongle < item.price) return { snapshot: input, note: '몽글이 조금 더 필요해요' }
      return {
        snapshot: {
          ...mapMallang(s, action.mallangId, (m) => bumpXp(m, 5)),
          village: { ...s.village, mongle: s.village.mongle - item.price },
        },
        note: `${item.name} — 잘 먹었다는 표정이에요`,
      }
    }

    case 'shop.buyAccessory': {
      const item =
        SHOP_ACCESSORIES.find((x) => x.key === action.key) ??
        (WEEKLY_ITEM.key === action.key ? { key: WEEKLY_ITEM.key, name: WEEKLY_ITEM.name, price: WEEKLY_ITEM.price } : null)
      if (!item) return { snapshot: input }
      if (s.village.mongle < item.price) return { snapshot: input, note: '몽글이 조금 더 필요해요' }
      return {
        snapshot: {
          ...mapMallang(s, action.mallangId, (m) => ({
            ...m,
            accessories: m.accessories.includes(item.key) ? m.accessories : [...m.accessories, item.key],
            wearing: item.key,
          })),
          village: { ...s.village, mongle: s.village.mongle - item.price },
        },
        note: `${item.name}을(를) 챙겼어요`,
      }
    }

    // ── S8 채집 ─────────────────────────────────────────
    case 'gather.catch': {
      const today = s.discoveries.filter((d) => d.mallangId === action.mallangId && d.kind === 'seed').length
      if (today >= GATHER_DAILY_CAP) return { snapshot: input, note: '오늘은 이만하면 충분해!' }
      return {
        snapshot: {
          ...s,
          discoveries: [
            ...s.discoveries,
            {
              id: action.id,
              mallangId: action.mallangId,
              villageId: s.village.id,
              name: action.name,
              kind: 'seed',
              createdAt: action.at,
            },
          ],
          village: { ...s.village, mongle: s.village.mongle + 3 },
        },
      }
    }

    case 'gather.vote':
      return {
        snapshot: {
          ...s,
          village: {
            ...s.village,
            amenities: s.village.amenities.includes(action.amenity)
              ? s.village.amenities
              : [...s.village.amenities, action.amenity],
          },
        },
        note: `${action.amenity} 후보에 표를 놓았어요`,
      }

    // ── T5 시즌 운영 ────────────────────────────────────
    case 'season.weather':
      return { snapshot: { ...s, village: { ...s.village, weather: action.weather } } }

    case 'season.exam':
      return { snapshot: { ...s, village: { ...s.village, examMode: action.on } } }

    case 'village.found':
      return {
        snapshot: {
          ...s,
          village: { ...s.village, name: action.name, founded: true },
          halls: s.halls.length
            ? s.halls
            : [{ id: 'hall-1', villageId: s.village.id, name: action.hallName, subject: action.subject, teacherKey: 'gm' }],
        },
      }

    case 'hall.open':
      return {
        snapshot: {
          ...s,
          halls: [
            ...s.halls,
            { id: action.id, villageId: s.village.id, name: action.name, subject: action.subject, teacherKey: 'gm' },
          ],
        },
      }

    case 'letter.read':
      return {
        snapshot: { ...s, letters: s.letters.map((l) => (l.id === action.letterId ? { ...l, read: true } : l)) },
      }
  }
}

function countField(s: WorldSnapshot, key: FieldKey): number {
  const ids = new Set(s.quests.filter((q) => q.field === key).map((q) => q.id))
  return s.progress.filter((p) => p.status === 'solved' && ids.has(p.questId)).length
}

function bumpCrisis(s: WorldSnapshot) {
  const c = s.session.crisis
  if (!c.active) return c
  return { ...c, counter: clamp(c.counter + 1, 0, c.goal) }
}

function hashId(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0
  return Math.abs(h)
}

/** 전달이 받아들여졌을 때 일어나는 일 전부. 승인·자동 인증이 같은 길을 탄다. */
function settleDelivery(s: WorldSnapshot, questId: string, mallangId: string, at: string): WorldSnapshot {
  const quest = s.quests.find((q) => q.id === questId)
  if (!quest) return s
  const prev = progressOf(s, questId, mallangId)
  if (prev?.status === 'solved') return s

  let next = upsertProgress(
    s,
    questId,
    mallangId,
    { status: 'solved', reply: KEEPER_REPLIES[quest.client] },
    at,
  )

  next = mapMallang(next, mallangId, (m) => ({
    ...bumpXp(m, quest.reward.xp),
    deliveredToday: m.deliveredToday + 1,
  }))

  next = {
    ...next,
    village: {
      ...next.village,
      mongle: next.village.mongle + quest.reward.mongle,
      guildProgress:
        quest.kind === 'main' || quest.kind === 'guild'
          ? clamp(next.village.guildProgress + 1, 0, next.village.guildGoal)
          : next.village.guildProgress,
    },
    letters: [
      ...next.letters,
      {
        id: `${questId}:${mallangId}`,
        mallangId,
        from: FIELD_BY_KEY[quest.client].keeper,
        body: KEEPER_REPLIES[quest.client],
        read: false,
        createdAt: at,
      },
    ],
  }

  next = stepProg(next)
  next = { ...next, session: { ...next.session, crisis: bumpCrisis(next) } }

  // 복구형 원정은 제출 사진이 구조물 파츠로 그대로 붙는다.
  if (next.session.expeditionType === 'repair' && prev?.photoUrl) {
    const parts = [...next.session.repairParts]
    const slot = parts.findIndex((p) => p === null)
    if (slot >= 0) parts[slot] = prev.photoUrl
    next = { ...next, session: { ...next.session, repairParts: parts } }
  }

  return next
}

export type { Quest, QuestKind }
