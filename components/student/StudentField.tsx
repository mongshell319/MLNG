'use client'

import { Mallang } from '@/components/mallang/Mallang'
import { FieldScene, SegmentBadge } from '@/components/screen/Field'
import { ClassIcon, HeartIcon, LockIcon } from '@/components/ui/Icons'
import { PillButton } from '@/components/ui/primitives'
import { useWorld } from '@/lib/client/world'
import { CLASS_ABILITY, EXPEDITION_BY_KEY, isSettling } from '@/lib/domain/master'
import { crisisSeconds, derivePhase, formatClock, remainingSeconds } from '@/lib/domain/phase'
import type { Mallang as MallangType, WorldSnapshot } from '@/lib/domain/types'

/**
 * S7 — 원정 필드 (학생).
 *
 * C1의 필드를 개인 시점으로 축소한 것이다. 화면 중앙에 지금 할 일 하나가 크게 놓이고,
 * 하단에 반 전체 진행도만 얇게 깔린다. 개인 기여도 순위·수치는 없다.
 * 조작 시간이 1–2분을 넘지 않도록 요소를 최소화한다.
 */
export function StudentField({ world, me, now }: { world: WorldSnapshot; me: MallangType; now: number }) {
  const { dispatch } = useWorld()
  const { phase } = derivePhase(world.session, now)
  const cls = CLASS_ABILITY[me.classRole]
  const type = EXPEDITION_BY_KEY[world.session.expeditionType]

  const todayQuest =
    world.quests.find((q) => q.kind === 'main' && !q.carriedOver) ?? world.quests.find((q) => q.kind === 'main')
  const p = todayQuest ? world.progress.find((x) => x.questId === todayQuest.id && x.mallangId === me.id) : undefined
  const status = p?.status ?? 'open'
  const at = () => new Date().toISOString()

  const settling = isSettling(phase)

  return (
    <div className="relative flex min-h-[100svh] flex-col overflow-hidden">
      <FieldScene world={world} className="absolute inset-0 h-full w-full" style={{ opacity: settling ? 0.35 : 1 }} />

      {/* 상단 — 구간과 내 이름표 */}
      <div className="relative z-10 flex items-start justify-between px-4 pt-4">
        <SegmentBadge world={world} size="student" />
        <div className="flex items-center gap-2 rounded-full px-3 py-1.5" style={{ background: '#FFF6EC', border: '1.5px solid #E8D9C8' }}>
          <Mallang color={me.bodyColor} size={26} form={me.evolutionForm} accessory={me.wearing} />
          <span className="text-[13px] font-bold">{me.name}</span>
          <span style={{ color: '#8C7A72' }} title={cls.label}>
            <ClassIcon role={me.classRole} size={14} />
          </span>
          <span className="text-[12px]" style={{ color: '#8C7A72' }}>
            {cls.label}
          </span>
        </div>
      </div>

      {/* 난관 카운터 — 반 전체의 것 */}
      {world.session.crisis.active && (
        <div className="relative z-10 mt-3 flex justify-center">
          <div className="rounded-[20px] px-6 py-3 text-center" style={{ background: '#FFF6EC', border: '1.5px solid #7A6BB5' }}>
            <div className="text-[13px]" style={{ color: '#7A6BB5' }}>
              {world.session.crisis.label}
            </div>
            <div className="font-display text-[22px]">
              전달 {world.session.crisis.counter}/{world.session.crisis.goal} · {formatClock(crisisSeconds(world.session, now))}
            </div>
          </div>
        </div>
      )}

      {/* 가운데 — 지금 할 일 하나 */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-4 px-5">
        {phase === 'opening' && (
          <Panel>
            <Mallang color={me.bodyColor} size={92} face="surprise" form={me.evolutionForm} className="anim-floaty" />
            <div className="mt-2 font-display text-[20px]">문이 열리는 중이에요</div>
            <div className="text-[14px]" style={{ color: '#8C7A72' }}>
              앞쪽 큰 화면을 봐 주세요.
            </div>
          </Panel>
        )}

        {phase === 'live' && todayQuest && (
          <Panel>
            <div className="text-[13px]" style={{ color: '#C96B4A' }}>
              {type.label} · 지금 할 일
            </div>
            <div className="mt-1 font-display text-[24px]">{type.todo}</div>
            <div className="mt-1 text-[15px]">{todayQuest.title}</div>

            {status === 'solved' ? (
              <div className="mt-4 flex items-center gap-3">
                <Mallang color={me.bodyColor} size={56} face="full" form={me.evolutionForm} />
                <span className="text-[15px]">전달했어요. 여기서 좀 쉬어도 돼요.</span>
              </div>
            ) : status === 'delivering' ? (
              <div className="mt-4 flex items-center gap-3">
                <Mallang color={me.bodyColor} size={56} face="sleepy" form={me.evolutionForm} className="anim-floaty" />
                <span className="text-[15px]">전달 중이에요.</span>
              </div>
            ) : (
              <div className="mt-4 flex flex-col items-center gap-3">
                <div className="flex flex-wrap justify-center gap-2">
                  {todayQuest.checklist.map((c, i) => {
                    const on = p?.checks?.[i] ?? false
                    return (
                      <button
                        key={c}
                        onClick={() =>
                          dispatch({ type: 'quest.check', questId: todayQuest.id, mallangId: me.id, index: i as 0 | 1 | 2, value: !on, at: at() })
                        }
                        className="squishy rounded-full px-4 py-2 text-[13px]"
                        style={{ background: on ? '#FFC9B5' : '#FFFFFF', border: '1.5px solid #E8D9C8' }}
                      >
                        {on ? '✓ ' : ''}
                        {c}
                      </button>
                    )
                  })}
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <button
                    onClick={() =>
                      dispatch({
                        type: 'quest.photo',
                        questId: todayQuest.id,
                        mallangId: me.id,
                        photoUrl: `https://dummyimage.com/480x360/FFC9B5/6E5A54.png&text=${encodeURIComponent(me.name)}`,
                        at: at(),
                      })
                    }
                    className="squishy rounded-full px-4 py-2 text-[13px] font-bold"
                    style={{ background: p?.photoUrl ? '#FFC9B5' : '#FFFFFF', border: '1.5px solid #E8D9C8' }}
                  >
                    {p?.photoUrl ? '사진 다시' : '사진 찍기'}
                  </button>
                  <PillButton
                    tint="#C96B4A"
                    fg="#FFF6EC"
                    size="lg"
                    reason={
                      !p?.photoUrl
                        ? '사진을 첨부해주세요'
                        : !(p?.checks ?? []).every(Boolean)
                          ? '체크 항목이 조금 남았어요'
                          : undefined
                    }
                    onClick={() => dispatch({ type: 'quest.deliver', questId: todayQuest.id, mallangId: me.id, at: at() })}
                  >
                    전달하기
                  </PillButton>
                </div>
              </div>
            )}

            {/* 클래스 전용 행동 — 해당 클래스에게만 */}
            <button
              onClick={() => dispatch({ type: 'field.classAction', mallangId: me.id, at: at() })}
              className="squishy mt-4 rounded-full px-5 py-2 text-[13px] font-bold"
              style={{ background: '#D9D2F5', color: '#7A6BB5', border: '1.5px solid #7A6BB5' }}
            >
              {cls.label} · {cls.action}
            </button>
          </Panel>
        )}

        {settling && <SettlingPanel world={world} me={me} phase={phase} />}
      </div>

      {/* 하단 — 반 전체 진행도. 얇게, 개인 수치 없이. */}
      <div className="relative z-10 px-5 pb-5">
        <div className="flex items-center gap-3">
          <span className="text-[12px]" style={{ color: '#8C7A72' }}>
            다 같이
          </span>
          <div className="h-2.5 flex-1 overflow-hidden rounded-full" style={{ background: '#FFFFFF', border: '1.5px solid #E8D9C8' }}>
            <div className="h-full rounded-full transition-[width] duration-700" style={{ width: `${world.session.prog}%`, background: '#D9D2F5' }} />
          </div>
          {remainingSeconds(world.session, now) > 0 && (
            <span className="text-[12px]" style={{ color: '#8C7A72' }}>
              {formatClock(remainingSeconds(world.session, now))}
            </span>
          )}
        </div>
        <div className="mt-3 flex justify-center">
          <span
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-bold"
            style={{ background: '#EFEAE2', color: '#8C7A72' }}
          >
            <LockIcon size={12} />
            가게 · 꾸미기 · 채집 · 산책은 쉬는 시간에 열려요
          </span>
        </div>
      </div>
    </div>
  )
}

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="anim-popin w-full max-w-[560px] rounded-[24px] px-7 py-7 text-center"
      style={{ background: 'rgba(255,246,236,.95)', border: '1.5px solid #E8D9C8' }}
    >
      {children}
    </div>
  )
}

