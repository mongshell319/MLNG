'use client'

import { Mallang } from '@/components/mallang/Mallang'
import { HeartIcon, SparkIcon } from '@/components/ui/Icons'
import { FIELD_BY_KEY } from '@/lib/domain/master'
import type { SettleStage } from '@/lib/domain/phase'
import type { WorldSnapshot } from '@/lib/domain/types'
import { Panorama } from './Panorama'

/**
 * C1 상태 5 — 정산 시퀀스.
 *
 * 카운트다운 → 반 전체 총량 → 귀환 보고 → 스포트라이트 → 뱃지 집계 →
 * 마을 성장 → 마무리(촬영·내보내기용 정지 화면).
 *
 * 표시되는 숫자는 전부 반 전체의 것이다. 개인의 XP·칭찬 개수·레벨은 어디에도 없고
 * 하트는 개수 없이 떠오르기만 한다 (§3-1).
 */

export function Settle({
  world,
  stage,
  inStage,
  stageLength,
  now,
}: {
  world: WorldSnapshot
  stage: SettleStage
  inStage: number
  stageLength: number
  now: number
}) {
  switch (stage) {
    case 'countdown':
      return <Countdown inStage={inStage} stageLength={stageLength} />
    case 'total':
      return <TotalHaul world={world} />
    case 'return':
      return <ReturnReport world={world} />
    case 'spotlight':
      return <Spotlight world={world} inStage={inStage} />
    case 'badgesum':
      return <BadgeSummary world={world} />
    case 'growth':
      return <Growth world={world} now={now} />
    case 'wrap':
      return <Wrap world={world} now={now} />
  }
}

function Countdown({ inStage, stageLength }: { inStage: number; stageLength: number }) {
  const n = Math.max(1, Math.ceil(stageLength - inStage))
  return (
    <div className="absolute inset-0 flex items-center justify-center" style={{ background: '#FFF6EC' }}>
      <div
        key={n}
        className="flex items-center justify-center rounded-full"
        style={{
          width: 320,
          height: 320,
          background: '#FFC9B5',
          border: '3px solid #C96B4A',
          animation: 'squish 500ms var(--ease-mallang)',
        }}
      >
        <span className="font-display" style={{ fontSize: 110, color: '#C96B4A' }}>
          {n}
        </span>
      </div>
    </div>
  )
}

function TotalHaul({ world }: { world: WorldSnapshot }) {
  const delivered = world.progress.filter((p) => p.status === 'solved').length
  const found = world.discoveries.length
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-10" style={{ background: '#FFF6EC' }}>
      <div className="font-display" style={{ fontSize: 52 }}>
        오늘 우리 마을이 가져온 것
      </div>
      <div className="flex items-center gap-12">
        <HaulCard label="전달" value={delivered} tint="#FFC9B5" deep="#C96B4A" />
        <HaulCard label="발견물" value={found} tint="#C5EBDD" deep="#4A8B6F" />
        <HaulCard label="몽글" value={world.village.mongle} tint="#FFF0B3" deep="#B8933A" />
      </div>
      <div className="flex items-end gap-6">
        {world.mallangs.slice(0, 7).map((m, i) => (
          <Mallang
            key={m.id}
            color={m.bodyColor}
            face={i % 2 ? 'star' : 'glad'}
            size={140}
            form={m.evolutionForm}
            className="anim-floaty"
            style={{ animationDelay: `${i * 0.14}s` }}
          />
        ))}
      </div>
    </div>
  )
}

function HaulCard({ label, value, tint, deep }: { label: string; value: number; tint: string; deep: string }) {
  return (
    <div className="anim-popin rounded-[24px] px-14 py-8 text-center" style={{ background: tint, border: `3px solid ${deep}` }}>
      <div style={{ fontSize: 32, color: deep }}>{label}</div>
      <div className="font-display" style={{ fontSize: 86, color: deep }}>
        {value}
      </div>
    </div>
  )
}

