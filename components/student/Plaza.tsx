'use client'

import { useEffect, useMemo, useState } from 'react'
import { Mallang } from '@/components/mallang/Mallang'
import { Keeper } from '@/components/mallang/Keeper'
import { LockIcon } from '@/components/ui/Icons'
import { LockedChip, NewDot } from '@/components/ui/primitives'
import { KEEPER_CHATS, STROLL_ACTIONS, VILLAGE_NEWS } from '@/lib/domain/master'
import type { Mallang as MallangType, Place, WorldSnapshot } from '@/lib/domain/types'

/**
 * S2 — 마을 광장 (학생 홈).
 *
 * 접속하면 여기 도착한다. 학교·수업 관련 단어가 하나도 없어야 한다는 규칙이
 * 가장 엄격하게 적용되는 화면이다. 상단 탭바 없음, 하단에 지도 버튼 하나만.
 *
 * 레이어 주의 (handoff §S2 구현 주의):
 *   건물 버튼 레이어 z-5 / 캐릭터 아트 레이어 z-2 + pointer-events:none.
 *   배치된 캐릭터 SVG가 건물 라벨의 히트 영역을 덮는 문제가 반복됐다.
 */

/**
 * 좁은 화면인가.
 *
 * 광장은 태블릿 가로를 기준으로 자리를 잡아 둔 씬이다. 폰 세로(390)에서는 그 좌표로는
 * 건물이 서로 겹치고 왼쪽으로 잘려 나간다 — 핸드오프가 폰을 보조 해상도로 명시했으므로
 * 그때는 씬 대신 흐름 배치로 바꾼다. 읽는 순서(뉴스 → 갈 곳 → 산책)는 그대로다.
 */
function useNarrow(): boolean {
  const [narrow, setNarrow] = useState(false)
  useEffect(() => {
    const q = window.matchMedia('(max-width: 640px)')
    const apply = () => setNarrow(q.matches)
    apply()
    q.addEventListener('change', apply)
    return () => q.removeEventListener('change', apply)
  }, [])
  return narrow
}

/** 벽보(상단 중앙)와 겹치지 않도록 건물은 그 아래 두 줄로 앉힌다. */
const SPOTS: { place: Place; label: string; hint: string; left: string; top: string; tint: string; deep: string }[] = [
  { place: 'board', label: '마을 게시판', hint: '오늘 온 것들', left: '12%', top: '38%', tint: '#F3E3CC', deep: '#C96B4A' },
  { place: 'hall', label: '기가 공작소', hint: '뚝딱말랑의 일터', left: '34%', top: '32%', tint: '#FFC9B5', deep: '#C96B4A' },
  { place: 'shop', label: '가게', hint: '간식과 꾸미기', left: '58%', top: '34%', tint: '#FFD6E5', deep: '#C96B4A' },
  { place: 'room', label: '내 방', hint: '내 물건들', left: '80%', top: '40%', tint: '#D9D2F5', deep: '#7A6BB5' },
  { place: 'spring', label: '되돌림의 샘', hint: '조용한 물가', left: '20%', top: '68%', tint: '#BFE3EF', deep: '#4A8B6F' },
  { place: 'lake', label: '호숫가로 가는 길', hint: '느긋한 쪽', left: '72%', top: '70%', tint: '#C5EBDD', deep: '#4A8B6F' },
]

