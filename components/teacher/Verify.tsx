'use client'

import { useRef, useState } from 'react'
import { Mallang } from '@/components/mallang/Mallang'
import { PillButton } from '@/components/ui/primitives'
import { useWorld } from '@/lib/client/world'
import { REJECT_REASONS } from '@/lib/domain/master'
import type { WorldSnapshot } from '@/lib/domain/types'

/**
 * T3 — 검증함.
 *
 * 탭하면 승인, 길게 누르면 반려 사유 프리셋 4개.
 * 프리셋은 전부 조건 미충족형이다 — 품질을 지적하는 문구는 만들지 않는다.
 */
export function Verify({ world }: { world: WorldSnapshot }) {
  const { dispatch } = useWorld()
  const [rejecting, setRejecting] = useState<string | null>(null)
  const [justApproved, setJustApproved] = useState<string | null>(null)
  const press = useRef<ReturnType<typeof setTimeout> | null>(null)
  const longPressed = useRef(false)

  const pending = world.progress.filter((p) => p.status === 'delivering')
  const at = () => new Date().toISOString()

  const key = (questId: string, mallangId: string) => `${questId}:${mallangId}`

  const startPress = (k: string) => {
    longPressed.current = false
    press.current = setTimeout(() => {
      longPressed.current = true
      setRejecting(k)
    }, 520)
  }

  const endPress = (questId: string, mallangId: string) => {
    if (press.current) clearTimeout(press.current)
    if (longPressed.current) return
    const k = key(questId, mallangId)
    setJustApproved(k)
    setTimeout(() => setJustApproved(null), 700)
    void dispatch({ type: 'verify.approve', questId, mallangId, at: at() })
  }

  if (pending.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-[20px] px-6 py-16" style={{ background: '#FFFFFF', border: '1.5px solid #E8D9C8' }}>
        <Mallang size={110} face="sleep" color="#C5EBDD" className="anim-floaty" />
        <div className="font-display text-[20px]">오늘은 다 처리했어요</div>
        <div className="text-[14px]" style={{ color: '#8C7A72' }}>
          새 전달이 오면 여기 쌓여요.
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3 rounded-[20px] px-5 py-4" style={{ background: '#FFFFFF', border: '1.5px solid #E8D9C8' }}>
        <span className="font-display text-[19px]">남은 건수 {pending.length}</span>
        <span className="text-[13px]" style={{ color: '#8C7A72' }}>
          72시간 후 자동 승인돼요 · 탭은 승인, 길게 누르면 사유 선택
        </span>
        <div className="ml-auto">
          <PillButton tint="#C5EBDD" fg="#4A8B6F" onClick={() => dispatch({ type: 'verify.approveAll', at: at() })}>
            일괄 승인
          </PillButton>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {pending.map((p) => {
          const mallang = world.mallangs.find((m) => m.id === p.mallangId)
          const quest = world.quests.find((q) => q.id === p.questId)
          const k = key(p.questId, p.mallangId)
          const approved = justApproved === k
          return (
            <div key={k} className="relative">
              <button
                onPointerDown={() => startPress(k)}
                onPointerUp={() => endPress(p.questId, p.mallangId)}
                onPointerLeave={() => press.current && clearTimeout(press.current)}
                onContextMenu={(e) => e.preventDefault()}
                className="squishy w-full rounded-[20px] p-3 text-left"
                style={{ background: '#FFFFFF', border: '1.5px solid #E8D9C8' }}
              >
                <div
                  className="rounded-[14px]"
                  style={{
                    aspectRatio: '4 / 3',
                    border: '1.5px solid #E8D9C8',
                    background: p.photoUrl ? `center/cover url(${p.photoUrl})` : 'linear-gradient(140deg,#FFD6E5,#FFF6EC)',
                  }}
                />
                <div className="mt-2 flex items-center gap-2">
                  <Mallang color={mallang?.bodyColor ?? '#FFD6E5'} size={30} form={mallang?.evolutionForm} face={approved ? 'full' : 'base'} />
                  <div className="min-w-0">
                    <div className="truncate text-[14px] font-bold">{mallang?.name}</div>
                    <div className="truncate text-[12px]" style={{ color: '#8C7A72' }}>
                      {quest?.title}
                    </div>
                  </div>
                </div>
              </button>

              {approved && (
                <div
                  className="anim-popin pointer-events-none absolute inset-0 flex items-center justify-center rounded-[20px]"
                  style={{ background: 'rgba(197,235,221,.82)' }}
                >
                  <span className="font-display text-[36px]" style={{ color: '#4A8B6F' }}>
                    ✓
                  </span>
                </div>
              )}

              {rejecting === k && (
                <div
                  className="anim-popin absolute inset-0 z-10 flex flex-col justify-center gap-2 rounded-[20px] p-4"
                  style={{ background: 'rgba(255,246,236,.97)', border: '1.5px solid #E8D9C8' }}
                >
                  {REJECT_REASONS.map((r) => (
                    <button
                      key={r}
                      onClick={() => {
                        void dispatch({ type: 'verify.reject', questId: p.questId, mallangId: p.mallangId, reason: r, at: at() })
                        setRejecting(null)
                      }}
                      className="squishy rounded-full px-3 py-2 text-[13px]"
                      style={{ background: '#FFFFFF', border: '1.5px solid #E8D9C8' }}
                    >
                      {r}
                    </button>
                  ))}
                  <button onClick={() => setRejecting(null)} className="mt-1 text-[12px]" style={{ color: '#8C7A72' }}>
                    닫기
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
