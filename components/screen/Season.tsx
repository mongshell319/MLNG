'use client'

import { useEffect } from 'react'
import { Mallang } from '@/components/mallang/Mallang'
import { FIELDS, FIELD_BY_FORM } from '@/lib/domain/master'
import { useWorld } from '@/lib/client/world'
import type { WorldSnapshot } from '@/lib/domain/types'
import { Panorama } from './Panorama'

/**
 * C1 상태 7 — 물드는 밤 / 상태 8 — 시즌 완공식.
 *
 * 물드는 밤은 시즌에 단 한 번뿐인 장면이다. 반 전체가 하나씩 자기 분야의 빛에 물든다.
 * 어떤 형태도 다른 형태보다 화려하게 그리지 않는다 — 우열이 없어야 하기 때문이다.
 */

export function DyeingNight({ world }: { world: WorldSnapshot }) {
  const { dispatch } = useWorld()
  const idx = world.session.nightIndex
  const total = world.mallangs.length

  // 클래스 스크린이 진행을 맡는다. 한 마리씩 1.4초 간격.
  useEffect(() => {
    if (idx >= total) return
    const id = setTimeout(() => void dispatch({ type: 'session.nightStep' }), 1400)
    return () => clearTimeout(id)
  }, [idx, total, dispatch])

  const done = idx >= total

  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{ background: 'linear-gradient(#3A3350 0%, #5A4B62 62%, #6E5A54 100%)' }}
    >
      {/* 별 */}
      {Array.from({ length: 40 }).map((_, i) => (
        <span
          key={i}
          className="anim-twinkle absolute rounded-full"
          style={{
            left: `${(i * 137) % 100}%`,
            top: `${(i * 61) % 55}%`,
            width: 4 + (i % 3) * 2,
            height: 4 + (i % 3) * 2,
            background: '#FFF0B3',
            animationDelay: `${(i % 7) * 0.4}s`,
          }}
        />
      ))}

      <div className="pt-[56px] text-center">
        <div className="font-display" style={{ fontSize: 64, color: '#FFF6EC' }}>
          물드는 밤
        </div>
        <div className="mt-2" style={{ fontSize: 32, color: '#D8D2CC' }}>
          {done ? '모두 자기 빛을 찾았어요' : '한 명씩, 자기 빛에 물드는 중이에요'}
        </div>
      </div>

      <div className="mt-10 flex flex-wrap items-end justify-center gap-x-6 gap-y-4 px-16">
        {world.mallangs.map((m, i) => {
          const dyed = i < idx
          const field = dyed ? FIELD_BY_FORM[m.evolutionForm] ?? FIELDS[i % 5] : null
          return (
            <div key={m.id} className="relative flex flex-col items-center" style={{ width: 118 }}>
              {dyed && (
                <span
                  className="anim-twinkle absolute -top-2 rounded-full"
                  style={{ width: 108, height: 108, background: field!.tint, opacity: 0.4, filter: 'blur(8px)' }}
                />
              )}
              <Mallang
                color={m.bodyColor}
                size={102}
                face={dyed ? 'star' : 'sleepy'}
                form={m.evolutionForm}
                className={dyed ? 'anim-popin' : 'anim-floaty'}
                style={{ animationDelay: `${(i % 6) * 0.3}s` }}
              />
              <div className="font-display" style={{ fontSize: 22, color: dyed ? '#FFF6EC' : '#B8A99E' }}>
                {m.name}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const FINALE_STEPS = [
  { title: '마을이 마지막으로 자랍니다', sub: '한 시즌 동안 쌓인 것이 전부 여기 있어요' },
  { title: '시즌 여권 발급', sub: '이 시즌에 다녀온 곳들이 적혀 있어요' },
  { title: '타임캡슐 회수', sub: '개학 첫날 묻어 둔 것을 꺼냅니다' },
  { title: '마을이 엽서가 됩니다', sub: '한 장으로 접어서 각자에게' },
  { title: '', sub: '' },
]

export function Finale({ world, now }: { world: WorldSnapshot; now: number }) {
  const { dispatch } = useWorld()
  const step = world.session.finaleStep

  useEffect(() => {
    if (step >= 4) return
    const id = setTimeout(() => void dispatch({ type: 'session.finaleStep' }), 5200)
    return () => clearTimeout(id)
  }, [step, dispatch])

  if (step >= 4) {
    return (
      <div className="absolute inset-0 flex items-center justify-center" style={{ background: '#FFF6EC' }}>
        <div
          className="anim-popin relative overflow-hidden rounded-[24px]"
          style={{ width: 1360, height: 860, border: '3px solid #6E5A54', background: '#FFF6EC' }}
        >
          <div className="absolute inset-0 scale-[0.72]" style={{ transformOrigin: 'center' }}>
            <Panorama world={world} now={now} />
          </div>
          <div
            className="absolute bottom-[40px] left-1/2 -translate-x-1/2 rounded-[24px] px-16 py-8 text-center"
            style={{ background: 'rgba(255,246,236,.95)', border: '3px solid #E8D9C8' }}
          >
            <div className="font-display" style={{ fontSize: 64 }}>
              시즌{world.village.season} 우리의 마을
            </div>
            <div className="mt-2" style={{ fontSize: 32, color: '#8C7A72' }}>
              {world.village.name} · 마을은 대륙에 그대로 남아요
            </div>
          </div>
        </div>
      </div>
    )
  }

  const s = FINALE_STEPS[step]
  return (
    <div className="absolute inset-0">
      <Panorama world={world} now={now} growing={step === 0} />
      <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(255,246,236,.72)' }}>
        <div className="anim-popin rounded-[24px] px-20 py-14 text-center" style={{ background: '#FFF6EC', border: '3px solid #E8D9C8' }}>
          <div className="font-display" style={{ fontSize: 64 }}>
            {s.title}
          </div>
          <div className="mt-3" style={{ fontSize: 34, color: '#8C7A72' }}>
            {s.sub}
          </div>
          {step === 1 && (
            <div className="mt-8 flex justify-center gap-6">
              {world.sites.map((site) => (
                <div
                  key={site.id}
                  className="rounded-[20px] px-8 py-5"
                  style={{ background: site.cleared ? '#FFF0B3' : '#FFFFFF', border: '2px solid #E8D9C8' }}
                >
                  <div className="font-display" style={{ fontSize: 34 }}>
                    {site.name}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
