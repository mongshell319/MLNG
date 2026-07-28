import { photoSrc } from '@/lib/client/photo'
import type { BuildingKey } from '@/lib/domain/types'

/**
 * 마을 건물 5종 × 성장 4단계.
 *
 * handoff §Assets — 건물 아트는 일러스트 에셋으로 교체 예정이므로 여기서는
 * CSS/SVG 도형 플레이스홀더다. 다만 "4단계가 눈에 보이게 자란다"는 요구는
 * 플레이스홀더 상태에서도 만족해야 정산 마지막 8초가 성립한다.
 *
 * 단계는 (1) 높이 (2) 부속(굴뚝·창·깃발) (3) 주변 초록으로 자란다.
 * 어떤 단계도 다른 마을과 비교되지 않는다 — 수치를 붙이지 않는다.
 */

const INK = '#6E5A54'

interface BuildingProps {
  level: 1 | 2 | 3 | 4
  width?: number
  /** 성장 순간에만 붙는다 */
  growing?: boolean
}

function Frame({
  width,
  height,
  children,
  growing,
  label,
}: {
  width: number
  height: number
  children: React.ReactNode
  growing?: boolean
  label: string
}) {
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={growing ? 'anim-growup' : undefined}
      style={{ overflow: 'visible', transformOrigin: 'bottom center' }}
      role="img"
      aria-label={label}
    >
      {children}
    </svg>
  )
}

/** 도서관 · 지식나무 — 질문·탐구 */
export function Library({ level, width = 200, growing }: BuildingProps) {
  const h = 110 + level * 26
  return (
    <Frame width={width} height={h + 40} growing={growing} label="도서관">
      <rect x={26} y={h - 70} width={width - 52} height={70} rx={14} fill="#C5EBDD" stroke={INK} strokeWidth={2.5} />
      <path
        d={`M20 ${h - 70} L${width / 2} ${h - 70 - 34 - level * 6} L${width - 20} ${h - 70} Z`}
        fill="#4A8B6F"
        stroke={INK}
        strokeWidth={2.5}
        strokeLinejoin="round"
      />
      <rect x={width / 2 - 18} y={h - 40} width={36} height={40} rx={10} fill="#FFF6EC" stroke={INK} strokeWidth={2.2} />
      {level >= 2 && <circle cx={width / 2} cy={h - 88} r={7} fill="#FFF0B3" stroke={INK} strokeWidth={2} />}
      {level >= 3 && (
        <>
          <rect x={44} y={h - 58} width={22} height={22} rx={6} fill="#FFF0B3" stroke={INK} strokeWidth={2} />
          <rect x={width - 66} y={h - 58} width={22} height={22} rx={6} fill="#FFF0B3" stroke={INK} strokeWidth={2} />
        </>
      )}
      {/* 지식나무 */}
      {level >= 2 && (
        <>
          <path d={`M${width - 16} ${h} v-${20 + level * 8}`} stroke={INK} strokeWidth={4} strokeLinecap="round" />
          <circle cx={width - 16} cy={h - 24 - level * 8} r={12 + level * 3} fill="#8FBF9E" stroke={INK} strokeWidth={2.4} />
        </>
      )}
    </Frame>
  )
}

/** 공방 — 창의·제작 */
export function Workshop({ level, width = 190, growing }: BuildingProps) {
  const h = 100 + level * 24
  return (
    <Frame width={width} height={h + 40} growing={growing} label="공방">
      <rect x={22} y={h - 76} width={width - 44} height={76} rx={14} fill="#FFC9B5" stroke={INK} strokeWidth={2.5} />
      <path
        d={`M14 ${h - 76} h${width - 28} l-16 -${26 + level * 5} h-${width - 60} Z`}
        fill="#C96B4A"
        stroke={INK}
        strokeWidth={2.5}
        strokeLinejoin="round"
      />
      <rect x={38} y={h - 46} width={34} height={46} rx={9} fill="#FFF6EC" stroke={INK} strokeWidth={2.2} />
      <circle cx={width - 56} cy={h - 46} r={13} fill="#FFF0B3" stroke={INK} strokeWidth={2.2} />
      {level >= 2 && (
        <>
          <rect x={width - 62} y={h - 108 - level * 4} width={18} height={34 + level * 4} rx={6} fill="#EAD9C2" stroke={INK} strokeWidth={2.2} />
          <circle cx={width - 53} cy={h - 116 - level * 4} r={7} fill="#FFF6EC" opacity={0.85} />
        </>
      )}
      {level >= 3 && <circle cx={width - 40} cy={h - 130 - level * 4} r={9} fill="#FFF6EC" opacity={0.7} />}
    </Frame>
  )
}

