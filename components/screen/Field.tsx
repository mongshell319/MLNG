'use client'

import { Mallang } from '@/components/mallang/Mallang'
import { EXPEDITION_BY_KEY } from '@/lib/domain/master'
import type { ExpeditionType, WorldSnapshot } from '@/lib/domain/types'

/**
 * C1 상태 3 — 원정 필드. 유형 7종.
 *
 * 1920×1080 좌표계의 SVG 한 장이라 학생 화면(S7)에서 그대로 축소해 쓴다.
 * 세 클라이언트가 같은 그림을 보는 것이 이 화면의 요점이다.
 * 제출 1건마다 prog가 오르고 그 즉시 여기 반영된다.
 */

const INK = '#6E5A54'
const FOG = '#D8D2CC'

function Ground() {
  return (
    <>
      <rect x={0} y={0} width={1920} height={1080} fill="#EFEFE6" />
      <path d="M0 0 H1920 V520 Q1440 440 960 500 T0 460 Z" fill="#D9F0F7" />
      <path d="M0 460 Q480 400 960 470 T1920 430 V1080 H0 Z" fill="#CFE0D4" />
      <path d="M0 700 Q560 620 1100 700 T1920 660 V1080 H0 Z" fill="#A9C4B2" />
    </>
  )
}

function Tree({ x, y, s = 1, opacity = 1 }: { x: number; y: number; s?: number; opacity?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={opacity}>
      <path d="M0 0 v-90" stroke={INK} strokeWidth={10} strokeLinecap="round" />
      <circle cx={0} cy={-120} r={62} fill="#8FBF9E" stroke={INK} strokeWidth={5} />
      <circle cx={-42} cy={-84} r={38} fill="#8FBF9E" stroke={INK} strokeWidth={5} />
      <circle cx={44} cy={-88} r={34} fill="#8FBF9E" stroke={INK} strokeWidth={5} />
    </g>
  )
}

/** ① 탐사 — 안개가 물러나며 나무·오솔길·먼 실루엣이 드러난다. */
function Explore({ prog }: { prog: number }) {
  const clear = prog / 100
  return (
    <>
      <Ground />
      <path
        d="M840 1080 Q900 860 960 760 T1080 560"
        stroke="#EAD9C2"
        strokeWidth={110}
        strokeLinecap="round"
        fill="none"
        opacity={0.35 + clear * 0.65}
      />
      {[
        [300, 880, 1.1],
        [560, 800, 0.9],
        [1420, 860, 1.05],
        [1660, 790, 0.85],
        [1180, 720, 0.7],
      ].map(([x, y, s], i) => (
        <Tree key={i} x={x} y={y} s={s} opacity={Math.max(0, Math.min(1, clear * 1.6 - i * 0.15))} />
      ))}
      {/* 먼 실루엣 */}
      <path
        d="M620 520 L760 330 L900 520 Z M1080 520 L1230 300 L1380 520 Z"
        fill="#A9C4B2"
        opacity={Math.max(0, clear * 1.2 - 0.4)}
      />
      {/* 안개 레이어 — 물러난다. 시작부터 완전히 덮지는 않는다:
          어디에 와 있는지는 보여야 "물러난다"가 사건이 된다. */}
      <g className="anim-fogmove" opacity={0.86 - clear * 0.8}>
        <rect x={-100} y={300} width={2120} height={780} fill={FOG} opacity={0.72} />
        <ellipse cx={520} cy={520} rx={520} ry={190} fill={FOG} />
        <ellipse cx={1440} cy={560} rx={560} ry={210} fill={FOG} />
      </g>
    </>
  )
}

/** ② 수색 — 숨은 오브젝트에 하나씩 불이 켜진다. */
function Search({ prog, count }: { prog: number; count: number }) {
  const lit = Math.round((prog / 100) * count)
  return (
    <>
      <Ground />
      <Tree x={280} y={900} s={1.1} />
      <Tree x={1620} y={880} s={1} />
      {Array.from({ length: count }).map((_, i) => {
        const col = i % 6
        const row = Math.floor(i / 6)
        const x = 340 + col * 250
        const y = 470 + row * 210
        const on = i < lit
        return (
          <g key={i} className={on ? 'anim-popin' : undefined}>
            <circle
              cx={x}
              cy={y}
              r={46}
              fill={on ? '#FFF0B3' : '#EFEAE2'}
              stroke={on ? '#B8933A' : '#D8D2CC'}
              strokeWidth={4}
            />
            {on && <circle cx={x} cy={y} r={70} fill="#FFF0B3" opacity={0.35} className="anim-twinkle" />}
          </g>
        )
      })}
      <g className="anim-fogmove" opacity={0.55 - (prog / 100) * 0.4}>
        <rect x={-100} y={380} width={2120} height={700} fill={FOG} opacity={0.6} />
      </g>
    </>
  )
}

