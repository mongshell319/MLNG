'use client'

import { Mallang } from '@/components/mallang/Mallang'
import { crisisSeconds, formatClock, toolSeconds } from '@/lib/domain/phase'
import type { WorldSnapshot } from '@/lib/domain/types'

/**
 * C1 상태 4 — 난관과 레이드 / 상태 6 — 잔도구 오버레이.
 *
 * 난관은 긴박하되 무섭지 않아야 한다. 채도를 낮춘 lavender만 쓰고 빨강은 쓰지 않는다.
 * 미달로 끝나도 상실 연출 없이 "오늘은 잠잠해졌습니다"로 차분히 닫는다.
 */

export function CrisisOverlay({ world, now }: { world: WorldSnapshot; now: number }) {
  const c = world.session.crisis
  if (!c.active && c.settled === 'none') return null

  if (!c.active) {
    return (
      <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(217,210,245,.35)' }}>
        <div
          className="anim-popin flex items-center gap-10 rounded-[24px] px-16 py-12"
          style={{ background: '#FFF6EC', border: '2px solid #D9D2F5' }}
        >
          <Mallang size={180} face={c.settled === 'cleared' ? 'star' : 'sleepy'} color="#D9D2F5" />
          <div>
            <div className="font-display" style={{ fontSize: 64 }}>
              {c.settled === 'cleared' ? '빛이 들었습니다' : '오늘은 잠잠해졌습니다'}
            </div>
            <div style={{ fontSize: 32, color: '#8C7A72' }}>
              {c.settled === 'cleared' ? '길이 한 뼘 더 열렸어요.' : '다음에 다시 와도 괜찮아요.'}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const left = crisisSeconds(world.session, now)
  return (
    <div className="absolute inset-0" style={{ background: 'rgba(217,210,245,.42)' }}>
      <div
        className="absolute left-1/2 top-[120px] -translate-x-1/2 rounded-[24px] px-20 py-10 text-center"
        style={{ background: '#FFF6EC', border: '3px solid #7A6BB5' }}
      >
        <div className="font-display" style={{ fontSize: 40, color: '#7A6BB5' }}>
          {c.label}
        </div>
        <div className="mt-3 flex items-baseline justify-center gap-6">
          <span style={{ fontSize: 34 }}>전달</span>
          <span className="font-display" style={{ fontSize: 64 }}>
            {c.counter}/{c.goal}
          </span>
        </div>
        <div className="mt-4 flex items-center justify-center gap-4">
          <span style={{ fontSize: 30, color: '#8C7A72' }}>남은 시간</span>
          <span className="font-display" style={{ fontSize: 44, color: '#7A6BB5' }}>
            {formatClock(left)}
          </span>
        </div>
      </div>

      {c.kind === 'raid' && (
        <div className="absolute bottom-[60px] left-1/2 -translate-x-1/2 text-center">
          <div className="font-display" style={{ fontSize: 34, color: '#7A6BB5' }}>
            엉킨 것을 한 가닥씩 풀고 있어요
          </div>
        </div>
      )}
    </div>
  )
}

/** C1 상태 6 — 잔도구. 타이머 · 뽑기 · 모둠 편성. */
export function ToolOverlay({ world, now }: { world: WorldSnapshot; now: number }) {
  const tool = world.session.toolOverlay
  if (!tool.kind) return null
  const left = toolSeconds(world.session, now)

  if (tool.kind === 'timer') {
    const total = 300
    const ratio = Math.max(0, Math.min(1, left / total))
    const r = 180
    const circumference = 2 * Math.PI * r
    return (
      <Shell>
        <div className="relative">
          <svg width={460} height={460} viewBox="0 0 460 460" aria-label="타이머">
            <circle cx={230} cy={230} r={r} fill="none" stroke="#EFEAE2" strokeWidth={26} />
            <circle
              cx={230}
              cy={230}
              r={r}
              fill="none"
              stroke="#C5EBDD"
              strokeWidth={26}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - ratio)}
              transform="rotate(-90 230 230)"
              style={{ transition: 'stroke-dashoffset 900ms linear' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <Mallang size={150} face="focus" color="#FFC9B5" />
            <div className="font-display" style={{ fontSize: 68 }}>
              {formatClock(left)}
            </div>
          </div>
        </div>
        {/* 말랑이가 냄비를 끓인다 */}
        <div className="mt-2 font-display" style={{ fontSize: 36, color: '#8C7A72' }}>
          냄비가 끓는 동안
        </div>
      </Shell>
    )
  }

  if (tool.kind === 'raffle') {
    return (
      <Shell>
        <div className="flex items-end gap-6">
          {['#FFD6E5', '#C5EBDD', '#FFF0B3'].map((c, i) => (
            <Mallang key={c} color={c} face={i === 1 ? 'glad' : 'base'} size={150} className="anim-floaty" style={{ animationDelay: `${i * 0.3}s` }} />
          ))}
        </div>
        <div className="anim-popin mt-8 rounded-[24px] px-16 py-8" style={{ background: '#FFF0B3', border: '3px solid #B8933A' }}>
          <div className="font-display" style={{ fontSize: 72, color: '#B8933A' }}>
            {tool.raffleName}
          </div>
        </div>
        <div className="mt-4" style={{ fontSize: 32, color: '#8C7A72' }}>
          제비를 물어 왔어요
        </div>
      </Shell>
    )
  }

  return (
    <Shell>
      <div className="font-display" style={{ fontSize: 64 }}>
        원정대 결성
      </div>
      <div className="mt-8 grid grid-cols-5 gap-8">
        {world.mallangs.slice(0, 5).map((m, i) => (
          <div key={m.id} className="anim-popin flex flex-col items-center gap-3" style={{ animationDelay: `${i * 120}ms` }}>
            <Mallang color={m.bodyColor} size={130} face="glad" form={m.evolutionForm} />
            <div className="font-display" style={{ fontSize: 32 }}>
              {m.name}
            </div>
          </div>
        ))}
      </div>
    </Shell>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ background: 'rgba(255,246,236,.93)' }}>
      {children}
    </div>
  )
}
