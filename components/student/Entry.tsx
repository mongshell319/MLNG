'use client'

import { useEffect, useState } from 'react'
import { Mallang } from '@/components/mallang/Mallang'
import { Keeper } from '@/components/mallang/Keeper'
import { PillButton } from '@/components/ui/primitives'
import { useWorld } from '@/lib/client/world'
import { BODY_TINTS } from '@/lib/domain/master'

/**
 * S1 — 입장 · 캐릭터 생성.
 *
 * 첫 3분이 전부를 결정한다. 사무적 절차를 앞에 두지 않는다.
 * 게이트가 열리고 → 세계가 보이고 → 터줏말랑이 말을 걸고 →
 * 그 대화 안에서 이름과 색을 정하고 → 이세계 주민등록증으로 끝난다.
 *
 * 실명·이메일 필드는 없다 (§3-5). 말랑 코드는 서버가 만들고,
 * 한 번 확인한 뒤로는 서명 쿠키만 오간다 — 코드가 요청마다 돌아다니지 않는다.
 */

type Step = 'gate' | 'class' | 'greet' | 'color' | 'name' | 'card' | 'resume'

export function Entry({ classCode: initialClass }: { classCode?: string }) {
  const { refresh } = useWorld()
  const [step, setStep] = useState<Step>('gate')
  const [classCode, setClassCode] = useState((initialClass ?? '').toUpperCase())
  const [villageName, setVillageName] = useState('')
  const [color, setColor] = useState(BODY_TINTS[0])
  const [name, setName] = useState('')
  const [mallangCode, setMallangCode] = useState('')
  const [madeCode, setMadeCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [problem, setProblem] = useState('')

  // 게이트가 열리고 나면 코드가 이미 있으면(QR로 들어온 경우) 바로 대화로 넘어간다.
  useEffect(() => {
    if (step !== 'gate') return
    const id = setTimeout(() => setStep(classCode.length === 6 ? 'greet' : 'class'), 2400)
    return () => clearTimeout(id)
  }, [step, classCode])

  // 마을 이름을 미리 알아 두면 터줏말랑이 이름을 부르며 맞이할 수 있다.
  useEffect(() => {
    if (classCode.length !== 6) return
    let alive = true
    void fetch(`/api/enter/student?class=${classCode}`)
      .then((r) => r.json())
      .then((j: { villageName?: string }) => {
        if (alive && j.villageName) setVillageName(j.villageName)
      })
      .catch(() => undefined)
    return () => {
      alive = false
    }
  }, [classCode])

  const checkClass = async () => {
    setProblem('')
    if (classCode.length !== 6) {
      setProblem('코드 6자리를 입력해주세요')
      return
    }
    setBusy(true)
    const res = await fetch(`/api/enter/student?class=${classCode}`)
    const json = (await res.json()) as { villageName?: string; error?: string }
    setBusy(false)
    if (!res.ok) {
      setProblem(json.error ?? '그 코드의 마을을 찾지 못했어요')
      return
    }
    setVillageName(json.villageName ?? '')
    setStep('greet')
  }

  const create = async () => {
    setProblem('')
    setBusy(true)
    const res = await fetch('/api/enter/student', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ classCode, name: name.trim(), bodyColor: color }),
    })
    const json = (await res.json()) as { code?: string; error?: string }
    setBusy(false)
    if (!res.ok || !json.code) {
      setProblem(json.error ?? '지금은 들어가지 못했어요')
      return
    }
    setMadeCode(json.code)
    setStep('card')
  }

  const resume = async () => {
    setProblem('')
    const code = mallangCode.toUpperCase().trim()
    if (code.length !== 6) {
      setProblem('코드 6자리를 입력해주세요')
      return
    }
    setBusy(true)
    const res = await fetch('/api/enter/student', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ classCode, mallangCode: code }),
    })
    const json = (await res.json()) as { error?: string }
    setBusy(false)
    if (!res.ok) {
      setProblem(json.error ?? '그 코드의 말랑이를 아직 못 찾았어요')
      return
    }
    await refresh()
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

  if (step === 'class') {
    return (
      <Scene>
        <Keeper field="care" size={140} className="anim-floaty" />
        <Bubble>어디에서 왔니? 문에 적힌 여섯 글자를 알려 줘.</Bubble>
        <CodeInput value={classCode} onChange={setClassCode} placeholder="클래스 코드" />
        <Problem text={problem} />
        <PillButton tint="#FFC9B5" fg="#C96B4A" size="lg" onClick={checkClass} disabled={busy}>
          {busy ? '보는 중…' : '문 두드리기'}
        </PillButton>
      </Scene>
    )
  }

  if (step === 'resume') {
    return (
      <Scene>
        <Keeper field="care" size={130} className="anim-floaty" />
        <Bubble>이미 말랑이가 있구나. 코드를 알려 줘.</Bubble>
        <CodeInput value={mallangCode} onChange={setMallangCode} placeholder="말랑 코드 6자" />
        <Problem text={problem} />
        <div className="flex gap-3">
          <PillButton tint="#FFFFFF" line="#E8D9C8" onClick={() => setStep('greet')}>
            뒤로
          </PillButton>
          <PillButton tint="#FFC9B5" fg="#C96B4A" onClick={resume} disabled={busy}>
            {busy ? '찾는 중…' : '이어받기'}
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
          어서 와. 여기가 {villageName || '우리 마을'}이야.
          <br />
          네 이름은 뭐라고 부를까?
        </Bubble>
        <div className="flex flex-wrap justify-center gap-3">
          <PillButton tint="#FFC9B5" fg="#C96B4A" size="lg" onClick={() => setStep('color')}>
            이름 지으러 가기
          </PillButton>
          <PillButton tint="#FFFFFF" line="#E8D9C8" size="lg" onClick={() => setStep('resume')}>
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
        <Problem text={problem} />
        <PillButton
          tint="#FFC9B5"
          fg="#C96B4A"
          size="lg"
          reason={name.trim() ? undefined : '이름을 지어 주세요'}
          onClick={create}
          disabled={busy}
        >
          {busy ? '들어가는 중…' : '이 이름으로 살래'}
        </PillButton>
      </Scene>
    )
  }

  return (
    <IdCard
      villageName={villageName}
      name={name || '이름없는말랑'}
      color={color}
      code={madeCode}
      onEnter={() => void refresh()}
    />
  )
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

