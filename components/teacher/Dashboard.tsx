'use client'

import { useMemo, useState } from 'react'
import { Mallang } from '@/components/mallang/Mallang'
import { PillButton } from '@/components/ui/primitives'
import { useWorld } from '@/lib/client/world'
import { FIELDS } from '@/lib/domain/master'
import { awardMirror, detectOverlooked } from '@/lib/domain/spotlight'
import type { FieldKey, WorldSnapshot } from '@/lib/domain/types'

/**
 * T4 — 클래스 현황 · GM 리모컨.
 *
 * 여기서만 완료율과 미제출 건수를 쓴다. 학생 화면으로는 절대 넘기지 않는다.
 * 분포 거울과 소외 감지는 교사 본인에게만 보이고 중립적 톤을 유지한다.
 */
export function Dashboard({ world }: { world: WorldSnapshot }) {
  const { dispatch } = useWorld()
  const [sortByOverdue, setSortByOverdue] = useState(true)
  const [picked, setPicked] = useState<string | null>(null)

  const at = () => new Date().toISOString()
  const delivered = world.progress.filter((p) => p.status === 'solved').length
  const pending = world.progress.filter((p) => p.status === 'delivering').length
  const rate = Math.round((delivered / Math.max(1, world.mallangs.length)) * 100)

  const mirror = useMemo(() => awardMirror(world), [world])
  const overlooked = useMemo(() => detectOverlooked(world), [world])

  const roster = useMemo(() => {
    const list = [...world.mallangs]
    if (!sortByOverdue) return list
    // '최근 수여 오래된 순' — 한 번도 못 받은 학생이 맨 앞에 온다.
    return list.sort((a, b) => {
      const av = a.lastAwardAt ? Date.parse(a.lastAwardAt) : 0
      const bv = b.lastAwardAt ? Date.parse(b.lastAwardAt) : 0
      return av - bv
    })
  }, [world.mallangs, sortByOverdue])

  const award = (mallangId: string, field: FieldKey) =>
    dispatch({
      type: 'gm.award',
      id: `p-${Date.now()}`,
      mallangId,
      field,
      text: FIELDS.find((f) => f.key === field)!.praise,
      at: at(),
    })

  return (
    <div className="flex flex-col gap-4">
      {/* 주 20분 미터 — 상시 */}
      <Card>
        <div className="flex flex-wrap items-center gap-4">
          <div className="font-display text-[18px]">이번 주 소요</div>
          <Meter label="발행" minutes={4} />
          <Meter label="검증" minutes={7} />
          <div className="ml-auto text-[13px]" style={{ color: '#8C7A72' }}>
            주 20분 기준 · 11분 썼어요
          </div>
        </div>
        <div className="mt-3 h-3 overflow-hidden rounded-full" style={{ background: '#FFF6EC', border: '1.5px solid #E8D9C8' }}>
          <div className="h-full rounded-full" style={{ width: '55%', background: '#C5EBDD' }} />
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* 분포 차트 — 개인 식별 불가능하게 */}
        <Card>
          <div className="font-display text-[18px]">오늘의 분포</div>
          <div className="mt-1 text-[13px]" style={{ color: '#8C7A72' }}>
            전달 {delivered} · 대기 {pending} · 완료율 {rate}%
          </div>
          <div className="mt-4 flex items-end gap-3" style={{ height: 120 }}>
            {FIELDS.map((f) => {
              const n = world.praises.filter((p) => p.field === f.key).length
              const h = 14 + n * 22
              return (
                <div key={f.key} className="flex flex-1 flex-col items-center gap-2">
                  <div
                    className="w-full rounded-t-[12px]"
                    style={{ height: Math.min(100, h), background: f.tint, border: `1.5px solid ${f.deep}` }}
                  />
                  <span className="text-[11px]" style={{ color: '#8C7A72' }}>
                    {f.label}
                  </span>
                </div>
              )
            })}
          </div>
        </Card>

        {/* 분포 거울 — 교사 본인에게만 */}
        <Card>
          <div className="font-display text-[18px]">분포 거울</div>
          {mirror.total === 0 ? (
            <p className="mt-3 text-[15px]" style={{ color: '#8C7A72' }}>
              아직 수여 기록이 없어요. 몇 번 쌓이면 여기 분포가 보여요.
            </p>
          ) : (
            <p className="mt-3 text-[15px] leading-relaxed">
              최근 리모컨 수여의 <b>{mirror.share}%</b>가 {mirror.people}명에게 갔어요.
            </p>
          )}
          <div className="mt-2 text-[13px]" style={{ color: '#B8A99E' }}>
            이 카드는 교사 본인에게만 보여요.
          </div>
        </Card>
      </div>

      {/* 소외 감지 */}
      <Card>
        <div className="font-display text-[18px]">요즘 조용한 쪽</div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {overlooked.length === 0 && (
            <div className="text-[15px]" style={{ color: '#8C7A72' }}>
              지금은 눈에 띄게 밀린 사람이 없어요.
            </div>
          )}
          {overlooked.map((o) => (
            <div key={o.mallang.id} className="rounded-[20px] px-5 py-4" style={{ background: '#FFF6EC', border: '1.5px solid #E8D9C8' }}>
              <div className="flex items-center gap-3">
                <Mallang color={o.mallang.bodyColor} size={44} form={o.mallang.evolutionForm} face="glad" />
                <div>
                  <div className="font-display text-[16px]">{o.mallang.name}</div>
                  <div className="text-[13px]" style={{ color: '#8C7A72' }}>
                    {o.suggestion.text}
                  </div>
                </div>
              </div>
              <div className="mt-3">
                <PillButton size="sm" tint="#C5EBDD" fg="#4A8B6F" onClick={() => award(o.mallang.id, o.suggestion.field)}>
                  이 근거로 표시하기
                </PillButton>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* 리모컨 */}
      <Card>
        <div className="flex flex-wrap items-center gap-3">
          <div className="font-display text-[18px]">GM 리모컨</div>
          <button
            onClick={() => setSortByOverdue((v) => !v)}
            className="squishy rounded-full px-4 py-1.5 text-[13px] font-bold"
            style={{ background: sortByOverdue ? '#FFF0B3' : '#FFF6EC', border: '1.5px solid #E8D9C8', color: '#8C7A72' }}
          >
            최근 수여 오래된 순
          </button>
          <span className="text-[13px]" style={{ color: '#8C7A72' }}>
            오늘 남은 표시 {world.gmAwardsRemaining}
          </span>
          <span className="ml-auto text-[13px]" style={{ color: '#B8A99E' }}>
            표시한 것은 정산 전까지 학생에게 보이지 않아요.
          </span>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {roster.map((m) => (
            <div key={m.id} className="rounded-[20px] px-4 py-3" style={{ background: '#FFF6EC', border: '1.5px solid #E8D9C8' }}>
              <button onClick={() => setPicked(picked === m.id ? null : m.id)} className="squishy flex w-full items-center gap-3 text-left">
                <Mallang color={m.bodyColor} size={38} form={m.evolutionForm} accessory={m.wearing} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[15px] font-bold">{m.name}</div>
                  <div className="text-[12px]" style={{ color: '#8C7A72' }}>
                    {m.lastAwardAt ? `${Math.round((Date.now() - Date.parse(m.lastAwardAt)) / 86_400_000)}일 전 표시` : '아직 표시 없음'}
                  </div>
                </div>
              </button>
              {picked === m.id && (
                <div className="anim-popin mt-3 flex flex-wrap gap-2">
                  {FIELDS.map((f) => (
                    <button
                      key={f.key}
                      onClick={() => award(m.id, f.key)}
                      className="squishy rounded-full px-3 py-1.5 text-[12px] font-bold"
                      style={{ background: f.tint, color: f.deep, border: `1.5px solid ${f.deep}` }}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* 자유 시간 2옵션 */}
      <Card>
        <div className="flex flex-wrap items-center gap-3">
          <div className="font-display text-[18px]">자유 시간</div>
          <PillButton
            tint={world.session.freeTime === 'all' ? '#C5EBDD' : '#FFF6EC'}
            fg="#4A8B6F"
            line="#E8D9C8"
            onClick={() => dispatch({ type: 'freetime.set', mode: 'all' })}
          >
            반 전체 개방
          </PillButton>
          <PillButton
            tint={world.session.freeTime === 'delivered' ? '#C5EBDD' : '#FFF6EC'}
            fg="#4A8B6F"
            line="#E8D9C8"
            onClick={() => dispatch({ type: 'freetime.set', mode: 'delivered' })}
          >
            전달 완료자만 개방
          </PillButton>
        </div>
      </Card>
    </div>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-[20px] px-6 py-5" style={{ background: '#FFFFFF', border: '1.5px solid #E8D9C8' }}>
      {children}
    </div>
  )
}

function Meter({ label, minutes }: { label: string; minutes: number }) {
  return (
    <span className="rounded-full px-4 py-1.5 text-[14px] font-bold" style={{ background: '#FFF6EC', border: '1.5px solid #E8D9C8' }}>
      {label} {minutes}분
    </span>
  )
}