/** ③ 돌파 — 끊긴 다리에 판자가 이어진다. */
function Breach({ prog }: { prog: number }) {
  const planks = 10
  const done = Math.round((prog / 100) * planks)
  return (
    <>
      <Ground />
      <rect x={0} y={640} width={420} height={440} fill="#A9C4B2" />
      <rect x={1500} y={640} width={420} height={440} fill="#A9C4B2" />
      <rect x={420} y={700} width={1080} height={380} fill="#BFE3EF" opacity={0.55} />
      {Array.from({ length: planks }).map((_, i) => {
        const on = i < done
        return (
          <rect
            key={i}
            x={430 + i * 106}
            y={634}
            width={94}
            height={26}
            rx={12}
            fill={on ? '#EAD9C2' : '#EFEAE2'}
            stroke={on ? INK : '#D8D2CC'}
            strokeWidth={4}
            className={on ? 'anim-popin' : undefined}
            opacity={on ? 1 : 0.5}
          />
        )
      })}
      <path d="M420 620 v-90 M1500 620 v-90" stroke={INK} strokeWidth={10} strokeLinecap="round" />
      <path d="M420 530 q540 -120 1080 0" stroke={INK} strokeWidth={7} fill="none" opacity={0.5} />
    </>
  )
}

/** ④ 복구 — 부서진 구조물 9칸에 학생 제출 사진이 실제 파츠로 붙는다. */
function Repair({ parts }: { parts: (string | null)[] }) {
  return (
    <>
      <Ground />
      <rect x={600} y={300} width={720} height={720} rx={36} fill="#EFEAE2" stroke={INK} strokeWidth={6} />
      {Array.from({ length: 9 }).map((_, i) => {
        const col = i % 3
        const row = Math.floor(i / 3)
        const x = 630 + col * 226
        const y = 330 + row * 226
        const src = parts[i]
        return (
          <g key={i} className={src ? 'anim-popin' : undefined}>
            <rect
              x={x}
              y={y}
              width={206}
              height={206}
              rx={20}
              fill={src ? '#FFF6EC' : '#E4DED6'}
              stroke={src ? INK : '#D8D2CC'}
              strokeWidth={5}
              strokeDasharray={src ? undefined : '14 12'}
            />
            {src && (
              <image href={src} x={x + 6} y={y + 6} width={194} height={194} preserveAspectRatio="xMidYMid slice" clipPath="inset(0 round 16px)" />
            )}
          </g>
        )
      })}
      <Tree x={260} y={940} s={1.1} />
      <Tree x={1680} y={920} s={0.95} />
    </>
  )
}

/** ⑤ 운반 — 커다란 물건이 참여자 수만큼 왼쪽에서 오른쪽으로 이동한다. */
function Carry({ prog }: { prog: number }) {
  const x = 260 + (prog / 100) * 1180
  return (
    <>
      <Ground />
      <path d="M180 900 H1740" stroke="#EAD9C2" strokeWidth={70} strokeLinecap="round" />
      <g style={{ transform: `translateX(${x - 260}px)`, transition: 'transform 900ms ease-out' }}>
        <rect x={180} y={640} width={280} height={230} rx={28} fill="#FFC9B5" stroke={INK} strokeWidth={6} />
        <path d="M180 720 h280 M320 640 v230" stroke={INK} strokeWidth={5} opacity={0.5} />
        <g transform="translate(140 760)">
          <Mallang size={140} face="focus" color="#C5EBDD" />
        </g>
        <g transform="translate(450 770)">
          <Mallang size={130} face="focus" color="#FFD6E5" />
        </g>
      </g>
      <path d="M1740 830 v-120" stroke={INK} strokeWidth={8} strokeLinecap="round" />
      <path d="M1740 710 h-110 v70 h110" fill="#FFF0B3" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
    </>
  )
}

