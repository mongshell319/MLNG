import type { Accessory, EvolutionForm, Face } from '@/lib/domain/types'

/**
 * 말랑이 (§2.1).
 *
 * 프로토타입의 M(color, face, size, accessory, form)을 그대로 옮긴 것이다.
 * 파츠 레이어 구조(몸 무늬 1장 + 머리 파츠 1장 + 색조)를 유지해야
 * 진화 5형태와 악세서리 한 슬롯이 서로 간섭 없이 겹친다.
 *
 * viewBox 0 0 100 110 · 가로:세로 = 1:1.1 · 아래가 살짝 퍼진 물방울 실루엣.
 * 볼터치는 필수. 부정 감정 표정은 이 세계에 존재하지 않으므로 만들지 않는다.
 */

const INK = '#6E5A54'
const BEAK = '#FFD34D'
const BLUSH = '#FFB3C6'

function star(cx: number, cy: number): string {
  return `M${cx} ${cy - 4.5} l1.3 2.8 3 .3 -2.2 2 .6 3 -2.7-1.5 -2.7 1.5 .6-3 -2.2-2 3-.3 Z`
}

export interface MallangProps {
  color?: string
  face?: Face
  size?: number
  accessory?: Accessory
  form?: EvolutionForm
  className?: string
  style?: React.CSSProperties
  title?: string
}

