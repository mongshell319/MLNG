import type { ClassRole, ExpeditionType, QuestKind } from '@/lib/domain/types'

/**
 * 라인 아이콘.
 * 전부 라운드 스트로크 · currentColor 단색 · 채움 없음.
 * 계열색에는 항상 계열 아이콘을 병행한다 — 적록색약 대응 (§3 추가 제약).
 */

interface IconProps {
  size?: number
  className?: string
  strokeWidth?: number
}

function svg(props: IconProps, viewBox: string, children: React.ReactNode) {
  const { size = 16, className, strokeWidth = 2 } = props
  return (
    <svg
      width={size}
      height={size}
      viewBox={viewBox}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {children}
    </svg>
  )
}

/** 메인 = 깃발. 아이콘은 전부 정사각 viewBox 라야 크기를 줘도 찌그러지지 않는다. */
export const FlagIcon = (p: IconProps) => svg(p, '0 0 16 16', <><path d="M4 1.5 v13" /><path d="M4 2.5 h9 l-2.6 3 2.6 3 h-9" /></>)
/** 사이드 = 쪽지 */
export const NoteIcon = (p: IconProps) => svg(p, '0 0 16 16', <><path d="M3 2 h10 v9 l-3 3 h-7 Z" /><path d="M13 11 h-3 v3" /><path d="M6 6 h6 M6 9 h4" /></>)
/** 길드 = 집 */
export const HouseIcon = (p: IconProps) => svg(p, '0 0 16 16', <><path d="M2 7 L8 2 L14 7" /><path d="M4 7 v7 h8 V7" /><path d="M7 14 v-4 h2 v4" /></>)
/** 돌발 = 번개 */
export const BoltIcon = (p: IconProps) => svg(p, '0 0 16 16', <path d="M9 1 L4 9 h3.5 L7 15 L12 7 H8.5 Z" />)

export const LockIcon = (p: IconProps) => svg(p, '0 0 16 16', <><rect x={3} y={7} width={10} height={7} rx={2.4} /><path d="M5.5 7 V5 a2.5 2.5 0 0 1 5 0 v2" /></>)
export const MapPinIcon = (p: IconProps) => svg(p, '0 0 16 16', <><path d="M8 14 s5-4.6 5-8a5 5 0 0 0-10 0c0 3.4 5 8 5 8Z" /><circle cx={8} cy={6} r={1.8} /></>)
export const StampIcon = (p: IconProps) => svg(p, '0 0 16 16', <><rect x={2.5} y={9} width={11} height={4.5} rx={1.6} /><path d="M6 9 V6.5 a2 2 0 1 1 4 0 V9" /></>)
export const HeartIcon = (p: IconProps) => svg(p, '0 0 16 16', <path d="M8 13.5 C3 10 1.5 7.6 1.5 5.6 A3.6 3.6 0 0 1 8 3.6 a3.6 3.6 0 0 1 6.5 2 c0 2-1.5 4.4-6.5 7.9Z" />)
export const SparkIcon = (p: IconProps) => svg(p, '0 0 16 16', <><path d="M8 1.5 L9.6 6.2 L14.5 8 L9.6 9.8 L8 14.5 L6.4 9.8 L1.5 8 L6.4 6.2 Z" /></>)
export const BasketIcon = (p: IconProps) => svg(p, '0 0 16 16', <><path d="M2 6 h12 l-1.4 8 h-9.2 Z" /><path d="M5.5 6 L8 2 l2.5 4" /></>)
export const EnvelopeIcon = (p: IconProps) => svg(p, '0 0 16 16', <><rect x={2} y={3.5} width={12} height={9} rx={2} /><path d="M2.6 4.6 L8 9 l5.4-4.4" /></>)
export const BookIcon = (p: IconProps) => svg(p, '0 0 16 16', <><path d="M3 2.5 h4.2 A1.8 1.8 0 0 1 9 4.3 V14 a1.6 1.6 0 0 0-1.6-1.4H3Z" /><path d="M13 2.5 H8.8 A1.8 1.8 0 0 0 7 4.3 V14 a1.6 1.6 0 0 1 1.6-1.4H13Z" /></>)

