'use client'

import { useState } from 'react'
import { Keeper } from '@/components/mallang/Keeper'
import { PillButton } from '@/components/ui/primitives'
import { useWorld } from '@/lib/client/world'

/**
 * 교사 입장.
 *
 * 이메일도 비밀번호도 받지 않는다. 클래스 코드와 PIN 한 쌍이 그 마을의 GM 자격이다.
 * 학생과 같은 원칙(계정 없음)을 교사 쪽에도 그대로 적용한 것이고,
 * 덕분에 학교 계정 연동 없이 첫 수업을 열 수 있다.
 */
export function GmGate() {
  const { refresh } = useWorld()
  const [mode, setMode] = useState<'enter' | 'create'>('enter')
  const [classCode, setClassCode] = useState('')
  const [pin, setPin] = useState('')
  const [villageName, setVillageName] = useState('')
  const [hallName, setHallName] = useState('')
  const [subject, setSubject] = useState('')
  const [busy, setBusy] = useState(false)
  const [problem, setProblem] = useState('')
  const [madeCode, setMadeCode] = useState('')

  const enter = async () => {
    setProblem('')
    setBusy(true)
    const res = await fetch('/api/enter/gm', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ classCode: classCode.toUpperCase(), pin }),
    })
    const json = (await res.json()) as { error?: string }
    setBusy(false)
    if (!res.ok) {
      setProblem(json.error ?? '코드나 PIN이 맞지 않아요')
      return
    }
    await refresh()
  }

  const create = async () => {
    setProblem('')
    if (pin.trim().length < 4) {
      setProblem('PIN은 네 자 이상으로 정해 주세요')
      return
    }
    setBusy(true)
    const res = await fetch('/api/village', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ villageName, hallName, subject, pin }),
    })
    const json = (await res.json()) as { classCode?: string; error?: string }
    setBusy(false)
    if (!res.ok || !json.classCode) {
      setProblem(json.error ?? '지금은 마을을 세우지 못했어요')
      return
    }
    setMadeCode(json.classCode)
  }

  if (madeCode) {
    return (
      <Shell>
        <Keeper field="steady" size={120} className="anim-floaty" />
        <div className="font-display text-[24px]">마을이 세워졌어요</div>
        <p className="max-w-[420px] text-center text-[15px]" style={{ color: '#8C7A72' }}>
          학생은 이 코드로 들어옵니다. PIN과 함께 적어 두세요 — 다음에 GM으로 들어올 때 필요해요.
        </p>
        <div
          className="rounded-[20px] px-10 py-6 text-center font-display text-[40px] tracking-[0.2em]"
          style={{ background: '#FFF6EC', border: '1.5px solid #E8D9C8' }}
        >
          {madeCode}
        </div>
        <PillButton tint="#FFC9B5" fg="#C96B4A" size="lg" onClick={() => void refresh()}>
          교무실로 들어가기
        </PillButton>
      </Shell>
    )
  }

  return (
    <Shell>
      <Keeper field="making" size={110} className="anim-floaty" />
      <div className="font-display text-[24px]">말랑스쿨 GM</div>

      <div className="flex gap-2">
        <Tab on={mode === 'enter'} onClick={() => setMode('enter')}>
          들어가기
        </Tab>
        <Tab on={mode === 'create'} onClick={() => setMode('create')}>
          새 마을 세우기
        </Tab>
      </div>

      <div
        className="flex w-full max-w-[420px] flex-col gap-3 rounded-[20px] px-6 py-6"
        style={{ background: '#FFFFFF', border: '1.5px solid #E8D9C8' }}
      >
        {mode === 'create' && (
          <>
            <Field label="마을 이름" value={villageName} onChange={setVillageName} placeholder="작은 말랑 마을" />
            <Field label="상회 이름" value={hallName} onChange={setHallName} placeholder="기가 공작소" />
            <Field label="과목" value={subject} onChange={setSubject} placeholder="기술·가정" />
          </>
        )}

        {mode === 'enter' && (
          <Field
            label="클래스 코드"
            value={classCode}
            onChange={(v) => setClassCode(v.toUpperCase().replace(/\s/g, '').slice(0, 6))}
            placeholder="여섯 글자"
          />
        )}

        <Field label="PIN" value={pin} onChange={setPin} placeholder="네 자 이상" type="password" />

        {problem && (
          <div className="text-[14px]" style={{ color: '#8C7A72' }}>
            {problem}
          </div>
        )}

        <div className="mt-1">
          <PillButton
            tint="#FFC9B5"
            fg="#C96B4A"
            size="lg"
            full
            onClick={mode === 'enter' ? enter : create}
            disabled={busy}
          >
            {busy ? '여는 중…' : mode === 'enter' ? '들어가기' : '마을 세우기'}
          </PillButton>
        </div>
      </div>
    </Shell>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center gap-4 px-6"
      style={{ background: 'linear-gradient(#FFF6EC 0%, #FFF6EC 62%, #CFE0D4 62%, #A9C4B2 100%)' }}
    >
      {children}
    </div>
  )
}

function Tab({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="squishy rounded-full px-5 py-2 text-[14px] font-bold"
      style={{
        background: on ? '#FFF0B3' : '#FFFFFF',
        border: `1.5px solid ${on ? '#B8933A' : '#E8D9C8'}`,
        color: on ? '#B8933A' : '#8C7A72',
      }}
    >
      {children}
    </button>
  )
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
}) {
  return (
    <label className="block">
      <span className="text-[13px] font-bold" style={{ color: '#8C7A72' }}>
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        className="mt-1 w-full px-5 py-3 text-[16px]"
        style={{ background: '#FFF6EC', border: '1.5px solid #E8D9C8' }}
      />
    </label>
  )
}
