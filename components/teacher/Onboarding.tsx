'use client'

import { useEffect, useState } from 'react'
import { Keeper } from '@/components/mallang/Keeper'
import { PillButton } from '@/components/ui/primitives'
import { useWorld } from '@/lib/client/world'
import { FIELDS, QUEST_TEMPLATES } from '@/lib/domain/master'
import type { WorldSnapshot } from '@/lib/domain/types'

/**
 * T1 — 온보딩 (5스텝 마법사).
 *
 * 새 마을 세우기 / 기존 마을에 상회 열기 분기로 시작한다.
 * 개학 첫날 패키지(첫 수업 45분 대본)는 눈에 띄는 자리에 둔다.
 */
const STEPS = ['시작하기', '클래스 코드', '추천 의뢰', '학생 안내', '완료']

export function Onboarding({ world }: { world: WorldSnapshot }) {
  const { dispatch, say } = useWorld()
  const [step, setStep] = useState(0)
  const [mode, setMode] = useState<'new' | 'join'>('new')
  const [villageName, setVillageName] = useState(world.village.name)
  const [hallName, setHallName] = useState('기가 공작소')
  const [subject, setSubject] = useState('기술·가정')
  // 코드는 마을을 세울 때 서버가 발급한 것이다. 화면에서 새로 만들지 않는다.
  const classCode = world.village.classCode
  const [qr, setQr] = useState('')

  useEffect(() => {
    if (step < 3) return
    let alive = true
    void import('qrcode').then(async (mod) => {
      const url = await mod.toDataURL(`${location.origin}/student?class=${classCode}`, {
        margin: 1,
        color: { dark: '#6E5A54', light: '#FFF6EC' },
        width: 260,
      })
      if (alive) setQr(url)
    })
    return () => {
      alive = false
    }
  }, [step, classCode])

  return (
    <div className="flex flex-col gap-4">
      {/* 개학 첫날 패키지 — 눈에 띄는 자리 */}
      <div
        className="flex flex-wrap items-center gap-4 rounded-[20px] px-6 py-5"
        style={{ background: '#FFF0B3', border: '1.5px solid #B8933A' }}
      >
        <Keeper field="steady" size={70} />
        <div className="flex-1">
          <div className="font-display text-[18px]" style={{ color: '#B8933A' }}>
            개학 첫날 패키지
          </div>
          <div className="text-[14px]">첫 수업 45분 대본 · 교실 게이트 · 모험가 증표가 한 묶음으로 들어 있어요.</div>
        </div>
        <PillButton tint="#FFF6EC" fg="#B8933A" line="#B8933A" onClick={() => window.open('/print', '_blank')}>
          받으러 가기
        </PillButton>
      </div>

      {/* 스텝 표시 */}
      <div className="flex flex-wrap gap-2">
        {STEPS.map((s, i) => (
          <span
            key={s}
            className="rounded-full px-4 py-1.5 text-[13px] font-bold"
            style={{
              background: i === step ? '#FFC9B5' : i < step ? '#C5EBDD' : '#FFF6EC',
              border: '1.5px solid #E8D9C8',
              color: i === step ? '#C96B4A' : '#8C7A72',
            }}
          >
            {i + 1}. {s}
          </span>
        ))}
      </div>

      <div className="rounded-[20px] px-6 py-6" style={{ background: '#FFFFFF', border: '1.5px solid #E8D9C8' }}>
        {step === 0 && (
          <>
            <div className="font-display text-[19px]">어느 쪽으로 시작할까요?</div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Choice on={mode === 'new'} onClick={() => setMode('new')} title="이 마을 이름 정하기" body="지금 들어와 있는 마을을 첫 수업에 맞게 정리해요." />
              <Choice on={mode === 'join'} onClick={() => setMode('join')} title="상회 하나 더 열기" body="다른 과목 수업도 같은 마을에서 연다면 이쪽." />
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {mode === 'new' && (
                <Field label="마을 이름" value={villageName} onChange={setVillageName} />
              )}
              <Field label="상회 이름" value={hallName} onChange={setHallName} />
              <Field label="과목" value={subject} onChange={setSubject} />
            </div>

            <div className="mt-5">
              <PillButton tint="#FFC9B5" fg="#C96B4A" onClick={() => setStep(1)}>
                다음
              </PillButton>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <div className="font-display text-[19px]">클래스 코드</div>
            <p className="mt-2 text-[14px]" style={{ color: '#8C7A72' }}>
              학생은 이 코드나 QR로 들어와요. 실명도 이메일도 받지 않아요.
              <br />
              GM으로 다시 들어올 때는 이 코드와 마을을 세울 때 정한 PIN이 필요해요.
            </p>
            <div
              className="mt-4 inline-block rounded-[20px] px-10 py-6 font-display text-[42px] tracking-[0.2em]"
              style={{ background: '#FFF6EC', border: '1.5px solid #E8D9C8' }}
            >
              {classCode}
            </div>
            <div className="mt-5">
              <PillButton tint="#FFC9B5" fg="#C96B4A" onClick={() => setStep(2)}>
                다음
              </PillButton>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="font-display text-[19px]">추천 의뢰 5종</div>
            <p className="mt-2 text-[14px]" style={{ color: '#8C7A72' }}>
              첫 주에 쓸 만한 것들로 미리 채워 뒀어요. 나중에 다 바꿀 수 있어요.
            </p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {QUEST_TEMPLATES.slice(0, 5).map((t) => (
                <div key={t.key} className="rounded-[16px] px-4 py-3" style={{ background: '#FFF6EC', border: '1.5px solid #E8D9C8' }}>
                  <div className="font-display text-[16px]">{t.title}</div>
                  <div className="text-[12px]" style={{ color: '#8C7A72' }}>
                    {t.subject} · {FIELDS.find((f) => f.key === t.field)?.label}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5">
              <PillButton tint="#FFC9B5" fg="#C96B4A" onClick={() => setStep(3)}>
                다음
              </PillButton>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div className="font-display text-[19px]">학생 안내</div>
            <div className="mt-4 flex flex-wrap items-center gap-6">
              {qr ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={qr} alt="입장 QR" width={180} height={180} style={{ border: '1.5px solid #E8D9C8', borderRadius: 16 }} />
              ) : (
                <div style={{ width: 180, height: 180, borderRadius: 16, background: '#FFF6EC' }} />
              )}
              <div className="text-[15px] leading-relaxed">
                교실 앞에 이 QR을 띄워 두세요.
                <br />
                학생은 스캔하면 바로 게이트 앞에 도착합니다.
                <br />
                <span style={{ color: '#8C7A72' }}>이름은 부르고 싶은 이름으로 직접 지어요.</span>
              </div>
            </div>
            <div className="mt-5">
              <PillButton
                tint="#FFC9B5"
                fg="#C96B4A"
                onClick={async () => {
                  if (mode === 'new') {
                    await dispatch({ type: 'village.found', name: villageName, hallName, subject, at: new Date().toISOString() })
                  } else {
                    await dispatch({ type: 'hall.open', id: `hall-${Date.now()}`, name: hallName, subject })
                  }
                  say('마을이 준비됐어요')
                  setStep(4)
                }}
              >
                {mode === 'new' ? '이대로 시작하기' : '상회 열기'}
              </PillButton>
            </div>
          </>
        )}

        {step === 4 && (
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <Keeper field="care" size={110} className="anim-floaty" />
            <div className="font-display text-[22px]">{villageName} 준비 완료</div>
            <p className="text-[15px]" style={{ color: '#8C7A72' }}>
              첫 수업에서 게이트를 열면 돼요. 원정 발행은 40초면 끝나요.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function Choice({ on, onClick, title, body }: { on: boolean; onClick: () => void; title: string; body: string }) {
  return (
    <button
      onClick={onClick}
      className="squishy rounded-[20px] px-5 py-5 text-left"
      style={{ background: on ? '#FFC9B5' : '#FFF6EC', border: `1.5px solid ${on ? '#C96B4A' : '#E8D9C8'}` }}
    >
      <div className="font-display text-[17px]">{title}</div>
      <div className="mt-1 text-[13px]" style={{ color: '#8C7A72' }}>
        {body}
      </div>
    </button>
  )
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="text-[13px] font-bold" style={{ color: '#8C7A72' }}>
        {label}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full px-5 py-3 text-[16px]"
        style={{ background: '#FFF6EC', border: '1.5px solid #E8D9C8' }}
      />
    </label>
  )
}