function CodeInput({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value.toUpperCase().replace(/\s/g, '').slice(0, 6))}
      placeholder={placeholder}
      inputMode="text"
      autoCapitalize="characters"
      autoComplete="off"
      className="w-[280px] px-6 py-3 text-center text-[20px] font-bold tracking-[0.2em]"
      style={{ background: '#FFFFFF', border: '1.5px solid #E8D9C8' }}
    />
  )
}

/** 안내는 안내지 경고가 아니다. 빨강을 쓰지 않는다 (§3-3). */
function Problem({ text }: { text: string }) {
  if (!text) return null
  return (
    <div className="anim-popin text-[14px]" style={{ color: '#8C7A72' }}>
      {text}
    </div>
  )
}

/** 이세계 주민등록증 — 코팅해서 나눠 주면 P1 모험가 증표가 된다. */
function IdCard({
  villageName,
  name,
  color,
  code,
  onEnter,
}: {
  villageName: string
  name: string
  color: string
  code: string
  onEnter: () => void
}) {
  const [qr, setQr] = useState('')

  useEffect(() => {
    let alive = true
    void import('qrcode').then(async (mod) => {
      const url = await mod.toDataURL(code, {
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
              {villageName || '우리 마을'}
            </div>
          </div>
        </div>
        <div
          className="mt-5 flex items-center justify-between rounded-[16px] px-4 py-3"
          style={{ background: '#FFFFFF', border: '1.5px solid #E8D9C8' }}
        >
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
        이 코드로 학년이 바뀌어도 같은 말랑이를 이어받아요. 적어 두거나 증표를 챙겨 두세요.
      </div>
      <PillButton tint="#FFC9B5" fg="#C96B4A" size="lg" onClick={onEnter}>
        마을로 들어가기
      </PillButton>
    </Scene>
  )
}
