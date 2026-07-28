'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useNow, useWorld } from '@/lib/client/world'
import { GmGate } from '@/components/teacher/GmGate'
import { Loader, PillButton, Toast } from '@/components/ui/primitives'
import { EXPEDITIONS, PHASE_LABEL } from '@/lib/domain/master'
import { OPENING_SECONDS, SETTLE_STAGE_LABEL, derivePhase, settlePlan } from '@/lib/domain/phase'
import type { ExpeditionType } from '@/lib/domain/types'

/**
 * 시연 콘솔.
 *
 * 여덟 개 상태를 손으로 확인하려면 오프닝 40초와 정산 125초를 매번 기다려야 하고,
 * 안개가 물러나는 걸 보려면 학생 스무 명이 필요하다. 그걸 한 번씩 눌러서 볼 수 있게 모았다.
 *
 * 시간 여행은 별도 장치 없이 된다 — 세션의 시각을 과거로 주면 파생 phase 가 그 지점이 된다.
 * 정산 시퀀스를 timestamp 에서 파생시킨 설계가 여기서 그대로 쓸모가 된다.
 */
export default function DevConsole() {
  const { world, needsEntry, loading, identity, dispatch, note, say } = useWorld()
  const now = useNow(400)
  const [busy, setBusy] = useState('')
  const [count, setCount] = useState(12)

  if (needsEntry) return <GmGate />
  if (loading || !world) return <Loader label="시연 콘솔을 여는 중이에요" />
  if (identity?.kind !== 'gm') return <GmGate />

  const derived = derivePhase(world.session, now)
  const at = (secondsAgo = 0) => new Date(Date.now() - secondsAgo * 1000).toISOString()

  const run = async (label: string, fn: () => Promise<unknown>) => {
    setBusy(label)
    try {
      await fn()
    } finally {
      setBusy('')
    }
  }

  const dev = async (body: Record<string, unknown>) => {
    const res = await fetch('/api/dev', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    })
    const json = (await res.json()) as { error?: string; delivered?: number }
    if (!res.ok) say(json.error ?? '안 됐어요')
    else if (json.delivered !== undefined) say(`${json.delivered}명이 전달했어요`)
    return json
  }

  /** 원정을 열되, 시작 시각을 과거로 줘서 원하는 지점에서 시작한다. */
  const openAt = (secondsAgo: number, type?: ExpeditionType) =>
    dispatch({
      type: 'session.open',
      siteId: world.session.siteId,
      segmentIndex: world.session.segmentIndex,
      expeditionType: type ?? world.session.expeditionType,
      minutes: 25,
      at: at(secondsAgo),
    })

  /** 정산 구간마다 시작 오프셋이 다르다. 계획에서 그대로 뽑아 쓴다. */
  const settleOffsets = () => {
    const plan = settlePlan({ ...world.session, spotlight: world.session.spotlight })
    let acc = 0
    return plan.map((s) => {
      const from = acc
      acc += s.seconds
      return { stage: s.stage, from }
    })
  }

  const openWindow = (path: string) => window.open(path, '_blank', 'noopener')

  const openScreen = async () => {
    const res = await fetch('/api/enter/screen', { method: 'POST' })
    const json = (await res.json()) as { token?: string; error?: string }
    if (!json.token) return say(json.error ?? '토큰을 못 만들었어요')
    openWindow(`/api/enter/screen?t=${json.token}`)
  }

  return (
    <div className="mx-auto w-full max-w-[1100px] px-5 py-6">
      <header className="mb-5 flex flex-wrap items-center gap-3">
        <Link href="/teacher" className="font-display text-[22px]">
          말랑스쿨 시연 콘솔
        </Link>
        <span className="rounded-full px-3 py-1 text-[12px] font-bold" style={{ background: '#FFF0B3', color: '#B8933A' }}>
          개발 전용
        </span>
        <span className="text-[13px]" style={{ color: '#8C7A72' }}>
          {world.village.name} · 코드 {world.village.classCode} · 주민 {world.mallangs.length}명
        </span>
        <span className="ml-auto rounded-full px-4 py-2 text-[13px] font-bold" style={{ background: '#D9D2F5', color: '#7A6BB5' }}>
          {PHASE_LABEL[derived.phase]}
          {derived.stage ? ` · ${SETTLE_STAGE_LABEL[derived.stage]}` : ''} · 진행도{' '}
          {world.session.prog.toFixed(0)}%
        </span>
      </header>

      <Section title="1. 세 화면 열기" hint="역할마다 쿠키가 달라서 한 브라우저에서 셋을 동시에 열어 둘 수 있어요.">
        <Row>
          <PillButton tint="#D9D2F5" fg="#7A6BB5" onClick={openScreen}>
            교실 TV 열기
          </PillButton>
          <PillButton tint="#FFC9B5" fg="#C96B4A" onClick={() => openWindow(`/student?class=${world.village.classCode}`)}>
            학생 화면 열기
          </PillButton>
          <PillButton tint="#C5EBDD" fg="#4A8B6F" onClick={() => openWindow('/teacher')}>
            교사 화면 열기
          </PillButton>
          <PillButton tint="#FFF6EC" line="#E8D9C8" onClick={() => openWindow('/print')}>
            인쇄물
          </PillButton>
        </Row>
      </Section>

      <Section title="2. 학생 대신 전달하기" hint="브라우저를 스무 개 띄우는 대신 서버가 눌러 줍니다.">
        <Row>
          <label className="flex items-center gap-3 text-[14px]">
            <span style={{ color: '#8C7A72' }}>인원</span>
            <input
              type="range"
              min={1}
              max={world.mallangs.length || 28}
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              style={{ width: 180 }}
            />
            <b className="font-display text-[18px]">{count}명</b>
          </label>
          <PillButton
            tint="#FFC9B5"
            fg="#C96B4A"
            onClick={() => run('deliver', () => dev({ op: 'deliver', count, approve: false }))}
          >
            {busy === 'deliver' ? '누르는 중…' : '전달만'}
          </PillButton>
          <PillButton
            tint="#C96B4A"
            fg="#FFF6EC"
            onClick={() => run('deliverApprove', () => dev({ op: 'deliver', count, approve: true }))}
          >
            {busy === 'deliverApprove' ? '누르는 중…' : '전달 + GM 승인'}
          </PillButton>
          <PillButton tint="#FFF6EC" line="#E8D9C8" onClick={() => run('clear', () => dev({ op: 'clearProgress' }))}>
            전달 기록 지우기
          </PillButton>
        </Row>
        <div className="mt-2 text-[13px]" style={{ color: '#8C7A72' }}>
          전달 중 {world.progress.filter((p) => p.status === 'delivering').length}건 · 해결{' '}
          {world.progress.filter((p) => p.status === 'solved').length}건
        </div>
      </Section>

      <Section title="3. 상태로 바로 가기" hint="오프닝 40초·정산 125초를 기다리지 않고 원하는 지점에서 시작합니다.">
        <Row>
          <Jump label="원정 전" onClick={() => dispatch({ type: 'session.reset', at: at() })} />
          <Jump label="오프닝 처음" onClick={() => openAt(0)} />
          <Jump label="오프닝 끝(게이트)" onClick={() => openAt(OPENING_SECONDS - 5)} />
          <Jump
            label="원정 중"
            onClick={async () => {
              await openAt(OPENING_SECONDS + 1)
              await dispatch({ type: 'session.live', at: at() })
            }}
          />
          <Jump label="자유 시간" onClick={() => dispatch({ type: 'session.after', at: at() })} />
        </Row>
        {world.session.spotlight.length === 0 && (
          <div className="mt-2 text-[13px]" style={{ color: '#8C7A72' }}>
            스포트라이트 구간은 전달한 학생이 있어야 나옵니다 — 위에서 먼저 전달시켜 보세요.
          </div>
        )}
        <Row>
          {settleOffsets().map((s) => (
            <Jump
              key={s.stage}
              label={`정산 · ${SETTLE_STAGE_LABEL[s.stage]}`}
              tint="#C5EBDD"
              fg="#4A8B6F"
              onClick={() => dispatch({ type: 'session.settle', fast: false, at: at(s.from + 1) })}
            />
          ))}
        </Row>
        <Row>
          <Jump label="난관" tint="#D9D2F5" fg="#7A6BB5" onClick={() => dispatch({ type: 'crisis.start', kind: 'fog', goal: 20, seconds: 180, at: at() })} />
          <Jump label="레이드" tint="#D9D2F5" fg="#7A6BB5" onClick={() => dispatch({ type: 'crisis.start', kind: 'raid', goal: 24, seconds: 300, at: at() })} />
          <Jump label="난관 마무리" tint="#D9D2F5" fg="#7A6BB5" onClick={() => dispatch({ type: 'crisis.end', at: at() })} />
          <Jump label="물드는 밤" tint="#3A3350" fg="#FFF6EC" onClick={() => dispatch({ type: 'session.night', at: at() })} />
          <Jump label="시즌 완공식" tint="#FFF0B3" fg="#B8933A" onClick={() => dispatch({ type: 'session.finale', at: at() })} />
        </Row>
        <Row>
          <Jump label="타이머" tint="#FFF6EC" fg="#8C7A72" onClick={() => dispatch({ type: 'tool.open', kind: 'timer', seconds: 300, raffleName: '', at: at() })} />
          <Jump label="뽑기" tint="#FFF6EC" fg="#8C7A72" onClick={() => dispatch({ type: 'tool.open', kind: 'raffle', seconds: 20, raffleName: world.mallangs[3]?.name ?? '민트별', at: at() })} />
          <Jump label="모둠 편성" tint="#FFF6EC" fg="#8C7A72" onClick={() => dispatch({ type: 'tool.open', kind: 'party', seconds: 30, raffleName: '', at: at() })} />
          <Jump label="잔도구 닫기" tint="#FFF6EC" fg="#8C7A72" onClick={() => dispatch({ type: 'tool.close' })} />
        </Row>
      </Section>

      <Section title="4. 원정 유형 7종" hint="유형마다 필드 진행 시각화가 다릅니다. 교실 TV를 열어 두고 눌러 보세요.">
        <Row>
          {EXPEDITIONS.map((e) => (
            <Jump
              key={e.key}
              label={e.label}
              tint={world.session.expeditionType === e.key ? '#D9D2F5' : '#FFF6EC'}
              fg={world.session.expeditionType === e.key ? '#7A6BB5' : '#8C7A72'}
              onClick={async () => {
                await openAt(OPENING_SECONDS + 1, e.key)
                await dispatch({ type: 'session.live', at: at() })
              }}
            />
          ))}
        </Row>
        <div className="mt-2 text-[13px]" style={{ color: '#8C7A72' }}>
          {EXPEDITIONS.find((e) => e.key === world.session.expeditionType)?.visual}
        </div>
      </Section>

      <Section title="5. 세계 되돌리기" hint="시연 데이터(주민 28명·지난 기록)로 다시 채웁니다.">
        <Row>
          <PillButton tint="#FFF6EC" line="#E8D9C8" onClick={() => run('reset', () => dev({ op: 'reset', demo: true }))}>
            {busy === 'reset' ? '되돌리는 중…' : '시연 상태로 리셋'}
          </PillButton>
          <PillButton tint="#FFF6EC" line="#E8D9C8" onClick={() => run('empty', () => dev({ op: 'reset', demo: false }))}>
            빈 마을로 리셋
          </PillButton>
        </Row>
      </Section>

      <Toast message={note} />
    </div>
  )
}

function Section({ title, hint, children }: { title: string; hint: string; children: React.ReactNode }) {
  return (
    <section className="mb-4 rounded-[20px] px-6 py-5" style={{ background: '#FFFFFF', border: '1.5px solid #E8D9C8' }}>
      <div className="font-display text-[18px]">{title}</div>
      <div className="mb-3 text-[13px]" style={{ color: '#8C7A72' }}>
        {hint}
      </div>
      {children}
    </section>
  )
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="mt-2 flex flex-wrap items-center gap-2">{children}</div>
}

function Jump({
  label,
  onClick,
  tint = '#FFC9B5',
  fg = '#C96B4A',
}: {
  label: string
  onClick: () => void | Promise<unknown>
  tint?: string
  fg?: string
}) {
  return (
    <button
      onClick={() => void onClick()}
      className="squishy rounded-full px-4 py-2 text-[13px] font-bold"
      style={{ background: tint, color: fg, border: '1.5px solid #E8D9C8' }}
    >
      {label}
    </button>
  )
}
