'use client'

import { useEffect, useState } from 'react'
import { Mallang } from '@/components/mallang/Mallang'
import { Keeper } from '@/components/mallang/Keeper'
import { PillButton } from '@/components/ui/primitives'
import { useWorld } from '@/lib/client/world'
import { BODY_TINTS } from '@/lib/domain/master'
import type { WorldSnapshot } from '@/lib/domain/types'

/**
 * S1 — 입장 · 캐릭터 생성.
 *
 * 첫 3분이 전부를 결정한다. 사무적 절차를 앞에 두지 않는다.
 * 게이트가 열리고 → 세계가 보이고 → 터줏말랑이 말을 걸고 →
 * 그 대화 안에서 이름과 색을 정하고 → 이세계 주민등록증으로 끝난다.
 *
 * 실명·이메일 필드는 없다. 학생 식별은 말랑이 이름과 말랑 코드뿐이다 (§3-5).
 */

type Step = 'gate' | 'greet' | 'color' | 'name' | 'card' | 'code'

function newCode(): string {
  const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const D = '23456789'
  const pick = (s: string) => s[Math.floor(Math.random() * s.length)]
  return pick(A) + pick(A) + pick(D) + pick(D) + pick(A) + pick(D)
}

export function Entry({ world }: { world: WorldSnapshot }) {
  const { dispatch, setMyCode } = useWorld()
  const [step, setStep] = useState<Step>('gate')
  const [color, setColor] = useState(BODY_TINTS[0])
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [madeCode, setMadeCode] = useState('')
  const [codeNote, setCodeNote] = useState('')

  useEffect(() => {
    if (step !== 'gate') return
    const id = setTimeout(() => setStep('greet'), 2600)
    return () => clearTimeout(id)
  }, [step])

  const create = async () => {
    const c = newCode()
    setMadeCode(c)
    await dispatch({
      type: 'mallang.create',
      id: `m-${Date.now()}`,
      code: c,
      name: name.trim() || '이름없는말랑',
      bodyColor: color,
      hallId: world.halls[0]?.id ?? 'hall-1',
      at: new Date().toISOString(),
    })
    setStep('card')
  }

  const resume = () => {
    const up = code.toUpperCase()
    if (up.length !== 6) {
      setCodeNote('코드 6자리를 입력해주세요')
      return
    }
    if (!world.mallangs.some((m) => m.code === up)) {
      setCodeNote('그 코드의 말랑이를 아직 못 찾았어요')
      return
    }
    setMyCode(up)
  }

  // 어두운 화면에서 게이트가 열린다
  if (step === 'gate') {
    return (
      <div className="flex min-h-screen items-center justify-center overflow-hidden" style={{ background: '#3A3350' }}>
        <svg width={420} height={520} viewBox="0 0 420 520" className="anim-gatelight" aria-label="게이트">
          <defs>
            <radialGradient id="entryglow">
              <stop offset="0%" stopColor="#FFF0B3" stopOpacity={0.9} />
              <stop offset="100%" stopColor="#FFF0B3" stopOpacity={0} />
            </radialGradient>
          </defs>
          <circle cx={210} cy={250} r={230} fill="url(#entryglow)" />
          <path d="M70 500 V210 a140 140 0 0 1 280 0 V500" fill="none" stroke="#FFF6EC" strokeWidth={16} strokeLinecap="round" />
          <path d="M108 500 V214 a102 102 0 0 1 204 0 V500 Z" fill="#FFF6EC" opacity={0.16} />
        </svg>
      </div>
    )
  }

  if (step === 'code') {
    return (
      <Scene>
        <Keeper field="care" size={130} className="anim-floaty" />
        <Bubble>이미 말랑이가 있구나. 코드를 알려 줘.</Bubble>
        <input
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase().slice(0, 6))
            setCodeNote('')
          }}
          placeholder="말랑 코드 6자"
          inputMode="text"
          autoCapitalize="characters"
          className="w-[260px] px-6 py-3 text-center text-[20px] font-bold tracking-[0.2em]"
          style={{ background: '#FFFFFF', border: '1.5px solid #E8D9C8' }}
        />
        {codeNote && (
          <div className="text-[14px]" style={{ color: '#8C7A72' }}>
            {codeNote}
          </div>
        )}
        <div className="flex gap-3">
          <PillButton tint="#FFFFFF" line="#E8D9C8" onClick={() => setStep('greet')}>
            뒤로
          </PillButton>
          <PillButton tint="#FFC9B5" fg="#C96B4A" onClick={resume}>
            이어받기
          </PillButton>
        </div>
      </Scene>
    )
  }

  if (step === 'greet') {
    return (
      <Scene>
        <Keeper field="care" size={150} className="anim-floaty" />
        <Bubble>
          어서 와. 여기가 {world.village.name}이야.
          <br />
          네 이름은 뭐라고 부를까?
        </Bubble>
        <div className="flex gap-3">
          <PillButton tint="#FFC9B5" fg="#C96B4A" size="lg" onClick={() => setStep('color')}>
            이름 지으러 가기
          </PillButton>
          <PillButton tint="#FFFFFF" line="#E8D9C8" size="lg" onClick={() => setStep('code')}>
            말랑이가 이미 있어요
          </PillButton>
        </div>
      </Scene>
    )
  }

  if (step === 'color') {
    return (
      <Scene>
        <Mallang color={color} size={170} face="glad" className="anim-floaty" />
        <Bubble>몸 색부터 골라 볼까. 마음에 드는 걸로.</Bubble>
        <div className="flex flex-wrap justify-center gap-3">
          {BODY_TINTS.map((t) => (
            <button
              key={t}
              onClick={() => setColor(t)}
              className="squishy rounded-full"
              aria-label={`몸색 ${t}`}
              style={{
                width: 56,
                height: 56,
                background: t,
                border: `${color === t ? 3 : 1.5}px solid ${color === t ? '#6E5A54' : '#E8D9C8'}`,
              }}
            />
          ))}
        </div>
        <PillButton tint="#FFC9B5" fg="#C96B4A" size="lg" onClick={() => setStep('name')}>
          이 색으로 할래
        </PillButton>
      </Scene>
    )
  }

  if (step === 'name') {
    return (
      <Scene>
        <Mallang color={color} size={170} face="glad" className="anim-floaty" />
        <Bubble>뭐라고 부르면 좋을까?</Bubble>
        <input
          value={name}
          onChange={(e) => setName(e.target.value.slice(0, 8))}
          placeholder="여덟 자까지"
          className="w-[280px] px-6 py-3 text-center text-[20px] font-bold"
          style={{ background: '#FFFFFF', border: '1.5px solid #E8D9C8' }}
        />
        <div className="text-[14px]" style={{ color: '#8C7A72' }}>
          실명 말고, 부르고 싶은 이름!
        </div>
        <PillButton
          tint="#FFC9B5"
          fg="#C96B4A"
          size="lg"
          reason={name.trim() ? undefined : '이름을 지어 주세요'}
          onClick={create}
        >
          이 이름으로 살래
        </PillButton>
      </Scene>
    )
  }

  return <IdCard world={world} name={name || '이름없는말랑'} color={color} code={madeCode} onEnter={() => setMyCode(madeCode)} />
}