function ReturnReport({ world }: { world: WorldSnapshot }) {
  const site = world.sites.find((s) => s.id === world.session.siteId)
  const seg = site?.segments[world.session.segmentIndex]
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-12" style={{ background: '#FFF6EC' }}>
      <div className="font-display" style={{ fontSize: 52 }}>
        귀환 보고
      </div>
      <div className="w-[1200px]">
        <div className="mb-4 flex items-end justify-between">
          <span className="font-display" style={{ fontSize: 40 }}>
            {site?.name} · {seg?.name}
          </span>
          <span style={{ fontSize: 32, color: '#8C7A72' }}>구간이 이만큼 열렸어요</span>
        </div>
        <div className="overflow-hidden rounded-full" style={{ height: 42, background: '#FFFFFF', border: '3px solid #7A6BB5' }}>
          <div
            className="h-full rounded-full"
            style={{ width: `${world.session.prog}%`, background: '#D9D2F5', transition: 'width 1.4s ease-out' }}
          />
        </div>
      </div>
      <div className="flex gap-8">
        {world.discoveries.slice(-3).map((d, i) => (
          <div
            key={d.id}
            className="anim-popin rounded-[24px] px-12 py-8 text-center"
            style={{ background: '#FFFFFF', border: '3px solid #E8D9C8', animationDelay: `${i * 260}ms` }}
          >
            <div style={{ fontSize: 30, color: '#8C7A72' }}>발견물</div>
            <div className="font-display" style={{ fontSize: 40 }}>
              {d.name}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/** 카드 3–5장을 동시에 공개한다. 하트는 숫자 없이 떠오른다. */
function Spotlight({ world, inStage }: { world: WorldSnapshot; inStage: number }) {
  const cards = world.session.spotlight
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: '#FFF6EC' }}>
      <div className="pt-[70px] text-center font-display" style={{ fontSize: 52 }}>
        오늘의 이야기
      </div>
      <div className="mt-12 flex flex-wrap items-start justify-center gap-8 px-16">
        {cards.map((c) => {
          const field = FIELD_BY_KEY[c.field]
          return (
            <div
              key={c.mallangId}
              className="anim-popin rounded-[24px] px-10 py-9 text-center"
              style={{ width: 330, background: field.tint, border: `3px solid ${field.deep}` }}
            >
              <Mallang color={c.bodyColor} face="glad" size={170} form={c.form} />
              <div className="mt-2 font-display" style={{ fontSize: 42 }}>
                {c.name}
              </div>
              <div className="mt-2 inline-flex items-center gap-2 rounded-full px-5 py-2" style={{ background: '#FFF6EC', color: field.deep }}>
                <SparkIcon size={26} />
                <span style={{ fontSize: 30 }}>{field.label}</span>
              </div>
              <p className="mt-4" style={{ fontSize: 32, lineHeight: 1.4 }}>
                {c.reason}
              </p>
            </div>
          )
        })}
      </div>

      {/* 하트 — 개수 없이 떠오르는 연출로만 */}
      {world.session.hearts.map((h, i) => (
        <div
          key={`${h.id}-${i}`}
          className="anim-riseup absolute bottom-[120px]"
          style={{ left: h.left, color: '#FFB3C6', animationDelay: `${(i * 0.3) % 2}s` }}
        >
          <HeartIcon size={h.size + 24} strokeWidth={2.4} />
        </div>
      ))}

      {inStage > 3 && (
        <div className="absolute bottom-[44px] left-1/2 -translate-x-1/2" style={{ fontSize: 30, color: '#8C7A72' }}>
          하트는 각자의 화면에서 보낼 수 있어요
        </div>
      )}
    </div>
  )
}

/** 인원만 표시한다. 누가 무엇을 몇 개 받았는지는 어디에도 없다. */
function BadgeSummary({ world }: { world: WorldSnapshot }) {
  const newBadges = world.praises.filter((p) => p.source === 'gm').length
  const evolved = world.mallangs.filter((m) => m.evolutionForm !== 'base').length
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-10" style={{ background: '#FFF6EC' }}>
      <div className="font-display" style={{ fontSize: 52 }}>
        오늘의 집계
      </div>
      <div className="anim-popin flex items-center gap-8 rounded-[24px] px-20 py-12" style={{ background: '#FFF0B3', border: '3px solid #B8933A' }}>
        <span className="font-display" style={{ fontSize: 48, color: '#B8933A' }}>
          새 뱃지 {newBadges}개
        </span>
        <span style={{ fontSize: 40, color: '#B8933A' }}>·</span>
        <span className="font-display" style={{ fontSize: 48, color: '#B8933A' }}>
          반짝 진화 {evolved}명
        </span>
      </div>
      <div className="flex gap-5">
        {world.mallangs.slice(0, 9).map((m, i) => (
          <Mallang key={m.id} color={m.bodyColor} size={96} face="glad" form={m.evolutionForm} className="anim-floaty" style={{ animationDelay: `${i * 0.1}s` }} />
        ))}
      </div>
    </div>
  )
}

/** 발견물·자원이 마을로 옮겨지고 건물이 자란다. */
function Growth({ world, now }: { world: WorldSnapshot; now: number }) {
  return (
    <div className="absolute inset-0">
      <Panorama world={world} now={now} growing />
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="anim-flyres absolute"
          style={{ left: 420 + i * 220, bottom: 200, animationDelay: `${i * 0.22}s`, color: '#B8933A' }}
        >
          <SparkIcon size={64} />
        </div>
      ))}
      <div
        className="absolute left-1/2 top-[60px] -translate-x-1/2 rounded-[24px] px-14 py-6"
        style={{ background: '#FFF6EC', border: '3px solid #E8D9C8' }}
      >
        <span className="font-display" style={{ fontSize: 48 }}>
          마을이 자랐어요
        </span>
      </div>
    </div>
  )
}

/** 촬영·내보내기용 정지 화면. */
function Wrap({ world, now }: { world: WorldSnapshot; now: number }) {
  const site = world.sites.find((s) => s.id === world.session.siteId)
  const seg = site?.segments[world.session.segmentIndex]
  const delivered = world.progress.filter((p) => p.status === 'solved').length
  return (
    <div className="absolute inset-0">
      <Panorama world={world} now={now} />
      <div
        className="absolute left-1/2 top-[70px] -translate-x-1/2 rounded-[24px] px-16 py-8 text-center"
        style={{ background: 'rgba(255,246,236,.94)', border: '3px solid #E8D9C8' }}
      >
        <div className="font-display" style={{ fontSize: 56 }}>
          {world.village.name} · 오늘의 기록
        </div>
        <div className="mt-3" style={{ fontSize: 34, color: '#8C7A72' }}>
          {site?.name} {seg?.name} · 전달 {delivered} · 시즌 {world.village.season}
        </div>
      </div>
    </div>
  )
}