export const SunIcon = (p: IconProps) => svg(p, '0 0 16 16', <><circle cx={8} cy={8} r={3.4} /><path d="M8 1 v1.6 M8 13.4 V15 M1 8 h1.6 M13.4 8 H15 M3.2 3.2 l1.1 1.1 M11.7 11.7 l1.1 1.1 M12.8 3.2 l-1.1 1.1 M4.3 11.7 l-1.1 1.1" /></>)
export const CloudIcon = (p: IconProps) => svg(p, '0 0 16 16', <path d="M4.5 12 h6.8 a2.7 2.7 0 0 0 .3-5.4 A3.8 3.8 0 0 0 4.3 7.2 A2.4 2.4 0 0 0 4.5 12Z" />)
export const StarfallIcon = (p: IconProps) => svg(p, '0 0 16 16', <><path d="M2 5 L5 8 M8 2 L11 5 M4 12 L7 9" /><path d="M11 9 l1 2.2 2.4.3 -1.7 1.7 .4 2.4 -2.1-1.1 -2.1 1.1 .4-2.4 -1.7-1.7 2.4-.3Z" /></>)

/** 클래스 5직 아이콘 — 이름 옆에 항상 붙는다. */
export function ClassIcon({ role, ...p }: IconProps & { role: ClassRole }) {
  switch (role) {
    case 'scout':
      return svg(p, '0 0 16 16', <><circle cx={7} cy={7} r={4.5} /><path d="M10.4 10.4 L14 14" /></>)
    case 'maker':
      return svg(p, '0 0 16 16', <><circle cx={8} cy={8} r={2.4} /><path d="M8 1.6 v2 M8 12.4 v2 M1.6 8 h2 M12.4 8 h2 M3.5 3.5 l1.4 1.4 M11.1 11.1 l1.4 1.4 M12.5 3.5 l-1.4 1.4 M4.9 11.1 l-1.4 1.4" /></>)
    case 'herald':
      return svg(p, '0 0 16 16', <><path d="M2.5 6.5 L12 3 v10 L2.5 9.5 Z" /><path d="M5 9.8 v3.2" /></>)
    case 'vanguard':
      return svg(p, '0 0 16 16', <><path d="M8 1.8 L13.5 4 v4.4 c0 3-2.6 4.8-5.5 5.8 -2.9-1-5.5-2.8-5.5-5.8V4Z" /><path d="M8 5.4 v4" /></>)
    case 'warden':
      return svg(p, '0 0 16 16', <><path d="M3 13 V6.5 L8 2.5 l5 4 V13" /><path d="M6.2 13 V9.4 h3.6 V13" /></>)
  }
}

/** 원정 유형 7종 아이콘 — 발행 화면에서 나란히 놓인다. */
export function ExpeditionIcon({ type, ...p }: IconProps & { type: ExpeditionType }) {
  switch (type) {
    case 'explore':
      return svg(p, '0 0 16 16', <><path d="M2 11 q3-4 6-1 t6-3" /><path d="M4 14 h8" /><path d="M8 3 v3" /></>)
    case 'search':
      return svg(p, '0 0 16 16', <><circle cx={7} cy={7} r={4.2} /><path d="M10.2 10.2 L14 14" /><path d="M7 5.2 v3.6 M5.2 7 h3.6" /></>)
    case 'breach':
      return svg(p, '0 0 16 16', <><path d="M1.5 6 h5 M9.5 6 h5" /><path d="M3 6 v7 M13 6 v7" /><path d="M6.5 9 h3" /></>)
    case 'repair':
      return svg(p, '0 0 16 16', <><rect x={2.5} y={2.5} width={11} height={11} rx={2} /><path d="M2.5 8 h11 M8 2.5 v11" /></>)
    case 'carry':
      return svg(p, '0 0 16 16', <><rect x={2} y={5} width={8} height={7} rx={1.8} /><path d="M11 8.5 h3.2 M12.4 6.8 L14.2 8.5 12.4 10.2" /></>)
    case 'decode':
      return svg(p, '0 0 16 16', <><rect x={2} y={3} width={12} height={10} rx={2} /><path d="M5 6.5 h2 M9 6.5 h2 M5 10 h6" /></>)
    case 'raid':
      return svg(p, '0 0 16 16', <><circle cx={8} cy={6} r={4.4} /><path d="M8 10.4 V14" /><path d="M5 14 h6" /></>)
  }
}

export function KindIcon({ kind, ...p }: IconProps & { kind: QuestKind }) {
  if (kind === 'main') return <FlagIcon {...p} />
  if (kind === 'side') return <NoteIcon {...p} />
  if (kind === 'guild') return <HouseIcon {...p} />
  return <BoltIcon {...p} />
}

export function WeatherIcon({ weather, ...p }: IconProps & { weather: string }) {
  if (weather === '구름 조금') return <CloudIcon {...p} />
  if (weather === '별똥별 소나기') return <StarfallIcon {...p} />
  return <SunIcon {...p} />
}