/** 광장 — 협력·배려 */
export function PlazaBuilding({ level, width = 210, growing }: BuildingProps) {
  const h = 90 + level * 18
  return (
    <Frame width={width} height={h + 40} growing={growing} label="광장">
      <ellipse cx={width / 2} cy={h} rx={width / 2 - 8} ry={20} fill="#EAD9C2" stroke={INK} strokeWidth={2.4} />
      <rect x={width / 2 - 42} y={h - 46} width={84} height={46} rx={12} fill="#FFD6E5" stroke={INK} strokeWidth={2.5} />
      <path
        d={`M${width / 2 - 56} ${h - 46} h112 l-14 -${20 + level * 5} h-84 Z`}
        fill="#FFB3C6"
        stroke={INK}
        strokeWidth={2.5}
        strokeLinejoin="round"
      />
      {level >= 2 && (
        <>
          <rect x={26} y={h - 24} width={44} height={9} rx={4.5} fill="#EAD9C2" stroke={INK} strokeWidth={2} />
          <rect x={width - 70} y={h - 24} width={44} height={9} rx={4.5} fill="#EAD9C2" stroke={INK} strokeWidth={2} />
        </>
      )}
      {level >= 3 && (
        <>
          <circle cx={width / 2} cy={h - 84 - level * 3} r={11} fill="#BFE3EF" stroke={INK} strokeWidth={2.2} />
          <path d={`M${width / 2} ${h - 73 - level * 3} v14`} stroke={INK} strokeWidth={2.4} strokeLinecap="round" />
        </>
      )}
    </Frame>
  )
}

/** 등대 · 모험문 — 도전·발표 */
export function Lighthouse({ level, width = 130, growing }: BuildingProps) {
  const h = 130 + level * 36
  return (
    <Frame width={width} height={h + 40} growing={growing} label="등대">
      <path
        d={`M${width / 2 - 26} ${h} L${width / 2 - 17} ${h - h * 0.74} h34 L${width / 2 + 26} ${h} Z`}
        fill="#D9D2F5"
        stroke={INK}
        strokeWidth={2.5}
        strokeLinejoin="round"
      />
      <rect x={width / 2 - 24} y={h - h * 0.78} width={48} height={16} rx={7} fill="#7A6BB5" stroke={INK} strokeWidth={2.4} />
      <rect x={width / 2 - 16} y={h - h * 0.9} width={32} height={22} rx={8} fill="#FFF0B3" stroke={INK} strokeWidth={2.4} />
      {level >= 2 && (
        <path
          d={`M${width / 2 - 16} ${h - h * 0.88} l-26 -10 M${width / 2 + 16} ${h - h * 0.88} l26 -10`}
          stroke="#B8933A"
          strokeWidth={3}
          strokeLinecap="round"
          opacity={0.75}
        />
      )}
      {level >= 3 && (
        <path d={`M${width / 2 - 30} ${h - 26} h60`} stroke={INK} strokeWidth={2.2} strokeLinecap="round" opacity={0.5} />
      )}
    </Frame>
  )
}

/** 정원 · 길 — 꾸준함·완수 */
export function Garden({ level, width = 190, growing }: BuildingProps) {
  const h = 80 + level * 14
  const sprouts = 2 + level
  return (
    <Frame width={width} height={h + 40} growing={growing} label="정원">
      <ellipse cx={width / 2} cy={h} rx={width / 2 - 10} ry={22} fill="#CFE0D4" stroke={INK} strokeWidth={2.4} />
      <path
        d={`M18 ${h - 6} q${width / 2 - 18} -26 ${width - 36} 0`}
        fill="none"
        stroke="#EAD9C2"
        strokeWidth={10}
        strokeLinecap="round"
      />
      {Array.from({ length: sprouts }).map((_, i) => {
        const x = 34 + i * ((width - 68) / Math.max(1, sprouts - 1))
        const s = 12 + level * 3
        return (
          <g key={i}>
            <path d={`M${x} ${h - 10} v-${s}`} stroke="#4A8B6F" strokeWidth={3} strokeLinecap="round" />
            <path
              d={`M${x} ${h - 10 - s} q-9 -7 -13 0 q7 5 13 0 q9 -7 13 0 q-7 5 -13 0`}
              fill="#8FBF9E"
              stroke="#4A8B6F"
              strokeWidth={2}
              strokeLinejoin="round"
            />
          </g>
        )
      })}
      {level >= 3 && (
        <rect x={width - 54} y={h - 46} width={30} height={36} rx={9} fill="#FFF0B3" stroke={INK} strokeWidth={2.2} />
      )}
    </Frame>
  )
}

