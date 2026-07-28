'use client'

import { Keeper } from '@/components/mallang/Keeper'
import { WeatherIcon } from '@/components/ui/Icons'
import { EXPEDITION_BY_KEY, WEATHER_DESC } from '@/lib/domain/master'
import type { WorldSnapshot } from '@/lib/domain/types'
import { Panorama } from './Panorama'

/**
 * C1 상태 2 — 오프닝 시퀀스 (40초).
 *
 * 어두워짐 → 게이트에 빛 번짐 → 날씨 카드 공개 → 오늘 향할 원정지·구간 →
 * 터줏말랑이 의뢰서를 들고 등장 → "원정 시작!"
 *
 * 게이트를 지나면 마을이 아니라 필드라는 것이 시각적으로 분명해야 한다.
 * 그래서 마지막 4초 동안 마을은 게이트 뒤로 완전히 가려진다.
 */

const BEATS = { dark: 0, gate: 5, weather: 13, place: 21, keeper: 29, title: 35, end: 40 }

export function Opening({ world, seconds }: { world: WorldSnapshot; seconds: number }) {
  const t = seconds
  const site = world.sites.find((s) => s.id === world.session.siteId)
  const seg = site?.segments[world.session.segmentIndex]
  const type = EXPEDITION_BY_KEY[world.session.expeditionType]
  const at = (from: number) => t >= from

  return (
    <div className="absolute inset-0 overflow-hidden">
      <Panorama world={world} now={Date.now()} dim />
      <div
        className="absolute inset-0"
        style={{
          background: '#3A3350',
          opacity: Math.min(0.82, 0.2 + t * 0.12),
          transition: 'opacity 600ms linear',
        }}
      />

      {/* 게이트 */}
      {at(BEATS.gate) && (
        <div className="anim-gatelight absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <svg width={760} height={860} viewBox="0 0 760 860" aria-label="게이트">
            <defs>
              <radialGradient id="glow">
                <stop offset="0%" stopColor="#FFF0B3" stopOpacity={0.95} />
                <stop offset="100%" stopColor="#FFF0B3" stopOpacity={0} />
              </radialGradient>
            </defs>
            <circle cx={380} cy={430} r={380} fill="url(#glow)" />
            <path
              d="M120 840 V330 a260 260 0 0 1 520 0 V840"
              fill="none"
              stroke="#FFF6EC"
              strokeWidth={26}
              strokeLinecap="round"
            />
            <path
              d="M190 840 V340 a190 190 0 0 1 380 0 V840 Z"
              fill={at(BEATS.title) ? '#FFF0B3' : '#FFF6EC'}
              opacity={at(BEATS.title) ? 0.92 : 0.14}
              style={{ transition: 'opacity 900ms ease-out, fill 900ms ease-out' }}
            />
          </svg>
        </div>
      )}

      {/* 날씨 카드 공개 */}
      {at(BEATS.weather) && !at(BEATS.title) && (
        <div
          className="anim-popin absolute left-[120px] top-[180px] flex items-center gap-6 rounded-[24px] px-10 py-7"
          style={{ background: '#FFF6EC', border: '2px solid #FFF0B3' }}
        >
          <span style={{ color: '#B8933A' }}>
            <WeatherIcon weather={world.village.weather} size={64} />
          </span>
          <div>
            <div className="font-display" style={{ fontSize: 48 }}>
              {world.village.weather}
            </div>
            <div style={{ fontSize: 32, color: '#8C7A72' }}>{WEATHER_DESC[world.village.weather]}</div>
          </div>
        </div>
      )}

      {/* 오늘 향할 원정지·구간 */}
      {at(BEATS.place) && !at(BEATS.title) && (
        <div
          className="anim-popin absolute right-[120px] top-[200px] rounded-[24px] px-10 py-8 text-right"
          style={{ background: '#FFF6EC', border: '2px solid #E8D9C8' }}
        >
          <div style={{ fontSize: 32, color: '#8C7A72' }}>오늘 향하는 곳</div>
          <div className="font-display" style={{ fontSize: 56 }}>
            {site?.name}
          </div>
          <div className="mt-2 font-display" style={{ fontSize: 40, color: '#7A6BB5' }}>
            {seg?.name} · {type.label}
          </div>
        </div>
      )}

      {/* 터줏말랑이 의뢰서를 들고 등장 */}
      {at(BEATS.keeper) && !at(BEATS.title) && (
        <div className="anim-popin absolute bottom-[80px] left-1/2 flex -translate-x-1/2 items-end gap-8">
          <Keeper field="making" size={260} face="glad" className="anim-floaty" />
          <div
            className="mb-10 rounded-[24px] px-10 py-7"
            style={{ background: '#FFF6EC', border: '2px solid #E8D9C8', maxWidth: 700 }}
          >
            <div style={{ fontSize: 34, lineHeight: 1.4 }}>
              {world.quests.find((q) => q.kind === 'main')?.story.request ?? '오늘 것도 들고 왔어. 천천히 봐 줘.'}
            </div>
          </div>
        </div>
      )}

      {/* 원정 시작 */}
      {at(BEATS.title) && (
        <div className="anim-popin absolute inset-0 flex flex-col items-center justify-center gap-6">
          <div className="font-display" style={{ fontSize: 96, color: '#6E5A54' }}>
            원정 시작!
          </div>
          <div className="font-display" style={{ fontSize: 44, color: '#C96B4A' }}>
            {site?.name} · {seg?.name}
          </div>
        </div>
      )}
    </div>
  )
}
