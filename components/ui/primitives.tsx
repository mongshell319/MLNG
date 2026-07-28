'use client'

import { Mallang } from '@/components/mallang/Mallang'
import { LockIcon } from './Icons'

/**
 * 공용 프리미티브.
 * 카드 radius 20 · 모달 24 · 버튼 알약 · 외곽선 1.5px(학생/교사) 2px(TV) · 그림자 없음.
 */

export function Card({
  tint = '#FFFFFF',
  line = '#E8D9C8',
  width,
  className = '',
  style,
  children,
  onClick,
}: {
  tint?: string
  line?: string
  width?: number | string
  className?: string
  style?: React.CSSProperties
  children: React.ReactNode
  onClick?: () => void
}) {
  return (
    <div
      onClick={onClick}
      className={`rounded-[20px] ${onClick ? 'squishy cursor-pointer' : ''} ${className}`}
      style={{ background: tint, border: `1.5px solid ${line}`, width, ...style }}
    >
      {children}
    </div>
  )
}

export function PillButton({
  children,
  onClick,
  tint = '#FFC9B5',
  fg = '#6E5A54',
  line,
  size = 'md',
  full,
  disabled,
  /** 조건 미충족일 때 버튼 라벨이 이유를 말한다. 회색 비활성으로 두지 않는다. */
  reason,
  className = '',
  type = 'button',
}: {
  children: React.ReactNode
  onClick?: () => void
  tint?: string
  fg?: string
  line?: string
  size?: 'sm' | 'md' | 'lg' | 'tv'
  full?: boolean
  disabled?: boolean
  reason?: string
  className?: string
  type?: 'button' | 'submit'
}) {
  const h = { sm: 32, md: 42, lg: 52, tv: 72 }[size]
  const fs = { sm: 13, md: 16, lg: 18, tv: 32 }[size]
  const px = { sm: 14, md: 20, lg: 26, tv: 40 }[size]
  const blocked = Boolean(reason)
  return (
    <button
      type={type}
      onClick={blocked ? undefined : onClick}
      disabled={disabled}
      aria-disabled={blocked || undefined}
      className={`squishy rounded-full font-bold ${full ? 'w-full' : ''} ${className}`}
      style={{
        height: h,
        fontSize: fs,
        padding: `0 ${px}px`,
        background: blocked ? '#EFEAE2' : tint,
        color: blocked ? '#B8A99E' : fg,
        border: line ? `1.5px solid ${line}` : '1.5px solid transparent',
      }}
    >
      {blocked ? reason : children}
    </button>
  )
}

/** 잠긴 장소 — 회색 비활성이 아니라 자물쇠와 안내 문구로 (§3-9). */
export function LockedChip({ label, note = '쉬는 시간에 열려요' }: { label: string; note?: string }) {
  return (
    <div
      className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[14px] font-bold"
      style={{ background: '#EFEAE2', color: '#8C7A72', border: '1.5px solid #E8D9C8' }}
    >
      <LockIcon size={14} />
      <span>{label}</span>
      <span className="text-[12px] font-medium" style={{ color: '#B8A99E' }}>
        {note}
      </span>
    </div>
  )
}

/** 새 획득 알림. lemon 점 하나로만 알린다 (§3-6). */
export function NewDot({ size = 10, className = '' }: { size?: number; className?: string }) {
  return (
    <span
      className={`anim-twinkle inline-block rounded-full ${className}`}
      style={{ width: size, height: size, background: '#FFF0B3', border: '1.5px solid #B8933A' }}
      aria-label="새로 생긴 것"
    />
  )
}

export function Toast({ message }: { message: string }) {
  if (!message) return null
  return (
    <div
      className="anim-popin pointer-events-none fixed bottom-7 left-1/2 z-[90] -translate-x-1/2 rounded-full px-6 py-3 text-[15px] font-bold"
      style={{ background: '#FFF6EC', border: '1.5px solid #E8D9C8', color: '#6E5A54' }}
      role="status"
    >
      {message}
    </div>
  )
}

/** 오프라인·로딩 — 말랑이가 통통 튀는 로더 (§6). */
export function Loader({ label = '가는 중이에요' }: { label?: string }) {
  return (
    <div className="flex h-full min-h-[60vh] w-full flex-col items-center justify-center gap-4">
      <Mallang size={72} face="glad" className="anim-bounceload" />
      <div className="text-[15px] font-bold" style={{ color: '#B8A99E' }}>
        {label}
      </div>
    </div>
  )
}

/** '아직 안 깬 의뢰' 리본. 미완료를 부정 상태로 만들지 않는다 (§3-3). */
export function Ribbon({ text = '아직 안 깬 의뢰', tint = '#FFF0B3', fg = '#B8933A' }) {
  return (
    <span
      className="inline-block rounded-full px-3 py-1 text-[12px] font-bold"
      style={{ background: tint, color: fg, border: `1.5px solid ${fg}` }}
    >
      {text}
    </span>
  )
}

export function Gauge({
  value,
  max = 100,
  tint = '#D9D2F5',
  deep = '#7A6BB5',
  height = 14,
  width = '100%',
}: {
  value: number
  max?: number
  tint?: string
  deep?: string
  height?: number
  width?: number | string
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100))
  return (
    <div
      className="overflow-hidden rounded-full"
      style={{ width, height, background: '#FFF6EC', border: `1.5px solid ${deep}` }}
    >
      <div
        className="h-full rounded-full transition-[width] duration-700 ease-out"
        style={{ width: `${pct}%`, background: tint }}
      />
    </div>
  )
}

export function SectionTitle({ children, size = 18 }: { children: React.ReactNode; size?: number }) {
  return (
    <h2 className="font-display" style={{ fontSize: size, color: '#6E5A54' }}>
      {children}
    </h2>
  )
}