export const BUILDING_COMPONENT: Record<
  BuildingKey,
  (p: BuildingProps) => React.ReactElement
> = {
  library: Library,
  workshop: Workshop,
  plaza: PlazaBuilding,
  lighthouse: Lighthouse,
  garden: Garden,
}

/** 편의시설 — 벤치 · 가로등 · 분수 */
export function Amenity({ kind, size = 60 }: { kind: string; size?: number }) {
  if (kind === '가로등') {
    return (
      <svg width={size * 0.5} height={size * 1.5} viewBox="0 0 30 90" aria-label="가로등">
        <path d="M15 90 V26" stroke={INK} strokeWidth={4} strokeLinecap="round" />
        <path d="M15 26 q0 -14 -9 -14" fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round" />
        <circle cx={6} cy={12} r={8} fill="#FFF0B3" stroke={INK} strokeWidth={2.4} />
      </svg>
    )
  }
  if (kind === '분수') {
    return (
      <svg width={size * 1.2} height={size} viewBox="0 0 72 60" aria-label="분수">
        <ellipse cx={36} cy={46} rx={32} ry={12} fill="#BFE3EF" stroke={INK} strokeWidth={2.4} />
        <path d="M36 40 v-20" stroke="#D9F0F7" strokeWidth={5} strokeLinecap="round" />
        <circle cx={36} cy={16} r={9} fill="#D9F0F7" stroke={INK} strokeWidth={2.2} />
      </svg>
    )
  }
  return (
    <svg width={size} height={size * 0.6} viewBox="0 0 60 36" aria-label="벤치">
      <rect x={4} y={14} width={52} height={8} rx={4} fill="#EAD9C2" stroke={INK} strokeWidth={2.2} />
      <path d="M12 22 v10 M48 22 v10" stroke={INK} strokeWidth={3} strokeLinecap="round" />
      <rect x={8} y={4} width={44} height={7} rx={3.5} fill="#EAD9C2" stroke={INK} strokeWidth={2.2} />
    </svg>
  )
}

/** 첫 완공 기념비 */
export function Monument({ size = 90, label }: { size?: number; label?: string }) {
  return (
    <svg width={size} height={size * 1.2} viewBox="0 0 90 108" aria-label={label ?? '기념비'}>
      <path d="M45 6 L66 30 V96 H24 V30 Z" fill="#EFEAE2" stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
      <ellipse cx={45} cy={98} rx={34} ry={9} fill="#CFE0D4" stroke={INK} strokeWidth={2.2} />
      <path d="M36 48 h18 M36 60 h18 M36 72 h12" stroke={INK} strokeWidth={2.4} strokeLinecap="round" opacity={0.55} />
    </svg>
  )
}

/** 학생 작품 게시판 — 제출 사진 자리. 사진이 없으면 그라디언트 플레이스홀더. */
export function WorkBoard({ works, width = 300 }: { works: (string | null)[]; width?: number }) {
  return (
    <div
      className="rounded-[18px] p-3"
      style={{ background: '#F3E3CC', border: `2px solid ${INK}`, width }}
    >
      <div className="grid grid-cols-3 gap-2">
        {works.slice(0, 6).map((w, i) => (
          <div
            key={i}
            className="rounded-[10px]"
            style={{
              aspectRatio: '4 / 3',
              border: `2px solid ${INK}`,
              background: w
                ? `center/cover url(${photoSrc(w)})`
                : `linear-gradient(140deg, ${['#FFD6E5', '#C5EBDD', '#D9D2F5', '#FFF0B3', '#FFC9B5', '#BFE3EF'][i % 6]}, #FFF6EC)`,
            }}
          />
        ))}
      </div>
    </div>
  )
}
