'use client'

import { useState } from 'react'
import { Mallang } from '@/components/mallang/Mallang'
import { PillButton } from '@/components/ui/primitives'
import { useWorld } from '@/lib/client/world'
import { SHOP_ACCESSORIES, SNACKS, WEEKLY_ITEM } from '@/lib/domain/master'
import type { Accessory, Mallang as MallangType, WorldSnapshot } from '@/lib/domain/types'

/**
 * S5 — 가게.
 *
 * 구매는 3단계다: 탭 → 말랑이 착용 미리보기 → 확인.
 * 잔액이 부족하면 "몽글이 조금 더 필요해요" 토스트만 뜨고 빨강은 쓰지 않는다.
 * 주간 한정은 D-day 텍스트만 — 초 단위 타이머는 만들지 않는다.
 */
export function Shop({ world, me }: { world: WorldSnapshot; me: MallangType }) {
  const { dispatch, say } = useWorld()
  const [preview, setPreview] = useState<{ key: Accessory; name: string; price: number } | null>(null)
  const [fed, setFed] = useState('')
  const mongle = world.village.mongle

  const buySnack = (key: string, price: number, name: string) => {
    if (mongle < price) {
      say('몽글이 조금 더 필요해요')
      return
    }
    void dispatch({ type: 'shop.buySnack', mallangId: me.id, key, at: new Date().toISOString() })
    setFed(name)
    setTimeout(() => setFed(''), 2200)
  }

  return (
    <div className="mx-auto w-full max-w-[1060px] px-5 pb-6 pt-4">
      <div className="flex items-center justify-between">
        <div className="font-display text-[20px]">말랑 가게</div>
        <div className="rounded-full px-4 py-2 text-[14px] font-bold" style={{ background: '#FFF0B3', color: '#B8933A' }}>
          몽글 {mongle}
        </div>
      </div>

      {/* 간식 3종 */}
      <Section title="간식">
        <div className="grid gap-3 sm:grid-cols-3">
          {SNACKS.map((s) => (
            <button
              key={s.key}
              onClick={() => buySnack(s.key, s.price, s.name)}
              className="squishy rounded-[20px] px-5 py-5 text-left"
              style={{ background: s.tint, border: '1.5px solid #E8D9C8' }}
            >
              <div
                className="mb-3 h-16 w-16 rounded-[18px]"
                style={{ background: `radial-gradient(circle at 30% 30%, #FFF6EC, ${s.tint})`, border: '1.5px solid #6E5A54' }}
              />
              <div className="font-display text-[17px]">{s.name}</div>
              <div className="text-[13px]" style={{ color: '#8C7A72' }}>
                몽글 {s.price}
              </div>
            </button>
          ))}
        </div>
        {fed && (
          <div className="anim-popin mt-3 flex items-center gap-3 text-[14px]">
            <Mallang color={me.bodyColor} size={44} face="full" form={me.evolutionForm} />
            {fed}을(를) 잘 먹었다는 표정이에요.
          </div>
        )}
      </Section>

      {/* 주간 한정 1슬롯 */}
      <Section title="이번 주">
        <div
          className="flex flex-wrap items-center gap-5 rounded-[20px] px-6 py-5"
          style={{ background: 'radial-gradient(120% 120% at 20% 0%, #FFF0B3, #FFF6EC)', border: '1.5px solid #B8933A' }}
        >
          <Mallang color={me.bodyColor} size={82} accessory={WEEKLY_ITEM.key} form={me.evolutionForm} face="glad" />
          <div className="flex-1">
            <div className="inline-block rounded-full px-3 py-1 text-[12px] font-bold" style={{ background: '#FFF0B3', color: '#B8933A' }}>
              이번 주
            </div>
            <div className="mt-1 font-display text-[19px]">{WEEKLY_ITEM.name}</div>
            <div className="text-[13px]" style={{ color: '#8C7A72' }}>
              몽글 {WEEKLY_ITEM.price} · D-{WEEKLY_ITEM.dday}
            </div>
          </div>
          <PillButton tint="#FFF0B3" fg="#B8933A" line="#B8933A" onClick={() => setPreview(WEEKLY_ITEM)}>
            입어 보기
          </PillButton>
        </div>
      </Section>

      {/* 악세서리 상시 8종 */}
      <Section title="꾸미기">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {SHOP_ACCESSORIES.map((a) => {
            const owned = me.accessories.includes(a.key)
            return (
              <button
                key={a.key}
                onClick={() => (owned ? dispatch({ type: 'mallang.wear', mallangId: me.id, accessory: a.key }) : setPreview(a))}
                className="squishy rounded-[20px] px-4 py-4 text-center"
                style={{ background: '#FFFFFF', border: `1.5px solid ${me.wearing === a.key ? '#C96B4A' : '#E8D9C8'}` }}
              >
                <Mallang color={me.bodyColor} size={70} accessory={a.key} form={me.evolutionForm} />
                <div className="mt-1 text-[14px] font-bold">{a.name}</div>
                <div className="text-[12px]" style={{ color: '#8C7A72' }}>
                  {owned ? (me.wearing === a.key ? '착용 중' : '가지고 있어요') : `몽글 ${a.price}`}
                </div>
              </button>
            )
          })}
        </div>
      </Section>

      <div className="mt-6 rounded-[20px] px-5 py-4 text-[14px]" style={{ background: '#FFF6EC', border: '1.5px solid #E8D9C8', color: '#8C7A72' }}>
        놓친 물건은 시즌 마지막에 돌아와요.
      </div>

      {/* 착용 미리보기 → 확인 */}
      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6" style={{ background: 'rgba(110,90,84,.32)' }}>
          <div className="anim-popin w-full max-w-[380px] rounded-[24px] px-7 py-7 text-center" style={{ background: '#FFF6EC', border: '1.5px solid #E8D9C8' }}>
            <Mallang color={me.bodyColor} size={150} accessory={preview.key} form={me.evolutionForm} face="glad" className="anim-floaty" />
            <div className="mt-2 font-display text-[20px]">{preview.name}</div>
            <div className="text-[14px]" style={{ color: '#8C7A72' }}>
              몽글 {preview.price}
            </div>
            <div className="mt-5 flex justify-center gap-3">
              <PillButton tint="#FFFFFF" line="#E8D9C8" onClick={() => setPreview(null)}>
                다음에
              </PillButton>
              <PillButton
                tint="#FFC9B5"
                fg="#C96B4A"
                onClick={async () => {
                  await dispatch({ type: 'shop.buyAccessory', mallangId: me.id, key: preview.key, at: new Date().toISOString() })
                  setPreview(null)
                }}
              >
                이걸로 할래
              </PillButton>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <div className="mb-3 font-display text-[17px]">{title}</div>
      {children}
    </section>
  )
}
