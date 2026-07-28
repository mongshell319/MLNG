'use client'

import { useState } from 'react'
import { Mallang } from '@/components/mallang/Mallang'
import { Keeper } from '@/components/mallang/Keeper'
import { EnvelopeIcon, KindIcon } from '@/components/ui/Icons'
import { PillButton, Ribbon } from '@/components/ui/primitives'
import { useWorld } from '@/lib/client/world'
import { photoSrc, uploadPhoto } from '@/lib/client/photo'
import { EXPEDITION_BY_KEY, FIELD_BY_KEY, QUEST_KIND } from '@/lib/domain/master'
import type { Mallang as MallangType, Quest, QuestProgress, WorldSnapshot } from '@/lib/domain/types'

/**
 * S3 — 게시판. 나무 게시판 메타포.
 *
 * 카드 상태 4종: 수락 전 → 진행 중 → 전달 중 → 해결(도장).
 * 이월된 미완료 의뢰는 '아직 안 깬 의뢰' 리본을 달고 재도전 버튼이 상시 노출된다 —
 * 회색 비활성으로 두거나 지난 것으로 밀어내지 않는다 (§3-3).
 */

export function Board({ world, me }: { world: WorldSnapshot; me: MallangType }) {
  const [hall, setHall] = useState(world.halls[0]?.id ?? 'hall-1')
  const quests = world.quests.filter((q) => q.hallId === hall)
  const main = quests.filter((q) => q.kind === 'main')
  const sides = quests.filter((q) => q.kind === 'side')
  const guild = quests.find((q) => q.kind === 'guild')
  const flash = quests.find((q) => q.kind === 'flash')

  const site = world.sites.find((s) => s.id === world.session.siteId)
  const seg = site?.segments[world.session.segmentIndex]

  return (
    <div className="mx-auto w-full max-w-[1180px] px-5 pb-6 pt-4">
      {/* 상회 탭 */}
      <div className="flex flex-wrap gap-2">
        {world.halls.map((h) => (
          <button
            key={h.id}
            onClick={() => setHall(h.id)}
            className="squishy rounded-full px-5 py-2 text-[14px] font-bold"
            style={{
              background: hall === h.id ? '#FFF0B3' : '#FFFFFF',
              border: `1.5px solid ${hall === h.id ? '#B8933A' : '#E8D9C8'}`,
              color: hall === h.id ? '#B8933A' : '#8C7A72',
            }}
          >
            {h.name}
          </button>
        ))}
      </div>

      <div
        className="mt-4 rounded-[20px] p-5"
        style={{ background: 'linear-gradient(#F3E3CC, #EAD9C2)', border: '1.5px solid #C96B4A' }}
      >
        {/* min-w-0 이 없으면 그리드 칸이 내용 폭 아래로 줄지 않아 폰에서 화면을 밀어낸다 */}
        <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
          {/* 중앙 · 오늘의 의뢰 */}
          <div className="flex min-w-0 flex-col gap-4">
            {main.length === 0 && <EmptyDay />}
            {main.map((q) => (
              <QuestCard key={q.id} quest={q} world={world} me={me} big />
            ))}
            {guild && <QuestCard quest={guild} world={world} me={me} />}
            <FlashSlot quest={flash} world={world} me={me} />
          </div>

          {/* 우측 · 사이드 쪽지와 원정 일정 */}
          <div className="flex min-w-0 flex-col gap-4">
            <div className="text-[13px] font-bold" style={{ color: '#8C7A72' }}>
              골라서 해도 되는 것
            </div>
            {sides.map((q, i) => (
              <div key={q.id} style={{ transform: `rotate(${i % 2 ? 1.2 : -1.4}deg)` }}>
                <QuestCard quest={q} world={world} me={me} />
              </div>
            ))}

            {/* 원정 일정 — 시간표 형태 금지, 내일 것까지만 */}
            <div className="rounded-[20px] px-5 py-4" style={{ background: '#FFF6EC', border: '1.5px solid #E8D9C8' }}>
              <div className="font-display text-[16px]">원정 일정</div>
              <p className="mt-2 text-[15px] leading-relaxed">
                오늘 낮, {site?.name} {seg?.name}(으)로 향합니다.
              </p>
              <p className="mt-1 text-[15px] leading-relaxed" style={{ color: '#8C7A72' }}>
                내일은 {EXPEDITION_BY_KEY[world.session.expeditionType].label} 쪽으로 한 번 더 간다고 해요.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function EmptyDay() {
  return (
    <div className="flex items-center gap-4 rounded-[20px] px-6 py-7" style={{ background: '#FFF6EC', border: '1.5px solid #E8D9C8' }}>
      <Keeper field="making" size={80} face="sleepy" />
      <div>
        <div className="font-display text-[18px]">오늘은 새로 온 게 없어요</div>
        <p className="mt-1 text-[14px]" style={{ color: '#8C7A72' }}>
          뚝딱말랑이 조용히 정리하는 중이에요. 아직 안 깬 의뢰를 다시 해도 좋아요.
        </p>
      </div>
    </div>
  )
}

function FlashSlot({ quest, world, me }: { quest?: Quest; world: WorldSnapshot; me: MallangType }) {
  if (quest) return <QuestCard quest={quest} world={world} me={me} />
  return (
    <div
      className="flex items-center gap-4 rounded-[20px] px-6 py-5"
      style={{ background: QUEST_KIND.flash.tint, border: `1.5px solid ${QUEST_KIND.flash.deep}` }}
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-full" style={{ background: '#FFF6EC', color: QUEST_KIND.flash.deep }}>
        <KindIcon kind="flash" size={20} />
      </div>
      <div>
        <div className="font-display text-[16px]" style={{ color: QUEST_KIND.flash.deep }}>
          돌발 의뢰 자리
        </div>
        <div className="text-[13px]" style={{ color: '#8C7A72' }}>
          가끔 갑자기 붙어요. 오늘은 아직 비어 있어요.
        </div>
      </div>
    </div>
  )
}

export function QuestCard({
  quest,
  world,
  me,
  big = false,
}: {
  quest: Quest
  world: WorldSnapshot
  me: MallangType
  big?: boolean
}) {
  const { dispatch, say } = useWorld()
  const [open, setOpen] = useState(big)
  const [busy, setBusy] = useState(false)
  const kind = QUEST_KIND[quest.kind]
  const field = FIELD_BY_KEY[quest.client]
  const p: QuestProgress | undefined = world.progress.find((x) => x.questId === quest.id && x.mallangId === me.id)
  const status = p?.status ?? 'open'
  const checks = p?.checks ?? [false, false, false]

  const at = () => new Date().toISOString()
  const setCheck = (i: 0 | 1 | 2) =>
    dispatch({ type: 'quest.check', questId: quest.id, mallangId: me.id, index: i, value: !checks[i], at: at() })

  // 사진은 Storage로 가고 상태에는 경로만 실린다. 경로는 서버가 정한다.
  const attach = async (file: File | undefined) => {
    if (!file) return
    setBusy(true)
    const result = await uploadPhoto(file, quest.id)
    setBusy(false)
    if (!result.ok) say(result.error ?? '사진을 올리지 못했어요')
  }

  const deliverReason = !p?.photoUrl
    ? '사진을 첨부해주세요'
    : !checks.every(Boolean)
      ? '체크 항목이 조금 남았어요'
      : undefined

  return (
    <div className="relative rounded-[20px] px-6 py-5" style={{ background: kind.tint, border: `1.5px solid ${kind.deep}` }}>
      {status === 'solved' && (
        <div
          className="anim-stampin pointer-events-none absolute right-5 top-4 rounded-[14px] px-4 py-2 font-display text-[22px]"
          style={{ color: '#C96B4A', border: '3px solid #C96B4A' }}
        >
          해결!
        </div>
      )}

      <div className="flex items-center gap-2" style={{ color: kind.deep }}>
        <KindIcon kind={quest.kind} size={16} />
        <span className="text-[13px] font-bold">{kind.label}</span>
        {quest.carriedOver && status !== 'solved' && (
          <span className="ml-1">
            <Ribbon />
          </span>
        )}
      </div>

      <button onClick={() => setOpen((v) => !v)} className="mt-2 block w-full text-left">
        <div className="font-display" style={{ fontSize: big ? 26 : 19 }}>
          {quest.title}
        </div>
      </button>

      {open && (
        <>
          <div className="mt-3 flex items-start gap-4">
            <Keeper field={quest.client} size={big ? 92 : 66} />
            <div className="flex-1 text-[15px] leading-relaxed">
              <p>{quest.story.situation}</p>
              <p className="mt-1">{quest.story.request}</p>
              <p className="mt-1" style={{ color: kind.deep }}>
                {quest.story.promise}
              </p>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-[13px]" style={{ color: kind.deep }}>
            <span className="rounded-full px-3 py-1" style={{ background: '#FFF6EC' }}>
              몽글 {quest.reward.mongle}
            </span>
            <span className="rounded-full px-3 py-1" style={{ background: '#FFF6EC' }}>
              {field.label}
            </span>
            {quest.expiresAt && (
              <span className="rounded-full px-3 py-1" style={{ background: '#FFF6EC' }}>
                의뢰 만료 {new Date(quest.expiresAt).getMonth() + 1}/{new Date(quest.expiresAt).getDate()}
              </span>
            )}
          </div>

          {/* 상태별 */}
          {status === 'open' && (
            <div className="mt-4">
              <PillButton
                tint="#FFF6EC"
                fg={kind.deep}
                line={kind.deep}
                onClick={() => dispatch({ type: 'quest.accept', questId: quest.id, mallangId: me.id, at: at() })}
              >
                {quest.carriedOver ? '여기서 다시 시작하기' : '수락하기'}
              </PillButton>
            </div>
          )}

          {status === 'doing' && (
            <div className="mt-4 rounded-[16px] px-4 py-4" style={{ background: '#FFF6EC' }}>
              {p?.reply && (
                <div className="mb-3 text-[14px]" style={{ color: '#8C7A72' }}>
                  {p.reply}
                </div>
              )}
              <div className="flex flex-col gap-2">
                {quest.checklist.map((c, i) => (
                  <button
                    key={c}
                    onClick={() => setCheck(i as 0 | 1 | 2)}
                    className="squishy flex items-start gap-3 rounded-[18px] px-4 py-2 text-left text-[14px]"
                    style={{ background: checks[i] ? kind.tint : '#FFFFFF', border: '1.5px solid #E8D9C8' }}
                  >
                    <span
                      className="flex h-5 w-5 items-center justify-center rounded-full text-[12px]"
                      style={{ background: checks[i] ? kind.deep : '#EFEAE2', color: '#FFF6EC' }}
                    >
                      {checks[i] ? '✓' : ''}
                    </span>
                    {c}
                  </button>
                ))}
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-3">
                <label
                  className="squishy inline-block rounded-[16px] px-4 py-3 text-[14px] font-bold"
                  style={{ background: p?.photoUrl ? kind.tint : '#FFFFFF', border: '1.5px solid #E8D9C8', cursor: 'pointer' }}
                >
                  {busy ? '올리는 중…' : p?.photoUrl ? '사진 다시 고르기' : '사진 첨부하기'}
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => void attach(e.target.files?.[0])}
                  />
                </label>
                {p?.photoUrl && (
                  <div
                    className="rounded-[12px]"
                    style={{
                      width: 64,
                      height: 48,
                      border: '1.5px solid #E8D9C8',
                      background: `center/cover url(${photoSrc(p.photoUrl)})`,
                    }}
                  />
                )}
                <PillButton
                  tint={kind.deep}
                  fg="#FFF6EC"
                  reason={deliverReason}
                  onClick={() => dispatch({ type: 'quest.deliver', questId: quest.id, mallangId: me.id, at: at() })}
                >
                  전달하기
                </PillButton>
              </div>
            </div>
          )}

          {status === 'delivering' && (
            <div className="mt-4 flex items-center gap-3 rounded-[16px] px-4 py-4" style={{ background: '#FFF6EC' }}>
              <Mallang size={54} face="sleepy" color={me.bodyColor} className="anim-floaty" />
              <div className="text-[15px]">전달 중이에요. 곧 답이 올 거예요.</div>
            </div>
          )}

          {status === 'solved' && p?.reply && (
            <div className="mt-4 flex items-start gap-3 rounded-[16px] px-4 py-4" style={{ background: '#FFF6EC' }}>
              <span style={{ color: kind.deep }}>
                <EnvelopeIcon size={20} />
              </span>
              <div className="text-[15px] leading-relaxed">
                <b style={{ color: kind.deep }}>{field.keeper}</b>
                <div>{p.reply}</div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