export function Mallang({
  color = '#FFD6E5',
  face = 'base',
  size = 80,
  accessory = '',
  form = 'base',
  className,
  style,
  title,
}: MallangProps) {
  const parts: React.ReactNode[] = []

  // 망토는 몸 뒤 레이어 — 불씨말랑
  if (form === 'fire') {
    parts.push(
      <path
        key="cape"
        d="M26 40 q-9 30 -2 54 q13 6 26 6 q13 0 26 -6 q7 -24 -2 -54 Z"
        fill="#FFC9B5"
        stroke={INK}
        strokeWidth={2.4}
        strokeLinejoin="round"
      />,
      <path
        key="hair"
        d="M50 13 q-4 -8 1 -12 q3 5 7 1 q1 7 -3 11 Z"
        fill={BEAK}
        stroke={INK}
        strokeWidth={2}
        strokeLinejoin="round"
      />,
    )
  } else {
    parts.push(
      <path key="hair" d="M50 13 q-2 -9 8 -11" fill="none" stroke={INK} strokeWidth={3} strokeLinecap="round" />,
    )
  }

  parts.push(
    <ellipse key="foot1" cx={39} cy={103} rx={7} ry={4.5} fill={BEAK} stroke={INK} strokeWidth={2.2} />,
    <ellipse key="foot2" cx={61} cy={103} rx={7} ry={4.5} fill={BEAK} stroke={INK} strokeWidth={2.2} />,
    <path
      key="body"
      d="M50 14 C33 18 21 40 21 64 C21 87 33 100 50 100 C67 100 79 87 79 64 C79 40 67 18 50 14 Z"
      fill={color}
      stroke={INK}
      strokeWidth={3}
    />,
    <ellipse key="wing1" cx={20} cy={66} rx={5.5} ry={10} fill={color} stroke={INK} strokeWidth={2.2} />,
    <ellipse key="wing2" cx={80} cy={66} rx={5.5} ry={10} fill={color} stroke={INK} strokeWidth={2.2} />,
  )

  // 몸 무늬 레이어 — 형태마다 한 장
  if (form === 'tinker') {
    parts.push(
      <circle key="pat1" cx={50} cy={82} r={9} fill="none" stroke={INK} strokeWidth={2} opacity={0.5} />,
      <circle key="pat2" cx={50} cy={82} r={3.4} fill="none" stroke={INK} strokeWidth={2} opacity={0.5} />,
    )
  }
  if (form === 'book') {
    parts.push(
      <path
        key="pat1"
        d="M40 80 h20 M40 86 h14"
        stroke={INK}
        strokeWidth={2}
        strokeLinecap="round"
        opacity={0.42}
      />,
    )
  }
  if (form === 'sprout') {
    parts.push(
      <path
        key="pat1"
        d="M74 78 q-2 -12 -12 -14 q2 12 12 14 Z"
        fill="#C5EBDD"
        stroke="#4A8B6F"
        strokeWidth={2}
        strokeLinejoin="round"
      />,
    )
  }

  // 볼터치 — 온기말랑만 하트형
  if (form === 'warm') {
    parts.push(
      <path
        key="blush1"
        d="M32 64 c-2.6 -3.4 -7 -1.4 -7 1.6 c0 2.8 4.2 4.6 7 6.4 c2.8 -1.8 7 -3.6 7 -6.4 c0 -3 -4.4 -5 -7 -1.6 Z"
        fill={BLUSH}
      />,
      <path
        key="blush2"
        d="M68 64 c-2.6 -3.4 -7 -1.4 -7 1.6 c0 2.8 4.2 4.6 7 6.4 c2.8 -1.8 7 -3.6 7 -6.4 c0 -3 -4.4 -5 -7 -1.6 Z"
        fill={BLUSH}
      />,
    )
  } else {
    parts.push(
      <ellipse key="blush1" cx={32} cy={64} rx={5.5} ry={3.2} fill={BLUSH} />,
      <ellipse key="blush2" cx={68} cy={64} rx={5.5} ry={3.2} fill={BLUSH} />,
    )
  }

  // 표정 8종
  if (face === 'full') {
    parts.push(
      <path key="eye1" d="M35 56 q5 6 11 0" fill="none" stroke={INK} strokeWidth={2.6} strokeLinecap="round" />,
      <path key="eye2" d="M54 56 q5 6 11 0" fill="none" stroke={INK} strokeWidth={2.6} strokeLinecap="round" />,
    )
  } else if (face === 'star') {
    parts.push(
      <path key="eye1" d={star(41, 56)} fill={BEAK} stroke={INK} strokeWidth={1.4} strokeLinejoin="round" />,
      <path key="eye2" d={star(59, 56)} fill={BEAK} stroke={INK} strokeWidth={1.4} strokeLinejoin="round" />,
    )
  } else if (face === 'glad') {
    parts.push(
      <circle key="eye1" cx={41} cy={55} r={3.1} fill={INK} />,
      <circle key="eye2" cx={59} cy={55} r={3.1} fill={INK} />,
      <circle key="gl1" cx={42.2} cy={53.8} r={1} fill="#FFFFFF" />,
      <circle key="gl2" cx={60.2} cy={53.8} r={1} fill="#FFFFFF" />,
    )
  } else if (face === 'focus') {
    parts.push(
      <path key="eye1" d="M36 54 h9" stroke={INK} strokeWidth={3} strokeLinecap="round" />,
      <path key="eye2" d="M55 54 h9" stroke={INK} strokeWidth={3} strokeLinecap="round" />,
      <path key="br1" d="M35 47 l10 3" stroke={INK} strokeWidth={2.2} strokeLinecap="round" />,
      <path key="br2" d="M65 47 l-10 3" stroke={INK} strokeWidth={2.2} strokeLinecap="round" />,
    )
  } else if (face === 'surprise') {
    parts.push(
      <circle key="eye1" cx={41} cy={54} r={4} fill="none" stroke={INK} strokeWidth={2.4} />,
      <circle key="eye2" cx={59} cy={54} r={4} fill="none" stroke={INK} strokeWidth={2.4} />,
    )
  } else if (face === 'sleepy') {
    parts.push(
      <path key="eye1" d="M35 55 q5 4 11 0" fill="none" stroke={INK} strokeWidth={2.6} strokeLinecap="round" />,
      <path key="eye2" d="M54 55 q5 4 11 0" fill="none" stroke={INK} strokeWidth={2.6} strokeLinecap="round" />,
    )
  } else if (face === 'sleep') {
    parts.push(
      <path key="eye1" d="M36 56 h9" stroke={INK} strokeWidth={2.6} strokeLinecap="round" />,
      <path key="eye2" d="M55 56 h9" stroke={INK} strokeWidth={2.6} strokeLinecap="round" />,
      <text key="z" x={72} y={36} fontSize={13} fontWeight={700} fill={INK} fontFamily="Jua">
        z z
      </text>,
    )
  } else {
    parts.push(
      <circle key="eye1" cx={41} cy={55} r={2.6} fill={INK} />,
      <circle key="eye2" cx={59} cy={55} r={2.6} fill={INK} />,
    )
  }

  parts.push(
    <path
      key="beak"
      d={face === 'star' ? 'M44 61 L56 61 L50 71 Z' : 'M45 61 L55 61 L50 68.5 Z'}
      fill={BEAK}
      stroke={INK}
      strokeWidth={2}
      strokeLinejoin="round"
    />,
  )

  // 악세서리 — 머리 위 한 슬롯
  if (accessory === 'goggle') {
    parts.push(
      <rect key="ac1" x={31} y={25} width={38} height={7} rx={3.5} fill="#C5EBDD" stroke={INK} strokeWidth={2} />,
      <circle key="ac2" cx={50} cy={28} r={8} fill="#FFF0B3" stroke={INK} strokeWidth={2} />,
    )
  }
  if (accessory === 'ribbon') {
    parts.push(
      <path
        key="ac1"
        d="M50 11 l-13 -7 v14 Z M50 11 l13 -7 v14 Z"
        fill={BLUSH}
        stroke={INK}
        strokeWidth={2}
        strokeLinejoin="round"
      />,
    )
  }
  if (accessory === 'strawhat') {
    parts.push(
      <ellipse key="ac1" cx={50} cy={15} rx={22} ry={6} fill="#FFF0B3" stroke={INK} strokeWidth={2} />,
      <path key="ac2" d="M38 14 q0 -12 12 -12 q12 0 12 12" fill="#FFF0B3" stroke={INK} strokeWidth={2} />,
    )
  }
  if (accessory === 'crown') {
    parts.push(
      <path
        key="ac1"
        d="M38 14 L39 4 L45 9 L50 2 L55 9 L61 4 L62 14 Z"
        fill="#FFF0B3"
        stroke="#B8933A"
        strokeWidth={2}
        strokeLinejoin="round"
      />,
    )
  }
  if (accessory === 'sprout') {
    parts.push(
      <path
        key="ac1"
        d="M50 12 v-6 M50 6 q-8 -6 -12 0 q6 4 12 0 M50 6 q8 -6 12 0 q-6 4 -12 0"
        fill="#C5EBDD"
        stroke="#4A8B6F"
        strokeWidth={2}
        strokeLinejoin="round"
      />,
    )
  }
  if (accessory === 'starpin') {
    parts.push(
      <path key="ac1" d={star(50, 8)} fill="#FFF0B3" stroke="#B8933A" strokeWidth={1.6} strokeLinejoin="round" />,
    )
  }
  if (accessory === 'glasses') {
    parts.push(
      <circle key="ac1" cx={41} cy={55} r={7.5} fill="rgba(255,255,255,.55)" stroke={INK} strokeWidth={2} />,
      <circle key="ac2" cx={59} cy={55} r={7.5} fill="rgba(255,255,255,.55)" stroke={INK} strokeWidth={2} />,
      <path key="ac3" d="M48.5 55 h3" stroke={INK} strokeWidth={2} />,
    )
  }
  if (accessory === 'scarf') {
    parts.push(
      <path
        key="ac1"
        d="M28 70 q22 12 44 0 l-2 10 q-20 11 -40 0 Z"
        fill={BLUSH}
        stroke={INK}
        strokeWidth={2}
        strokeLinejoin="round"
      />,
    )
  }

  // 머리 파츠 레이어 — 형태마다 한 장
  if (form === 'book') {
    parts.push(
      <circle key="fm1" cx={41} cy={55} r={8} fill="none" stroke={INK} strokeWidth={2} />,
      <circle key="fm2" cx={59} cy={55} r={8} fill="none" stroke={INK} strokeWidth={2} />,
      <path key="fm3" d="M49 55 h2" stroke={INK} strokeWidth={2} />,
      <path key="fm4" d="M58 12 l10 -12" stroke={INK} strokeWidth={2.4} strokeLinecap="round" />,
      <path key="fm5" d="M68 0 q9 1 8 9 q-9 1 -8 -9 Z" fill="#C5EBDD" stroke="#4A8B6F" strokeWidth={2} strokeLinejoin="round" />,
    )
  }
  if (form === 'tinker') {
    parts.push(
      <rect key="fm1" x={29} y={22} width={42} height={8} rx={4} fill="#C5EBDD" stroke={INK} strokeWidth={2} />,
      <circle key="fm2" cx={41} cy={26} r={8} fill="#FFF0B3" stroke={INK} strokeWidth={2} />,
      <circle key="fm3" cx={59} cy={26} r={8} fill="#FFF0B3" stroke={INK} strokeWidth={2} />,
    )
  }
  if (form === 'warm') {
    parts.push(
      <path
        key="fm1"
        d="M27 69 q23 13 46 0 l-2 11 q-21 12 -42 0 Z"
        fill={BLUSH}
        stroke={INK}
        strokeWidth={2.2}
        strokeLinejoin="round"
      />,
      <path
        key="fm2"
        d="M66 79 q7 6 5 15 q-6 2 -9 -3"
        fill={BLUSH}
        stroke={INK}
        strokeWidth={2.2}
        strokeLinejoin="round"
      />,
    )
  }
  if (form === 'sprout') {
    parts.push(
      <ellipse key="fm1" cx={50} cy={16} rx={23} ry={6.5} fill="#FFF0B3" stroke={INK} strokeWidth={2} />,
      <path key="fm2" d="M37 15 q0 -13 13 -13 q13 0 13 13" fill="#FFF0B3" stroke={INK} strokeWidth={2} />,
    )
  }

  return (
    <svg
      width={size}
      height={Math.round(size * 1.1)}
      viewBox="0 0 100 110"
      className={className}
      style={style}
      role={title ? 'img' : 'presentation'}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {parts}
    </svg>
  )
}