function Scene({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center gap-5 px-6 text-center"
      style={{ background: 'linear-gradient(#FFF6EC 0%, #FFF6EC 58%, #CFE0D4 58%, #A9C4B2 100%)' }}
    >
      {children}
    </div>
  )
}

function Bubble({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="anim-popin max-w-[420px] rounded-[20px] px-7 py-5 text-[17px] leading-relaxed"
      style={{ background: '#FFFFFF', border: '1.5px solid #E8D9C8' }}
    >
      {children}
    </div>
  )
}

/** 이세계 주민등록증 — 코팅해서 나눠 주면 P1 모험가 증표가 된다. */
function IdCard({
  world,
  name,
  color,
  code,
  onEnter,
}: {
  world: WorldSnapshot
  name: string
  color: string
  code: string
  onEnter: () => void
}) {
  const [qr, setQr] = useState('')

  useEffect(() => {
    let alive = true
    void import('qrcode').then(async (mod) => {
      const url = await mod.toDataURL(`${location.origin}/student?code=${code}`, {
        margin: 1,
        color: { dark: '#6E5A54', light: '#FFF6EC' },
        width: 220,
      })
      if (alive) setQr(url)
    })
    return () => {
      alive = false
    }
  }, [code])

  return (
    <Scene>
      <div
        className="anim-popin w-[360px] rounded-[24px] px-8 py-7"
        style={{ background: '#FFF6EC', border: '2px solid #6E5A54' }}
      >
        <div className="text-center font-display text-[15px]" style={{ color: '#8C7A72' }}>
          이세계 주민등록증
        </div>
        <div className="mt-4 flex items-center gap-5">
          <Mallang color={color} size={110} face="glad" />
          <div className="text-left">
            <div className="font-display text-[26px]">{name}</div>
            <div className="mt-1 text-[13px]" style={{ color: '#8C7A72' }}>
              {world.village.name} · 시즌 {world.village.season}
            </div>
          </div>
        </div>
        <div className="mt-5 flex items-center justify-between rounded-[16px] px-4 py-3" style={{ background: '#FFFFFF', border: '1.5px solid #E8D9C8' }}>
          <div>
            <div className="text-[12px]" style={{ color: '#B8A99E' }}>
              말랑 코드
            </div>
            <div className="font-display text-[22px] tracking-[0.15em]">{code}</div>
          </div>
          {qr ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qr} alt="말랑 코드 QR" width={72} height={72} />
          ) : (
            <div style={{ width: 72, height: 72 }} />
          )}
        </div>
      </div>
      <div className="max-w-[340px] text-[14px]" style={{ color: '#8C7A72' }}>
        이 코드로 학년이 바뀌어도 같은 말랑이를 이어받아요.
      </div>
      <PillButton tint="#FFC9B5" fg="#C96B4A" size="lg" onClick={onEnter}>
        마을로 들어가기
      </PillButton>
    </Scene>
  )
}