export function Plaza({ world, me, go }: { world: WorldSnapshot; me: MallangType; go: (p: Place) => void }) {
  const [chat, setChat] = useState('')
  const [strolled, setStrolled] = useState('')
  const narrow = useNarrow()

  const news = useMemo(() => VILLAGE_NEWS[(world.version + world.village.guildProgress) % VILLAGE_NEWS.length], [world])
  const delivered = world.progress.some((p) => p.mallangId === me.id && p.status === 'solved')

  // 전달 완료자만 개방일 때, 아직 전달 전이면 몇 곳이 잠긴다. 회색 비활성이 아니라 자물쇠로.
  const restricted = world.session.freeTime === 'delivered' && !delivered
  const isLocked = (p: Place) => restricted && (p === 'shop' || p === 'lake' || p === 'spring')

  const neighbours = world.mallangs.filter((m) => m.id !== me.id).slice(0, 4)

  // ── 폰 세로: 흐름 배치 ──────────────────────────────
  if (narrow) {
    return (
      <div className="flex min-h-[calc(100svh-108px)] flex-col">
        <div
          className="px-4 pt-4"
          style={{ background: 'linear-gradient(#D9F0F7 0%, #FFF6EC 70%, #FFF6EC 100%)' }}
        >
          <NewsBoard news={news} chat={chat} setChat={setChat} />

          {restricted && (
            <div className="mt-3 flex justify-center">
              <LockedChip label="몇 곳은 아직" note="전달하고 오면 열려요" />
            </div>
          )}

          <div className="mt-4 grid grid-cols-2 gap-3">
            {SPOTS.map((s) => {
              const locked = isLocked(s.place)
              return (
                <button
                  key={s.place}
                  onClick={() => !locked && go(s.place)}
                  className="squishy flex flex-col items-center rounded-[20px] px-3 pb-3 pt-2 text-center"
                  style={{
                    background: locked ? '#EFEAE2' : s.tint,
                    border: `1.5px solid ${locked ? '#D8D2CC' : s.deep}`,
                  }}
                >
                  <Hut tint={locked ? '#EFEAE2' : s.tint} deep={locked ? '#D8D2CC' : s.deep} width={92} />
                  <div className="mt-1 flex items-center gap-1.5">
                    {locked && (
                      <span style={{ color: '#8C7A72' }}>
                        <LockIcon size={12} />
                      </span>
                    )}
                    <span className="font-display text-[15px]" style={{ color: locked ? '#8C7A72' : '#6E5A54' }}>
                      {s.label}
                    </span>
                    {s.place === 'room' && world.letters.some((l) => l.mallangId === me.id && !l.read) && <NewDot />}
                  </div>
                  <div className="text-[11px]" style={{ color: locked ? '#B8A99E' : s.deep }}>
                    {locked ? '쉬는 시간에 열려요' : s.hint}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* 내 말랑이와 지나다니는 친구들 */}
        <div
          className="mt-3 flex items-end justify-center gap-1 overflow-hidden px-2 pb-2"
          style={{ background: 'linear-gradient(#FFF6EC 0%, #CFE0D4 40%, #A9C4B2 100%)', minHeight: 120 }}
        >
          <Mallang color={me.bodyColor} size={92} face="glad" form={me.evolutionForm} accessory={me.wearing} className="anim-floaty" />
          {neighbours.slice(0, 3).map((m, i) => (
            <Mallang
              key={m.id}
              color={m.bodyColor}
              size={62}
              face={i % 2 ? 'base' : 'glad'}
              form={m.evolutionForm}
              accessory={m.wearing}
              className="anim-floaty"
              style={{ animationDelay: `${i * 0.7}s`, opacity: 0.9 }}
            />
          ))}
        </div>

        <StrollBar strolled={strolled} setStrolled={setStrolled} />
      </div>
    )
  }

  // ── 태블릿 가로: 씬 배치 ────────────────────────────
  return (
    <div className="relative flex min-h-[calc(100svh-108px)] flex-col">
      {/* 씬 */}
      <div
        className="relative flex-1 overflow-hidden"
        style={{ background: 'linear-gradient(#D9F0F7 0%, #FFF6EC 58%, #CFE0D4 58%, #A9C4B2 100%)', minHeight: 560 }}
      >
        {/* 캐릭터·건물 아트 레이어 — 절대 히트 영역을 먹지 않는다 */}
        <div className="pointer-events-none absolute inset-0 z-[2]">
          {/* 버튼 뒤에 건물이 서 있어야 메뉴가 아니라 장소로 읽힌다 */}
          {SPOTS.map((s) => (
            <div key={s.place} className="absolute -translate-x-1/2" style={{ left: s.left, top: `calc(${s.top} - 74px)` }}>
              <Hut tint={s.tint} deep={s.deep} />
            </div>
          ))}
          <div className="anim-floaty absolute" style={{ left: '46%', bottom: '8%' }}>
            <Mallang color={me.bodyColor} size={130} face="glad" form={me.evolutionForm} accessory={me.wearing} />
          </div>
          {neighbours.map((m, i) => (
            <div
              key={m.id}
              className="anim-floaty absolute"
              style={{ left: `${16 + i * 19}%`, bottom: `${4 + (i % 2) * 7}%`, animationDelay: `${i * 0.7}s`, opacity: 0.9 }}
            >
              <Mallang color={m.bodyColor} size={82} face={i % 2 ? 'base' : 'glad'} form={m.evolutionForm} accessory={m.wearing} />
            </div>
          ))}
        </div>

        {/* 건물 버튼 레이어 */}
        <div className="absolute inset-0 z-[5]">
          {SPOTS.map((s) => {
            const locked = isLocked(s.place)
            return (
              <button
                key={s.place}
                onClick={() => !locked && go(s.place)}
                className="squishy absolute -translate-x-1/2 rounded-[20px] px-5 py-3 text-left"
                style={{
                  left: s.left,
                  top: s.top,
                  background: locked ? '#EFEAE2' : s.tint,
                  border: `1.5px solid ${locked ? '#D8D2CC' : s.deep}`,
                  minWidth: 132,
                }}
              >
                <div className="flex items-center gap-2">
                  {locked && (
                    <span style={{ color: '#8C7A72' }}>
                      <LockIcon size={13} />
                    </span>
                  )}
                  <span className="font-display text-[17px]" style={{ color: locked ? '#8C7A72' : '#6E5A54' }}>
                    {s.label}
                  </span>
                  {s.place === 'room' && world.letters.some((l) => l.mallangId === me.id && !l.read) && <NewDot />}
                </div>
                <div className="text-[12px]" style={{ color: locked ? '#B8A99E' : s.deep }}>
                  {locked ? '쉬는 시간에 열려요' : s.hint}
                </div>
              </button>
            )
          })}

          {/* 마을 뉴스 벽보 — 폰으로 들어왔을 때 가장 먼저 읽히는 것 */}
          <div className="absolute left-1/2 top-[4%] w-[min(560px,88%)] -translate-x-1/2">
            <NewsBoard news={news} chat={chat} setChat={setChat} />
          </div>
        </div>
      </div>

      {/* 씬 밖 하단 바 — 산책 칩 */}
      <div className="z-[6] px-5 pt-4">
        {restricted && (
          <div className="mb-3 flex justify-center">
            <LockedChip label="몇 곳은 아직" note="전달하고 오면 열려요" />
          </div>
        )}
        <StrollBar strolled={strolled} setStrolled={setStrolled} />
      </div>
    </div>
  )
}

/** 마을 뉴스 벽보. 두 배치가 같은 것을 쓴다 — 폰에서 가장 먼저 읽히는 자리다. */
function NewsBoard({
  news,
  chat,
  setChat,
}: {
  news: string
  chat: string
  setChat: (v: string) => void
}) {
  return (
    <div className="rounded-[20px] px-5 py-4" style={{ background: '#F3E3CC', border: '1.5px solid #C96B4A' }}>
      <div className="flex items-start gap-3">
        <button
          onClick={() => setChat(KEEPER_CHATS[Math.floor(Math.random() * KEEPER_CHATS.length)])}
          className="squishy shrink-0"
          aria-label="다리말랑에게 말 걸기"
        >
          <Keeper field="care" size={54} />
        </button>
        <div className="min-w-0">
          <div className="font-display text-[15px]" style={{ color: '#C96B4A' }}>
            마을 뉴스
          </div>
          <p className="mt-1 text-[15px] leading-relaxed">{news}</p>
        </div>
      </div>
      {chat && (
        <div
          className="anim-popin mt-3 rounded-[16px] px-4 py-3 text-[14px]"
          style={{ background: '#FFFFFF', border: '1.5px solid #E8D9C8' }}
          onClick={() => setChat('')}
        >
          {chat}
        </div>
      )}
    </div>
  )
}

/** 무보상 산책 행동. 씬 밖 하단에 둔다 (§S2 구현 주의). */
function StrollBar({ strolled, setStrolled }: { strolled: string; setStrolled: (v: string) => void }) {
  return (
    <div className="px-4 pb-1 pt-3">
      <div className="flex flex-wrap justify-center gap-2">
        {STROLL_ACTIONS.map((a) => (
          <button
            key={a.key}
            onClick={() => setStrolled(a.line)}
            className="squishy rounded-full px-4 py-2 text-[13px] font-bold"
            style={{ background: '#FFFFFF', border: '1.5px solid #E8D9C8' }}
          >
            {a.label}
          </button>
        ))}
      </div>
      {strolled && (
        <div className="anim-popin mt-3 text-center text-[14px]" style={{ color: '#8C7A72' }}>
          {strolled}
        </div>
      )}
    </div>
  )
}

/** 광장을 둘러싼 집. 실제로는 일러스트 에셋으로 교체될 자리다. */
function Hut({ tint, deep, width = 132 }: { tint: string; deep: string; width?: number }) {
  return (
    <svg width={width} height={Math.round(width * 0.73)} viewBox="0 0 132 96" aria-hidden>
      <rect x={22} y={44} width={88} height={48} rx={12} fill={tint} stroke="#6E5A54" strokeWidth={2} />
      <path d="M12 44 L66 12 L120 44 Z" fill={deep} stroke="#6E5A54" strokeWidth={2} strokeLinejoin="round" opacity={0.85} />
      <rect x={56} y={64} width={20} height={28} rx={7} fill="#FFF6EC" stroke="#6E5A54" strokeWidth={1.8} />
    </svg>
  )
}
