'use client'

import { useState } from 'react'
import { Mallang } from '@/components/mallang/Mallang'
import { PillButton } from '@/components/ui/primitives'
import { useWorld } from '@/lib/client/world'
import { FIELDS } from '@/lib/domain/master'
import type { EvolutionForm, Mallang as MallangType, WorldSnapshot } from '@/lib/domain/types'

/**
 * S10 — 되돌림의 샘.
 *
 * 물에 비친 다른 형태들을 좌우로 넘겨 보며 고른다.
 * 후보 = 현재 형태 + 기본 형태 + 내가 뱃지를 가진 다른 분야 형태들.
 * 변경에 비용도 제한도 없고, 되돌리는 행위가 부정적으로 보이면 안 된다.
 */
export function Spring({ world, me }: { world: WorldSnapshot; me: MallangType }) {
  const { dispatch } = useWorld()

  const forms: { form: EvolutionForm; label: string }[] = [
    { form: 'base', label: '기본 말랑이' },
    ...FIELDS.filter((f) => me.badges[f.key] > 0 || me.evolutionForm === f.form).map((f) => ({
      form: f.form,
      label: f.formLabel,
    })),
  ]
  const unique = forms.filter((f, i) => forms.findIndex((x) => x.form === f.form) === i)
  const startIndex = Math.max(0, unique.findIndex((f) => f.form === me.evolutionForm))
  const [index, setIndex] = useState(startIndex)
  const current = unique[index] ?? unique[0]

  return (
    <div className="mx-auto w-full max-w-[760px] px-5 pb-6 pt-4">
      <div
        className="relative overflow-hidden rounded-[20px] px-6 py-8 text-center"
        style={{ background: 'linear-gradient(#FFF6EC 0%, #FFF6EC 54%, #D9F0F7 54%, #BFE3EF 100%)', border: '1.5px solid #E8D9C8' }}
      >
        <div className="font-display text-[19px]">되돌림의 샘</div>
        <div className="mt-1 text-[14px]" style={{ color: '#8C7A72' }}>
          물에 비친 모습을 넘겨 봐요. 언제든 다시 바꿔도 괜찮아요.
        </div>

        <div className="mt-6 flex items-center justify-center gap-5">
          <button
            onClick={() => setIndex((i) => (i - 1 + unique.length) % unique.length)}
            className="squishy rounded-full px-4 py-3 text-[18px]"
            style={{ background: '#FFFFFF', border: '1.5px solid #E8D9C8' }}
            aria-label="이전 형태"
          >
            ‹
          </button>

          <div className="relative">
            <Mallang color={me.bodyColor} size={150} face="glad" form={current.form} accessory={me.wearing} className="anim-floaty" />
            {/* 물에 비친 상 */}
            <div className="anim-ripple mt-1" style={{ transform: 'scaleY(-0.55)', opacity: 0.32, filter: 'blur(1px)' }}>
              <Mallang color={me.bodyColor} size={150} face="glad" form={current.form} accessory={me.wearing} />
            </div>
          </div>

          <button
            onClick={() => setIndex((i) => (i + 1) % unique.length)}
            className="squishy rounded-full px-4 py-3 text-[18px]"
            style={{ background: '#FFFFFF', border: '1.5px solid #E8D9C8' }}
            aria-label="다음 형태"
          >
            ›
          </button>
        </div>

        <div className="mt-4 font-display text-[20px]">{current.label}</div>

        <div className="mt-5 flex justify-center">
          <PillButton
            tint="#BFE3EF"
            fg="#4A8B6F"
            size="lg"
            onClick={() => dispatch({ type: 'mallang.form', mallangId: me.id, form: current.form })}
          >
            {me.evolutionForm === current.form ? '지금 이 모습이에요' : '이 모습으로 있을래'}
          </PillButton>
        </div>
      </div>

      <div className="mt-4 text-center text-[14px]" style={{ color: '#8C7A72' }}>
        물드는 밤이 지나면 고를 수 있는 모습이 늘어나요.
      </div>
    </div>
  )
}