/** ⑥ 해독 — 고대 문양 12칸이 하나씩 채워지며 문장이 완성된다. */
function Decode({ prog }: { prog: number }) {
  const filled = Math.round((prog / 100) * 12)
  return (
    <>
      <Ground />
      <rect x={300} y={330} width={1320} height={480} rx={40} fill="#EFEAE2" stroke={INK} strokeWidth={6} />
      {Array.from({ length: 12 }).map((_, i) => {
        const col = i % 6
        const row = Math.floor(i / 6)
        const x = 350 + col * 212
        const y = 380 + row * 212
        const on = i < filled
        return (
          <g key={i} className={on ? 'anim-popin' : undefined}>
            <rect
              x={x}
              y={y}
              width={180}
              height={180}
              rx={22}
              fill={on ? '#D9D2F5' : '#E4DED6'}
              stroke={on ? '#7A6BB5' : '#D8D2CC'}
              strokeWidth={5}
            />
            {on && (
              <path
                d={`M${x + 48} ${y + 120} q${45} -${90} ${90} 0 M${x + 90} ${y + 52} v22`}
                stroke="#7A6BB5"
                strokeWidth={9}
                strokeLinecap="round"
                fill="none"
              />
            )}
          </g>
        )
      })}
    </>
  )
}

/** ⑦ 레이드 — 잠든 큰 나무의 실타래가 한 가닥씩 풀린다. 위협적이지 않게. */
function Raid({ prog }: { prog: number }) {
  const strands = 8
  const loosened = Math.round((prog / 100) * strands)
  return (
    <>
      <Ground />
      <g transform="translate(960 700)">
        <path d="M-60 320 v-300" stroke={INK} strokeWidth={46} strokeLinecap="round" />
        <path d="M60 320 v-260" stroke={INK} strokeWidth={38} strokeLinecap="round" />
        <circle cx={0} cy={-140} r={330} fill="#8FBF9E" stroke={INK} strokeWidth={8} />
        <circle cx={-230} cy={20} r={180} fill="#8FBF9E" stroke={INK} strokeWidth={8} />
        <circle cx={240} cy={0} r={200} fill="#8FBF9E" stroke={INK} strokeWidth={8} />
        {/* 잠든 표정 */}
        <path d="M-120 -160 h80 M40 -160 h80" stroke={INK} strokeWidth={11} strokeLinecap="round" />
        <text x={180} y={-300} fontSize={72} fontFamily="Jua" fill={INK}>
          z z
        </text>
        {Array.from({ length: strands }).map((_, i) => {
          const loose = i < loosened
          const angle = -70 + i * 20
          return (
            <path
              key={i}
              d={`M0 -140 q${angle * 3} ${160 + i * 20} ${angle * 5} ${330}`}
              stroke={loose ? '#FFF0B3' : '#B8A99E'}
              strokeWidth={loose ? 6 : 10}
              fill="none"
              opacity={loose ? 0.45 : 1}
              strokeLinecap="round"
            />
          )
        })}
      </g>
    </>
  )
}

export function FieldScene({
  world,
  className,
  style,
}: {
  world: WorldSnapshot
  className?: string
  style?: React.CSSProperties
}) {
  const { session } = world
  const prog = session.prog
  const hiddenCount = Math.max(6, Math.min(12, Math.round(world.mallangs.length * 0.8)))

  const scene: Record<ExpeditionType, React.ReactNode> = {
    explore: <Explore prog={prog} />,
    search: <Search prog={prog} count={hiddenCount} />,
    breach: <Breach prog={prog} />,
    repair: <Repair parts={session.repairParts} />,
    carry: <Carry prog={prog} />,
    decode: <Decode prog={prog} />,
    raid: <Raid prog={prog} />,
  }

  return (
    <svg viewBox="0 0 1920 1080" className={className} style={style} preserveAspectRatio="xMidYMid slice" aria-label="원정 필드">
      {scene[session.expeditionType]}
    </svg>
  )
}

/** 상단 구간명 + 유형 아이콘 배지. TV와 학생 화면이 같은 문구를 쓴다. */
export function SegmentBadge({ world, size = 'tv' }: { world: WorldSnapshot; size?: 'tv' | 'student' }) {
  const site = world.sites.find((s) => s.id === world.session.siteId)
  const seg = site?.segments[world.session.segmentIndex]
  const type = EXPEDITION_BY_KEY[world.session.expeditionType]
  const tv = size === 'tv'
  return (
    <div
      className="inline-flex items-center gap-4 rounded-[20px]"
      style={{
        background: '#FFF6EC',
        border: `${tv ? 2 : 1.5}px solid #E8D9C8`,
        padding: tv ? '14px 28px' : '8px 16px',
      }}
    >
      <span className="font-display" style={{ fontSize: tv ? 38 : 18 }}>
        {site?.name} · {seg?.name}
      </span>
      <span
        className="rounded-full font-bold"
        style={{
          background: '#D9D2F5',
          color: '#7A6BB5',
          fontSize: tv ? 30 : 14,
          padding: tv ? '6px 20px' : '3px 12px',
        }}
      >
        {type.label}
      </span>
    </div>
  )
}
