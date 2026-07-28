'use client'

import { useState } from 'react'
import { Monument } from '@/components/screen/Buildings'
import { LockIcon, MapPinIcon } from '@/components/ui/Icons'
import type { WorldSnapshot } from '@/lib/domain/types'

/**
 * S9 — 대륙 지도. 4단 줌.
 *
 * 원경의 마을은 전부 같은 크기의 등불이다. 규모 비교를 차단하기 위해
 * 마을마다 다른 크기·다른 밝기를 주지 않는다 (§3-7).
 * 타 마을의 내부·작품·개인은 어느 줌에서도 보이지 않는다.
 */

// 학생 화면의 어휘 규칙(§3-4)에 따라 '학교'는 '영지'로만 부른다.
const ZOOMS = ['우리 마을', '우리 영지', '나라', '대륙'] as const

export function ContinentMap({ world }: { world: WorldSnapshot }) {
  const [zoom, setZoom] = useState(0)

  return (
    <div className="mx-auto w-full max-w-[1000px] px-5 pb-6 pt-4">
      <div className="flex justify-center gap-2">
        {ZOOMS.map((z, i) => (
          <button
            key={z}
            onClick={() => setZoom(i)}
            className="squishy rounded-full px-4 py-2 text-[13px] font-bold"
            style={{
              background: zoom === i ? '#D9D2F5' : '#FFFFFF',
              border: `1.5px solid ${zoom === i ? '#7A6BB5' : '#E8D9C8'}`,
              color: zoom === i ? '#7A6BB5' : '#8C7A72',
            }}
          >
            {z}
          </button>
        ))}
      </div>

      <div
        className="anim-popin mt-4 overflow-hidden rounded-[20px]"
        style={{
          height: 440,
          border: '1.5px solid #E8D9C8',
          background:
            zoom === 3
              ? 'linear-gradient(#3A3350, #5A4B62)'
              : 'linear-gradient(#D9F0F7 0%, #FFF6EC 46%, #CFE0D4 46%, #A9C4B2 100%)',
        }}
      >
        {zoom === 0 && <VillageZoom world={world} />}
        {zoom === 1 && <EstateZoom world={world} />}
        {zoom === 2 && <NationZoom />}
        {zoom === 3 && <ContinentZoom />}
      </div>
    </div>
  )
}

/** 내 마을 — 파노라마 미니와 주변 원정지 */
function VillageZoom({ world }: { world: WorldSnapshot }) {
  return (
    <div className="relative h-full w-full">
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
        <Lantern lit size={52} />
        <div className="mt-1 font-display text-[18px]">{world.village.name}</div>
      </div>

      {world.sites.map((s, i) => {
        const angle = (i / world.sites.length) * Math.PI * 2 - Math.PI / 2
        const left = 50 + Math.cos(angle) * 33
        const top = 50 + Math.sin(angle) * 33
        return (
          <div key={s.id} className="absolute -translate-x-1/2 -translate-y-1/2 text-center" style={{ left: `${left}%`, top: `${top}%` }}>
            <div
              className="rounded-[20px] px-4 py-3"
              style={{
                background: s.unlocked ? (s.cleared ? '#FFF0B3' : '#FFFFFF') : '#EFEAE2',
                border: `1.5px solid ${s.unlocked ? '#E8D9C8' : '#D8D2CC'}`,
                filter: s.unlocked ? undefined : 'blur(0.4px)',
                opacity: s.unlocked ? 1 : 0.75,
              }}
            >
              <div className="flex items-center justify-center gap-1.5">
                {!s.unlocked && (
                  <span style={{ color: '#8C7A72' }}>
                    <LockIcon size={12} />
                  </span>
                )}
                <span className="font-display text-[15px]" style={{ color: s.unlocked ? '#6E5A54' : '#8C7A72' }}>
                  {s.name}
                </span>
              </div>
              <div className="text-[11px]" style={{ color: '#B8A99E' }}>
                {s.unlocked ? (s.cleared ? '다녀온 곳' : `${s.segments.filter((g) => g.done).length}구간 열림`) : '단원을 진행하면 열려요'}
              </div>
            </div>
            {s.cleared && (
              <div className="mt-1 flex justify-center">
                <Monument size={30} />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

/** 학교 영지 — 우리 학교의 반 마을들. 전부 같은 크기 등불. */
function EstateZoom({ world }: { world: WorldSnapshot }) {
  const villages = [world.village.name, '느티 말랑 마을', '봄볕 말랑 마을', '돌담 말랑 마을']
  return (
    <div className="flex h-full flex-wrap items-center justify-center gap-10">
      {villages.map((v, i) => (
        <div key={v} className="text-center">
          <Lantern lit size={40} delay={i * 0.4} />
          <div className="mt-1 text-[14px] font-bold">{v}</div>
        </div>
      ))}
      <div className="w-full text-center text-[13px]" style={{ color: '#8C7A72' }}>
        말랑 영지 · 이웃 마을들
      </div>
    </div>
  )
}

/** 나라 — 우리 기수의 마을 영토. 한 해가 하나의 나라. */
function NationZoom() {
  return (
    <div className="relative h-full w-full">
      <svg viewBox="0 0 800 360" className="h-full w-full" aria-label="나라">
        <path d="M80 300 Q200 140 380 190 T720 150 L740 320 H70 Z" fill="#CFE0D4" stroke="#6E5A54" strokeWidth={2} />
        <path d="M180 250 q120 -60 240 -10" fill="none" stroke="#EAD9C2" strokeWidth={12} strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 flex flex-wrap items-center justify-center gap-8">
        {Array.from({ length: 8 }).map((_, i) => (
          <Lantern key={i} lit size={30} delay={i * 0.25} />
        ))}
      </div>
      <div className="absolute bottom-4 left-0 right-0 text-center text-[13px]" style={{ color: '#8C7A72' }}>
        2026 나라 · 한 반이 하나의 마을이에요
      </div>
    </div>
  )
}

/** 대륙 — 안개 속 등불들과 선배 기수의 나라들. */
function ContinentZoom() {
  return (
    <div className="relative h-full w-full overflow-hidden">
      <div className="anim-fogmove absolute inset-0" style={{ background: 'radial-gradient(closest-side, rgba(216,210,204,.35), transparent 70%)' }} />
      {Array.from({ length: 18 }).map((_, i) => (
        <div key={i} className="absolute" style={{ left: `${(i * 53) % 92 + 3}%`, top: `${(i * 37) % 78 + 8}%` }}>
          <Lantern lit size={22} delay={(i % 6) * 0.3} onDark />
        </div>
      ))}
      <div className="absolute bottom-4 left-0 right-0 text-center text-[13px]" style={{ color: '#D8D2CC' }}>
        말랑 대륙 · 지나간 나라들의 불도 그대로 켜져 있어요
      </div>
    </div>
  )
}

/** 등불 — 어느 줌에서도 모든 마을이 같은 크기다. */
function Lantern({ lit, size = 40, delay = 0, onDark = false }: { lit: boolean; size?: number; delay?: number; onDark?: boolean }) {
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <span
        className="anim-twinkle absolute rounded-full"
        style={{ width: size, height: size, background: '#FFF0B3', opacity: onDark ? 0.5 : 0.35, filter: 'blur(6px)', animationDelay: `${delay}s` }}
      />
      <span
        className="relative flex items-center justify-center rounded-full"
        style={{ width: size * 0.62, height: size * 0.62, background: lit ? '#FFF0B3' : '#EFEAE2', border: '1.5px solid #B8933A', color: '#B8933A' }}
      >
        <MapPinIcon size={size * 0.34} />
      </span>
    </div>
  )
}
