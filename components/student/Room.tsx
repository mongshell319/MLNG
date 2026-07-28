'use client'

import { useState } from 'react'
import { Mallang } from '@/components/mallang/Mallang'
import { BookIcon, EnvelopeIcon, HeartIcon, SparkIcon } from '@/components/ui/Icons'
import { NewDot } from '@/components/ui/primitives'
import { useWorld } from '@/lib/client/world'
import { ACHIEVEMENTS_HIDDEN, ACHIEVEMENTS_OPEN, FIELDS } from '@/lib/domain/master'
import type { Mallang as MallangType, WorldSnapshot } from '@/lib/domain/types'

/**
 * S6 — 내 방.
 *
 * 서랍 목록이 아니라 방 안의 물건들로 배치한다. 물건을 탭해야 열린다 (§3-6).
 * 칭찬 편지함에 개수 합계를 절대 표시하지 않는다 (§3-1).
 */

type Thing = '' | 'badges' | 'achievements' | 'praise' | 'passport' | 'finds' | 'letters'

const TIER_LABEL = ['', '기본', '반짝', '빛나는']

export function Room({ world, me }: { world: WorldSnapshot; me: MallangType }) {
  const { dispatch } = useWorld()
  const [open, setOpen] = useState<Thing>('')

  const myPraises = world.praises.filter((p) => p.mallangId === me.id && p.revealed)
  const myLetters = world.letters.filter((l) => l.mallangId === me.id)
  const unread = myLetters.filter((l) => !l.read)
  const finds = world.discoveries.filter((d) => d.mallangId === me.id || d.mallangId === null)

  const things: { key: Thing; label: string; where: string; icon: React.ReactNode; dot: boolean }[] = [
    { key: 'badges', label: '뱃지 진열대', where: '책상 위', icon: <SparkIcon size={20} />, dot: false },
    { key: 'achievements', label: '업적 액자', where: '벽', icon: <BookIcon size={20} />, dot: false },
    { key: 'praise', label: '칭찬 편지함', where: '침대 옆', icon: <HeartIcon size={20} />, dot: myPraises.length > 0 },
    { key: 'passport', label: '여권과 엽서', where: '선반', icon: <BookIcon size={20} />, dot: false },
    { key: 'finds', label: '발견물 진열', where: '창가', icon: <SparkIcon size={20} />, dot: finds.length > 0 },
    { key: 'letters', label: '답장함', where: '문 옆', icon: <EnvelopeIcon size={20} />, dot: unread.length > 0 },
  ]

  return (
    <div className="mx-auto w-full max-w-[1000px] px-5 pb-6 pt-4">
      {/* 방 */}
      <div
        className="relative rounded-[20px] px-6 py-7"
        style={{ background: 'linear-gradient(#FFF6EC 0%, #FFF6EC 62%, #EAD9C2 62%, #E3D2BC 100%)', border: '1.5px solid #E8D9C8' }}
      >
        <div className="pointer-events-none absolute bottom-6 right-8 z-[2]">
          <Mallang color={me.bodyColor} size={120} face="glad" form={me.evolutionForm} accessory={me.wearing} className="anim-floaty" />
        </div>

        <div className="relative z-[5] grid grid-cols-2 gap-3 sm:grid-cols-3">
          {things.map((t) => (
            <button
              key={t.key}
              onClick={() => setOpen(open === t.key ? '' : t.key)}
              className="squishy rounded-[20px] px-4 py-4 text-left"
              style={{ background: open === t.key ? '#FFF0B3' : '#FFFFFF', border: '1.5px solid #E8D9C8' }}
            >
              <div className="flex items-center gap-2" style={{ color: '#8C7A72' }}>
                {t.icon}
                <span className="text-[12px]">{t.where}</span>
                {t.dot && <NewDot size={8} />}
              </div>
              <div className="mt-1 font-display text-[16px]">{t.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 열린 물건 */}
      {open === 'badges' && (
        <Panel title="뱃지 진열대">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {FIELDS.map((f) => {
              const tier = me.badges[f.key]
              return (
                <div
                  key={f.key}
                  className="rounded-[20px] px-4 py-4 text-center"
                  style={{
                    background: tier ? f.tint : '#FFFFFF',
                    // 진화 단계는 테두리 반짝임으로만 차등한다
                    border: `${tier >= 3 ? 3 : tier === 2 ? 2.5 : 1.5}px solid ${tier ? f.deep : '#E8D9C8'}`,
                  }}
                >
                  <div className="font-display text-[15px]">{f.label}</div>
                  <div className="mt-1 text-[13px]" style={{ color: tier ? f.deep : '#B8A99E' }}>
                    {tier ? TIER_LABEL[tier] : '아직'}
                  </div>
                </div>
              )
            })}
          </div>
        </Panel>
      )}

      {open === 'achievements' && (
        <Panel title="업적 액자">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {ACHIEVEMENTS_OPEN.map((a) => (
              <div key={a} className="rounded-[20px] px-4 py-4 text-center text-[14px]" style={{ background: '#FFF6EC', border: '1.5px solid #E8D9C8' }}>
                {a}
              </div>
            ))}
            {Array.from({ length: ACHIEVEMENTS_HIDDEN }).map((_, i) => (
              <div
                key={i}
                className="rounded-[20px] px-4 py-4 text-center font-display text-[20px]"
                style={{ background: '#EFEAE2', border: '1.5px solid #E8D9C8', color: '#B8A99E' }}
              >
                ?
              </div>
            ))}
          </div>
        </Panel>
      )}

      {open === 'praise' && (
        <Panel title="칭찬 편지함">
          {myPraises.length === 0 ? (
            <div className="text-[15px]" style={{ color: '#8C7A72' }}>
              아직 도착한 게 없어요. 정산이 끝나면 하나씩 와요.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {/* 합계는 어디에도 쓰지 않는다 */}
              {myPraises.map((p) => (
                <div key={p.id} className="rounded-[16px] px-4 py-3 text-[15px]" style={{ background: '#FFF6EC', border: '1.5px solid #E8D9C8' }}>
                  {p.text}
                </div>
              ))}
            </div>
          )}
        </Panel>
      )}

      {open === 'passport' && (
        <Panel title="여권과 엽서">
          <div className="flex flex-wrap gap-3">
            <div className="rounded-[20px] px-6 py-5" style={{ background: '#D9D2F5', border: '1.5px solid #7A6BB5' }}>
              <div className="font-display text-[17px]">시즌 {world.village.season} 여권</div>
              <div className="mt-2 flex flex-wrap gap-2 text-[13px]">
                {world.sites.map((s) => (
                  <span key={s.id} className="rounded-full px-3 py-1" style={{ background: s.cleared ? '#FFF0B3' : '#FFF6EC' }}>
                    {s.name}
                    {s.cleared ? ' ✓' : ''}
                  </span>
                ))}
              </div>
            </div>
            <div className="rounded-[20px] px-6 py-5" style={{ background: '#FFF6EC', border: '1.5px solid #E8D9C8' }}>
              <div className="font-display text-[17px]">{world.village.name} 엽서</div>
              <div className="mt-2 h-20 w-40 rounded-[12px]" style={{ background: 'linear-gradient(#D9F0F7, #CFE0D4)', border: '1.5px solid #E8D9C8' }} />
            </div>
          </div>
        </Panel>
      )}

      {open === 'finds' && (
        <Panel title="발견물 진열">
          <div className="flex flex-wrap gap-3">
            {finds.map((d) => (
              <div key={d.id} className="rounded-[20px] px-5 py-4 text-[14px]" style={{ background: '#FFF6EC', border: '1.5px solid #E8D9C8' }}>
                {d.name}
              </div>
            ))}
          </div>
        </Panel>
      )}

      {open === 'letters' && (
        <Panel title="답장함">
          {myLetters.length === 0 ? (
            <div className="text-[15px]" style={{ color: '#8C7A72' }}>
              아직 온 편지가 없어요.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {myLetters.map((l) => (
                <button
                  key={l.id}
                  onClick={() => dispatch({ type: 'letter.read', letterId: l.id })}
                  className="squishy rounded-[16px] px-4 py-3 text-left text-[15px]"
                  style={{ background: l.read ? '#FFF6EC' : '#FFF0B3', border: '1.5px solid #E8D9C8' }}
                >
                  <div className="flex items-center gap-2">
                    <b>{l.from}</b>
                    {!l.read && <NewDot size={8} />}
                  </div>
                  <div className="mt-1">{l.body}</div>
                </button>
              ))}
            </div>
          )}
        </Panel>
      )}
    </div>
  )
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="anim-popin mt-4 rounded-[20px] px-6 py-5" style={{ background: '#FFFFFF', border: '1.5px solid #E8D9C8' }}>
      <div className="mb-3 font-display text-[17px]">{title}</div>
      {children}
    </div>
  )
}
