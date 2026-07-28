'use client'

import { useMemo, useState } from 'react'
import { ExpeditionIcon } from '@/components/ui/Icons'
import { PillButton } from '@/components/ui/primitives'
import { useWorld } from '@/lib/client/world'
import { EXPEDITIONS, FIELD_BY_KEY, QUEST_TEMPLATES } from '@/lib/domain/master'
import type { ExpeditionType, Quest, WorldSnapshot } from '@/lib/domain/types'

/**
 * T2 — 원정 발행.
 *
 * 3단계가 시각적으로 드러나고, 40초 안에 끝나 보여야 한다.
 * 그래서 2단계에서 화면의 주인공은 활동명 한 필드뿐이고,
 * 의뢰인·문구·보상·검증·마감은 자동으로 채워진 채 접혀 있다.
 */
export function Publish({ world }: { world: WorldSnapshot }) {
  const { dispatch, say } = useWorld()
  const [step, setStep] = useState(1)
  const [subject, setSubject] = useState('전체')
  const [tplKey, setTplKey] = useState(QUEST_TEMPLATES[0].key)
  const [title, setTitle] = useState(QUEST_TEMPLATES[0].title)
  const [type, setType] = useState<ExpeditionType>(QUEST_TEMPLATES[0].type)
  const [detailOpen, setDetailOpen] = useState(false)
  const [verification, setVerification] = useState<'gm' | 'auto'>('gm')
  const [reserve, setReserve] = useState(false)
  const [repeat, setRepeat] = useState(true)

  const tpl = QUEST_TEMPLATES.find((t) => t.key === tplKey)!
  const subjects = useMemo(() => ['전체', ...new Set(QUEST_TEMPLATES.map((t) => t.subject))], [])
  const filtered = QUEST_TEMPLATES.filter((t) => subject === '전체' || t.subject === subject)

  // 예상 검증 부담 — 반 인원 기준. 자동 인증이면 0건.
  const expected = verification === 'gm' ? world.mallangs.length : 0
  const minutes = Math.max(1, Math.round((expected * 6) / 60))

  const publish = async () => {
    const quest: Quest = {
      id: `q-${Date.now()}`,
      hallId: world.halls[0]?.id ?? 'hall-1',
      kind: 'main',
      field: tpl.field,
      title: title.trim() || tpl.title,
      client: tpl.field,
      story: {
        situation: `${FIELD_BY_KEY[tpl.field].keeper}이(가) 오늘 것을 들고 왔어.`,
        request: `${title.trim() || tpl.title} — 이거 하나만 봐 주면 돼.`,
        promise: '해 주면 마을에 하나 보태 둘게.',
      },
      reward: { mongle: 12, xp: 60 },
      checklist: tpl.checklist,
      verification,
      expiresAt: new Date(Date.now() + 2 * 86_400_000).toISOString(),
      carriedOver: false,
      createdAt: new Date().toISOString(),
    }
    await dispatch({ type: 'quest.publish', quest })
    await dispatch({
      type: 'session.open',
      siteId: world.session.siteId,
      segmentIndex: world.session.segmentIndex,
      expeditionType: type,
      minutes: 25,
      at: new Date().toISOString(),
    })
    say('발행했어요. 큰 화면에서 오프닝이 시작돼요.')
    setStep(1)
  }

  return (
    <div className="flex flex-col gap-4">
      {/* 3단계 표시 */}
      <div className="flex items-center gap-3">
        {['템플릿 고르기', '미세조정', '발행'].map((label, i) => (
          <div key={label} className="flex items-center gap-3">
            <button
              onClick={() => setStep(i + 1)}
              className="squishy flex items-center gap-2 rounded-full px-4 py-2 text-[14px] font-bold"
              style={{
                background: step === i + 1 ? '#FFC9B5' : '#FFFFFF',
                border: `1.5px solid ${step === i + 1 ? '#C96B4A' : '#E8D9C8'}`,
                color: step === i + 1 ? '#C96B4A' : '#8C7A72',
              }}
            >
              <span className="font-display">{i + 1}</span>
              {label}
            </button>
            {i < 2 && <span style={{ color: '#D8D2CC' }}>—</span>}
          </div>
        ))}
      </div>

      {step === 1 && (
        <Card>
          <div className="flex flex-wrap gap-2">
            {subjects.map((s) => (
              <button
                key={s}
                onClick={() => setSubject(s)}
                className="squishy rounded-full px-4 py-1.5 text-[13px] font-bold"
                style={{
                  background: subject === s ? '#FFF0B3' : '#FFF6EC',
                  border: `1.5px solid ${subject === s ? '#B8933A' : '#E8D9C8'}`,
                  color: subject === s ? '#B8933A' : '#8C7A72',
                }}
              >
                {s}
              </button>
            ))}
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {filtered.map((t) => (
              <button
                key={t.key}
                onClick={() => {
                  setTplKey(t.key)
                  setTitle(t.title)
                  setType(t.type)
                  setStep(2)
                }}
                className="squishy rounded-[20px] px-4 py-4 text-left"
                style={{ background: tplKey === t.key ? '#FFC9B5' : '#FFF6EC', border: '1.5px solid #E8D9C8' }}
              >
                <div className="flex items-center gap-2" style={{ color: '#C96B4A' }}>
                  <ExpeditionIcon type={t.type} size={16} />
                  <span className="text-[12px] font-bold">{t.subject}</span>
                </div>
                <div className="mt-1 font-display text-[17px]">{t.title}</div>
                <div className="text-[12px]" style={{ color: '#8C7A72' }}>
                  {FIELD_BY_KEY[t.field].label}
                </div>
              </button>
            ))}
          </div>
        </Card>
      )}

      {step === 2 && (
        <Card>
          {/* 화면의 주인공 */}
          <label className="block text-[13px] font-bold" style={{ color: '#8C7A72' }}>
            활동명
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-2 w-full px-6 py-4 font-display text-[26px]"
            style={{ background: '#FFF6EC', border: '1.5px solid #E8D9C8' }}
          />

          <div className="mt-5 text-[13px] font-bold" style={{ color: '#8C7A72' }}>
            원정 유형
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {EXPEDITIONS.map((e) => (
              <button
                key={e.key}
                onClick={() => setType(e.key)}
                className="squishy flex flex-col items-center gap-1 rounded-[20px] px-4 py-3"
                style={{
                  background: type === e.key ? '#D9D2F5' : '#FFF6EC',
                  border: `1.5px solid ${type === e.key ? '#7A6BB5' : '#E8D9C8'}`,
                  color: type === e.key ? '#7A6BB5' : '#8C7A72',
                  minWidth: 92,
                }}
                title={e.visual}
              >
                <ExpeditionIcon type={e.key} size={22} />
                <span className="text-[13px] font-bold">{e.label}</span>
              </button>
            ))}
          </div>
          <div className="mt-2 text-[13px]" style={{ color: '#8C7A72' }}>
            {EXPEDITIONS.find((e) => e.key === type)?.visual}
          </div>

          {/* 나머지는 자동으로 채워진 채 접혀 있다 */}
          <button
            onClick={() => setDetailOpen((v) => !v)}
            className="squishy mt-5 rounded-full px-4 py-2 text-[13px] font-bold"
            style={{ background: '#FFF6EC', border: '1.5px solid #E8D9C8' }}
          >
            {detailOpen ? '자동으로 채운 것 접기' : '자동으로 채운 것 보기 (의뢰인 · 문구 · 보상 · 검증 · 만료)'}
          </button>
          {detailOpen && (
            <div className="anim-popin mt-3 grid gap-2 text-[14px] sm:grid-cols-2">
              <Row label="의뢰인" value={FIELD_BY_KEY[tpl.field].keeper} />
              <Row label="분야" value={FIELD_BY_KEY[tpl.field].label} />
              <Row label="보상" value="몽글 12" />
              <Row label="의뢰 만료" value="이틀 뒤" />
              <div className="rounded-[16px] px-4 py-3 sm:col-span-2" style={{ background: '#FFF6EC' }}>
                <div className="text-[12px]" style={{ color: '#8C7A72' }}>
                  체크 항목
                </div>
                <div className="mt-1">{tpl.checklist.join(' · ')}</div>
              </div>
            </div>
          )}

          <div className="mt-5">
            <PillButton tint="#FFC9B5" fg="#C96B4A" onClick={() => setStep(3)}>
              다음
            </PillButton>
          </div>
        </Card>
      )}

      {step === 3 && (
        <Card>
          {/* 예상 검증 부담 배지 */}
          <div className="flex flex-wrap items-center gap-3">
            <span
              className="rounded-full px-4 py-2 text-[14px] font-bold"
              style={{ background: '#FFF0B3', color: '#B8933A', border: '1.5px solid #B8933A' }}
            >
              검증 예상 {expected}건, 약 {minutes}분
            </span>
            <span className="text-[13px]" style={{ color: '#8C7A72' }}>
              {verification === 'gm' ? 'GM 인증' : '자동 인증'}으로 발행돼요
            </span>
          </div>

          {/* 제안 배너 — 경고 톤이 아니다 */}
          {verification === 'gm' && expected > 20 && (
            <div
              className="mt-4 flex flex-wrap items-center gap-3 rounded-[20px] px-5 py-4"
              style={{ background: '#C5EBDD', border: '1.5px solid #4A8B6F' }}
            >
              <span className="text-[15px]">자동 인증으로 바꿀까요? 오늘은 그래도 괜찮아 보여요.</span>
              <PillButton size="sm" tint="#FFF6EC" fg="#4A8B6F" line="#4A8B6F" onClick={() => setVerification('auto')}>
                자동 인증으로
              </PillButton>
            </div>
          )}

          <div className="mt-5 flex flex-wrap gap-3">
            <Toggle label="예약 발행" on={reserve} onClick={() => setReserve((v) => !v)} />
            <Toggle label="매주 반복" on={repeat} onClick={() => setRepeat((v) => !v)} />
            <Toggle
              label="GM이 직접 검증"
              on={verification === 'gm'}
              onClick={() => setVerification((v) => (v === 'gm' ? 'auto' : 'gm'))}
            />
          </div>

          <div className="mt-6 rounded-[20px] px-5 py-4" style={{ background: '#FFF6EC', border: '1.5px solid #E8D9C8' }}>
            <div className="font-display text-[19px]">{title}</div>
            <div className="mt-1 text-[14px]" style={{ color: '#8C7A72' }}>
              {EXPEDITIONS.find((e) => e.key === type)?.label} · {FIELD_BY_KEY[tpl.field].label} ·{' '}
              {world.halls[0]?.name}
            </div>
          </div>

          <div className="mt-5">
            <PillButton tint="#C96B4A" fg="#FFF6EC" size="lg" onClick={publish}>
              {reserve ? '예약해 두기' : '지금 발행하고 원정 시작'}
            </PillButton>
          </div>
        </Card>
      )}
    </div>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-[20px] px-6 py-6" style={{ background: '#FFFFFF', border: '1.5px solid #E8D9C8' }}>
      {children}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[16px] px-4 py-3" style={{ background: '#FFF6EC' }}>
      <div className="text-[12px]" style={{ color: '#8C7A72' }}>
        {label}
      </div>
      <div className="mt-0.5">{value}</div>
    </div>
  )
}

function Toggle({ label, on, onClick }: { label: string; on: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="squishy flex items-center gap-2 rounded-full px-4 py-2 text-[14px] font-bold"
      style={{ background: on ? '#C5EBDD' : '#FFF6EC', border: `1.5px solid ${on ? '#4A8B6F' : '#E8D9C8'}`, color: on ? '#4A8B6F' : '#8C7A72' }}
    >
      <span
        className="inline-block rounded-full"
        style={{ width: 10, height: 10, background: on ? '#4A8B6F' : '#D8D2CC' }}
      />
      {label}
    </button>
  )
}
