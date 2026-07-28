'use client'

import { useEffect, useRef, useState } from 'react'
import { Mallang } from '@/components/mallang/Mallang'
import { BasketIcon } from '@/components/ui/Icons'
import { PillButton } from '@/components/ui/primitives'
import { useWorld } from '@/lib/client/world'
import { FISH_POOL, GATHER_DAILY_CAP } from '@/lib/domain/master'
import type { Mallang as MallangType, WorldSnapshot } from '@/lib/domain/types'

/**
 * S8 — 채집지 (호숫가).
 *
 * 찌를 드리우고, 흔들리는 순간 탭한다. 잡으면 물고기 카드가 말랑 물성으로 팝된다.
 * 일일 상한에 닿으면 만족 낮잠으로 닫는다 —
 * 에너지 게이지·경고·카운트다운은 만들지 않는다 (§S8).
 */

type FishState = 'idle' | 'casting' | 'bite' | 'caught' | 'missed'

const AMENITY_CANDIDATES = ['분수', '그네', '작은 다리', '해먹']

export function Lake({ world, me }: { world: WorldSnapshot; me: MallangType }) {
  const { dispatch } = useWorld()
  const [state, setState] = useState<FishState>('idle')
  const [caught, setCaught] = useState<(typeof FISH_POOL)[number] | null>(null)
  const [voting, setVoting] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const basket = world.discoveries.filter((d) => d.mallangId === me.id && d.kind === 'seed')
  const full = basket.length >= GATHER_DAILY_CAP

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])

  const cast = () => {
    if (full) return
    setState('casting')
    setCaught(null)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      setState('bite')
      // 무는 순간은 잠깐이지만 놓쳐도 잃는 것은 없다.
      timer.current = setTimeout(() => setState((s) => (s === 'bite' ? 'missed' : s)), 1500)
    }, 1200 + Math.random() * 2200)
  }

  const pull = () => {
    if (state !== 'bite') return
    if (timer.current) clearTimeout(timer.current)
    const fish = FISH_POOL[Math.floor(Math.random() * FISH_POOL.length)]
    setCaught(fish)
    setState('caught')
    void dispatch({
      type: 'gather.catch',
      id: `d-${Date.now()}`,
      mallangId: me.id,
      name: fish.name,
      at: new Date().toISOString(),
    })
  }

  const friend = world.mallangs.find((m) => m.id !== me.id)

  return (
    <div className="mx-auto w-full max-w-[1080px] px-5 pb-6 pt-4">
      {/* 가로 씬 */}
      <div
        className="relative overflow-hidden rounded-[20px]"
        style={{ height: 380, background: 'linear-gradient(#D9F0F7 0%, #FFF6EC 46%, #BFE3EF 46%, #A9CFDE 100%)', border: '1.5px solid #E8D9C8' }}
        onClick={state === 'bite' ? pull : undefined}
      >
        {/* 물결 */}
        <div className="anim-ripple absolute bottom-0 left-0 right-0" style={{ height: 190, background: 'linear-gradient(#BFE3EF, #A9CFDE)' }} />

        {/* 앉은 말랑이들 */}
        <div className="absolute bottom-[150px] left-[16%]">
          <Mallang
            color={me.bodyColor}
            size={110}
            face={full ? 'sleep' : state === 'bite' ? 'surprise' : 'focus'}
            form={me.evolutionForm}
            accessory={me.wearing}
            className={full ? '' : 'anim-floaty'}
            style={full ? { transform: 'rotate(-78deg)' } : undefined}
          />
        </div>
        {friend && (
          <div className="absolute bottom-[150px] left-[30%]" style={{ opacity: 0.9 }}>
            <Mallang color={friend.bodyColor} size={96} face="base" form={friend.evolutionForm} className="anim-floaty" style={{ animationDelay: '0.9s' }} />
          </div>
        )}

        {/* 낚싯줄과 찌 */}
        {!full && (
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1000 380" preserveAspectRatio="none" aria-hidden>
            <path d="M215 150 L560 205" stroke="#6E5A54" strokeWidth={2} />
            <circle
              cx={560}
              cy={state === 'bite' ? 218 : 205}
              r={11}
              fill={state === 'bite' ? '#FFF0B3' : '#FFD6E5'}
              stroke="#6E5A54"
              strokeWidth={2.5}
              className={state === 'bite' ? 'anim-twinkle' : undefined}
            />
          </svg>
        )}

        {/* 잡은 물고기 카드 */}
        {state === 'caught' && caught && (
          <div
            className="anim-popin absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-[20px] px-8 py-6 text-center"
            style={{ background: caught.tint, border: '1.5px solid #6E5A54' }}
          >
            <div className="font-display text-[22px]">{caught.name}</div>
            <div className="text-[13px]" style={{ color: '#6E5A54' }}>
              바구니에 담았어요
            </div>
          </div>
        )}

        {full && (
          <div
            className="anim-popin absolute left-1/2 top-[62px] -translate-x-1/2 rounded-[20px] px-6 py-4 text-center"
            style={{ background: '#FFF6EC', border: '1.5px solid #E8D9C8' }}
          >
            <div className="font-display text-[19px]">오늘은 이만하면 충분해!</div>
            <div className="text-[13px]" style={{ color: '#8C7A72' }}>
              풀밭에 드러누웠어요.
            </div>
          </div>
        )}
      </div>

      {/* 조작 */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
        {!full && state === 'idle' && (
          <PillButton tint="#C5EBDD" fg="#4A8B6F" size="lg" onClick={cast}>
            찌 드리우기
          </PillButton>
        )}
        {state === 'casting' && (
          <span className="text-[15px]" style={{ color: '#8C7A72' }}>
            가만히 기다려요…
          </span>
        )}
        {state === 'bite' && (
          <PillButton tint="#FFF0B3" fg="#B8933A" size="lg" onClick={pull}>
            지금!
          </PillButton>
        )}
        {(state === 'caught' || state === 'missed') && !full && (
          <PillButton tint="#C5EBDD" fg="#4A8B6F" size="lg" onClick={cast}>
            {state === 'missed' ? '다시 드리우기' : '한 번 더'}
          </PillButton>
        )}
        {state === 'missed' && (
          <span className="text-[14px]" style={{ color: '#8C7A72' }}>
            지나갔어요. 또 옵니다.
          </span>
        )}
      </div>

      {/* 바구니 */}
      <div className="mt-5 rounded-[20px] px-5 py-4" style={{ background: '#FFFFFF', border: '1.5px solid #E8D9C8' }}>
        <div className="flex items-center gap-2 font-display text-[16px]">
          <BasketIcon size={18} />
          재료 바구니
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {basket.length === 0 && (
            <span className="text-[14px]" style={{ color: '#8C7A72' }}>
              아직 비어 있어요.
            </span>
          )}
          {basket.map((b) => (
            <span key={b.id} className="rounded-full px-4 py-2 text-[14px]" style={{ background: '#FFF6EC', border: '1.5px solid #E8D9C8' }}>
              {b.name}
            </span>
          ))}
        </div>
        <div className="mt-4">
          <PillButton tint="#FFF6EC" line="#E8D9C8" onClick={() => setVoting((v) => !v)}>
            마을 편의시설 후보 보기
          </PillButton>
        </div>
        {voting && (
          <div className="anim-popin mt-3 flex flex-wrap gap-2">
            {AMENITY_CANDIDATES.map((a) => (
              <button
                key={a}
                onClick={() => dispatch({ type: 'gather.vote', amenity: a })}
                className="squishy rounded-full px-4 py-2 text-[14px]"
                style={{
                  background: world.village.amenities.includes(a) ? '#C5EBDD' : '#FFF6EC',
                  border: '1.5px solid #E8D9C8',
                }}
              >
                {a}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