/** 정산 중 학생 화면. 하트는 여기서 보내고, C1에는 숫자 없이 떠오른다. */
function SettlingPanel({ world, me, phase }: { world: WorldSnapshot; me: MallangType; phase: string }) {
  const { dispatch } = useWorld()
  const cards = world.session.spotlight

  if (phase !== 'spotlight') {
    return (
      <Panel>
        <Mallang color={me.bodyColor} size={92} face="glad" form={me.evolutionForm} className="anim-floaty" />
        <div className="mt-2 font-display text-[20px]">돌아왔어요</div>
        <div className="text-[14px]" style={{ color: '#8C7A72' }}>
          앞쪽 큰 화면에서 오늘 것을 함께 봐요.
        </div>
      </Panel>
    )
  }

  return (
    <Panel>
      <div className="font-display text-[20px]">하트 보내기</div>
      <div className="mt-1 text-[14px]" style={{ color: '#8C7A72' }}>
        마음이 가는 쪽에 두 번까지 보낼 수 있어요.
      </div>
      <div className="mt-4 flex flex-wrap justify-center gap-3">
        {cards.map((c) => (
          <button
            key={c.mallangId}
            onClick={() => dispatch({ type: 'heart.send', mallangId: c.mallangId, at: new Date().toISOString() })}
            className="squishy rounded-[20px] px-4 py-3 text-center"
            style={{ background: '#FFFFFF', border: '1.5px solid #E8D9C8' }}
          >
            <Mallang color={c.bodyColor} size={64} face="glad" form={c.form} />
            <div className="mt-1 text-[13px] font-bold">{c.name}</div>
            <div className="mt-1 flex items-center justify-center" style={{ color: '#FFB3C6' }}>
              <HeartIcon size={16} />
            </div>
          </button>
        ))}
      </div>
    </Panel>
  )
}
