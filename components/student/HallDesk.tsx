'use client'

import { useState } from 'react'
import { Keeper } from '@/components/mallang/Keeper'
import { KEEPER_CHATS } from '@/lib/domain/master'
import type { Mallang as MallangType, WorldSnapshot } from '@/lib/domain/types'
import { QuestCard } from './Board'

/**
 * S4 — 상회.
 * 접수대와 터줏말랑, 오늘 접수 중인 의뢰, 이 상회의 원정 일정(내일까지),
 * 그리고 같은 마을의 다른 상회 안내.
 */
export function HallDesk({ world, me }: { world: WorldSnapshot; me: MallangType }) {
  const hall = world.halls[0]
  const [chat, setChat] = useState(KEEPER_CHATS[0])
  const quests = world.quests.filter((q) => q.hallId === hall?.id && q.kind !== 'guild')
  const site = world.sites.find((s) => s.id === world.session.siteId)

  return (
    <div className="mx-auto w-full max-w-[1000px] px-5 pb-6 pt-4">
      {/* 접수대 */}
      <div className="rounded-[20px] px-6 py-6" style={{ background: '#FFC9B5', border: '1.5px solid #C96B4A' }}>
        <div className="flex items-end gap-5">
          <button
            className="squishy"
            onClick={() => setChat(KEEPER_CHATS[Math.floor(Math.random() * KEEPER_CHATS.length)])}
            aria-label="뚝딱말랑에게 말 걸기"
          >
            <Keeper field="making" size={110} className="anim-floaty" />
          </button>
          <div className="mb-3 flex-1 rounded-[20px] px-5 py-4" style={{ background: '#FFF6EC', border: '1.5px solid #E8D9C8' }}>
            <div className="font-display text-[16px]">뚝딱말랑</div>
            <p className="mt-1 text-[15px] leading-relaxed">{chat}</p>
          </div>
        </div>
        <div className="mt-5 h-3 rounded-full" style={{ background: '#EAD9C2', border: '1.5px solid #C96B4A' }} />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="flex flex-col gap-4">
          <div className="font-display text-[17px]">오늘 접수 중인 것</div>
          {quests.map((q) => (
            <QuestCard key={q.id} quest={q} world={world} me={me} />
          ))}
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-[20px] px-5 py-4" style={{ background: '#FFF6EC', border: '1.5px solid #E8D9C8' }}>
            <div className="font-display text-[16px]">이 상회의 원정 일정</div>
            <p className="mt-2 text-[15px]">오늘 낮, {site?.name}(으)로 향합니다.</p>
            <p className="mt-1 text-[15px]" style={{ color: '#8C7A72' }}>
              내일도 같은 쪽으로 한 번 더 간다고 해요.
            </p>
          </div>

          <div className="rounded-[20px] px-5 py-4" style={{ background: '#FFFFFF', border: '1.5px solid #E8D9C8' }}>
            <div className="font-display text-[16px]">같은 마을의 다른 상회</div>
            <div className="mt-3 flex flex-col gap-2">
              {world.halls.slice(1).map((h) => (
                <div key={h.id} className="rounded-[16px] px-4 py-3 text-[14px]" style={{ background: '#FFF6EC' }}>
                  <b>{h.name}</b>
                  <span style={{ color: '#8C7A72' }}> · 여기도 가끔 의뢰가 붙어요</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
