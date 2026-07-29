/**
 * 아트팩 데이터 어댑터.
 *
 * ART-README §3의 데이터 계약과 이 프로젝트의 도메인 상태는 이름과 단위가 다르다.
 * 아트 파일은 자립적이어야 하므로(ART-README §3) 아트 쪽을 고치지 않고
 * 여기서 변환만 한다. 아트팩 파일 8개는 받은 그대로, 한 바이트도 손대지 않았다.
 *
 * 아트가 요구하는 모양            이 프로젝트가 가진 모양
 *   room.code                     village.classCode
 *   room.weather 'clear'|'fog'    village.weather '맑음'|'구름 조금'|'별똥별 소나기'
 *   room.village.ask…keep         village.buildings.library…garden
 *   room.target                   없음 (prog이 0–100이라 target은 100 고정)
 *   room.submissions[].photo      session.repairParts (스토리지 키 → /api/photo)
 *   site.id 'forest'…'tower'      session.siteId 'site-forest'…'site-light'
 *   segment.id 's1'…'sx'          session.segmentIndex (숫자)
 */

import { BUILDING_WIDTH } from '@/components/art/Buildings'
import { villageTraits } from '@/lib/art/seed'
import { photoSrc } from '@/lib/client/photo'
import type {
  BuildingKey,
  Mallang,
  QuestProgress,
  Session,
  Village,
  Weather,
  WorldSnapshot,
} from '@/lib/domain/types'

/** 아트가 읽는 분야 키 5종. ART-README §3 "분야 키 5개는 고정이다". */
export type ArtFieldKey = 'ask' | 'make' | 'care' | 'dare' | 'keep'

/** 아트가 인식하는 원정지 4곳. */
export type ArtSiteId = 'forest' | 'lake' | 'mine' | 'tower'

export interface ArtRoom {
  code: string
  phase: string
  weather: 'clear' | 'fog'
  examMode: boolean
  village: Record<ArtFieldKey, number>
  amenities: string[]
  monuments: string[]
  expType: string
  prog: number
  target: number
  submissions: { status: 'approved'; photo: string }[]
}

export interface ArtCrowdMember {
  id: string
  color: string
  form: string
  wearing: string
}

/**
 * 건물 키 → 아트 분야 키.
 * 마스터 분류표(lib/domain/master.ts)의 5분야가 건물과 1:1이고,
 * 아트는 그 건물을 분야 키 이름으로 부른다. 순서·의미 모두 같은 축이다.
 */
const FIELD_BY_BUILDING: Record<BuildingKey, ArtFieldKey> = {
  library: 'ask',
  workshop: 'make',
  plaza: 'care',
  lighthouse: 'dare',
  garden: 'keep',
}

/** 역방향 — 아트가 세운 건물이 우리 어느 건물인지. 이름표·강조에 쓴다. */
export const BUILDING_BY_ART_FIELD = Object.fromEntries(
  Object.entries(FIELD_BY_BUILDING).map(([b, a]) => [a, b]),
) as Record<ArtFieldKey, BuildingKey>

/**
 * 날씨 → 팔레트 입력.
 * pickPalette는 'fog'만 분기하므로(tokens.js) 흐린 날만 안개 팔레트로 보낸다.
 * '별똥별 소나기'는 밤에 뜨는 연출이라 팔레트가 아니라 phase가 결정한다.
 */
const WEATHER_TO_ART: Record<Weather, 'clear' | 'fog'> = {
  맑음: 'clear',
  '구름 조금': 'fog',
  '별똥별 소나기': 'clear',
}

const SITE_ID_TO_ART: Record<string, ArtSiteId> = {
  'site-forest': 'forest',
  'site-lake': 'lake',
  'site-mine': 'mine',
  'site-light': 'tower',
}

/**
 * 랜드마크가 붙어 있는 구간 id만 순서대로 (ART-README §3의 표).
 * 우리 구간은 번호가 아니라 순번이라, 표에 없는 id로 보내면
 * 랜드마크 없이 배경만 나온다(§6의 흔한 실수). 그래서 있는 것끼리 순서대로 짝짓는다.
 */
const ART_SEGMENTS: Record<ArtSiteId, string[]> = {
  forest: ['s1', 's2', 's3', 's4', 'sx'],
  lake: ['l1', 'l3', 'l4'],
  mine: ['m1', 'm3', 'm4'],
  tower: ['t1', 't3', 't5'],
}

/** 우리 진행도는 0–100 백분율이라 분모가 항상 100이다. */
const PROG_TARGET = 100

export function toArtSite(siteId: string): { id: ArtSiteId } {
  return { id: SITE_ID_TO_ART[siteId] ?? 'forest' }
}

export function toArtSegment(siteId: string, segmentIndex: number): { id: string } {
  const ids = ART_SEGMENTS[toArtSite(siteId).id]
  return { id: ids[Math.max(0, Math.min(ids.length - 1, segmentIndex))] }
}

/**
 * 복구형 원정이 구조물 파츠로 쓰는 승인 사진.
 *
 * 아트는 'approved' + photo 인 것만 골라 9칸에 붙인다. 우리 쪽 원본은 session.repairParts —
 * 승인된 사진만 순서대로 들어가는 전용 칸이다. 다만 거기 실리는 건 스토리지 키라서
 * 그대로 <image href>에 넣으면 안 되고 /api/photo 를 거쳐야 한다(같은 마을인지 확인 후 서명 URL).
 *
 * progress 를 넘기면 repairParts 가 비었을 때 승인된 제출 사진으로 채운다.
 */
export function toArtSubmissions(session: Session, progress: QuestProgress[] = []): ArtRoom['submissions'] {
  const keys = session.repairParts.filter((k): k is string => !!k)
  const from = keys.length > 0 ? keys : progress.filter((p) => p.status === 'solved' && p.photoUrl).map((p) => p.photoUrl as string)
  return from
    .map((key) => photoSrc(key))
    .filter((src): src is string => !!src)
    .map((photo) => ({ status: 'approved' as const, photo }))
}

export function toArtRoom(village: Village, session: Session, progress: QuestProgress[] = []): ArtRoom {
  const buildings = {} as Record<ArtFieldKey, number>
  for (const [key, art] of Object.entries(FIELD_BY_BUILDING) as [BuildingKey, ArtFieldKey][]) {
    buildings[art] = village.buildings[key] ?? 1
  }
  return {
    code: village.classCode,
    phase: session.phase,
    weather: WEATHER_TO_ART[village.weather] ?? 'clear',
    examMode: village.examMode,
    village: buildings,
    amenities: village.amenities ?? [],
    monuments: village.monuments ?? [],
    expType: session.expeditionType,
    prog: session.prog,
    target: PROG_TARGET,
    submissions: toArtSubmissions(session, progress),
  }
}

/**
 * 필드에 서는 말랑이들.
 * 아트의 form은 기본형을 빈 문자열로 쓰고(ART-README §3), 우리는 'base'로 쓴다.
 */
export function toArtCrowd(mallangs: Mallang[]): ArtCrowdMember[] {
  return mallangs.map((m) => ({
    id: m.id,
    color: m.bodyColor,
    form: m.evolutionForm === 'base' ? '' : m.evolutionForm,
    wearing: m.wearing,
  }))
}

/**
 * 마을 건물이 실제로 어디 서는지.
 *
 * VillageScene 은 건물 순서·간격을 마을 코드에서 뽑는다(시드 변주). 그래서 바깥에서
 * 건물 이름표를 얹으려면 같은 자리를 알아야 한다. 좌표를 베껴 적는 대신 아트가 쓰는
 * 데이터(villageTraits · BUILDING_WIDTH)를 그대로 가져와 배치 식만 맞춘다.
 *
 * 아트의 showLabels 를 쓰지 않는 이유는 글자 크기다. 아트의 이름표는 26px 기준이라
 * TV 로 확대해도 32px 에 못 미친다(§3 추가 "TV 본문 최소 32px").
 * scripts/check-art-adapter.js 가 이 함수와 아트의 실제 배치가 어긋나면 실패시킨다.
 */
export interface ArtVillageSlot {
  field: ArtFieldKey
  x: number
  w: number
  /** 건물 가운데 — 이름표를 여기에 맞춘다 */
  cx: number
}

export function artVillageSlots(code: string, width: number): ArtVillageSlot[] {
  const t = villageTraits(code) as { order: ArtFieldKey[]; gap: number }
  const sizes = BUILDING_WIDTH as Record<ArtFieldKey, number>
  const widths = t.order.map((f) => sizes[f])
  const total = widths.reduce((a, b) => a + b, 0) + t.gap * 4
  let cursor = (width - total) / 2
  return t.order.map((field, i) => {
    const x = cursor
    cursor += widths[i] + t.gap
    return { field, x, w: widths[i], cx: x + widths[i] / 2 }
  })
}

/** 아트가 이름표를 놓는 높이. VillageScene 의 gy + 50 과 같은 자리다. */
export const artLabelY = (height: number) => height - 150 + 50

/** 스냅샷 하나에서 아트가 필요로 하는 것 전부를 뽑는다. */
export function toArtProps(snap: WorldSnapshot) {
  return {
    room: toArtRoom(snap.village, snap.session, snap.progress),
    site: toArtSite(snap.session.siteId),
    segment: toArtSegment(snap.session.siteId, snap.session.segmentIndex),
    crowd: toArtCrowd(snap.mallangs),
  }
}
