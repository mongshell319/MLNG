'use client'

import { Mallang } from '@/components/mallang/Mallang'
import { Keeper } from '@/components/mallang/Keeper'
import { KindIcon, WeatherIcon } from '@/components/ui/Icons'
import { FIELDS, QUEST_KIND, WEATHER_DESC } from '@/lib/domain/master'
import { formatClock, remainingSeconds } from '@/lib/domain/phase'
import type { WorldSnapshot } from '@/lib/domain/types'
import { Amenity, BUILDING_COMPONENT, Monument, WorkBoard } from './Buildings'

/**
 * C1 상태 1 — 상시 (마을 거점).
 *
 * 화면 전면이 학급 마을 파노라마다. 다섯 건물이 각각 성장 4단계를 갖고,
 * 편의시설과 기념비와 작품 게시판이 함께 보인다. 말랑이 두세 마리가 부유한다.
 * 수치 비교는 어디에도 없다 — 길드 게이지의 n/24 만이 유일한 숫자이며 이건 반 전체의 것이다.
 */

/**
 * 무대 배치는 세 층으로 나눈다.
 *   건물층(bottom 320) · 소품층(bottom ~210) · 전경의 말랑이층(bottom 50)
 * 층을 섞으면 말랑이 SVG가 건물 라벨을 덮는다 — 프로토타입에서 반복된 문제다.
 */
const BUILDING_SLOTS: { key: keyof WorldSnapshot['village']['buildings']; left: number; bottom: number; width: number }[] = [
  { key: 'library', left: 60, bottom: 330, width: 240 },
  { key: 'workshop', left: 360, bottom: 330, width: 220 },
  { key: 'plaza', left: 660, bottom: 320, width: 250 },
  { key: 'garden', left: 1020, bottom: 330, width: 230 },
  { key: 'lighthouse', left: 1340, bottom: 330, width: 160 },
]

/** 전경 말랑이 자리 — 길드 게이지(중앙 하단)와 건물 라벨을 둘 다 피한다. */
const IDLE_SLOTS = [180, 470, 1530]

export function Panorama({
  world,
  now,
  growing = false,
  dim = false,
}: {
  world: WorldSnapshot
  now: number
  /** 정산 '마을 성장' 구간에서만 켠다 */
  growing?: boolean
  dim?: boolean
}) {
  const { village, session } = world
  const mainQuest = world.quests.find((q) => q.kind === 'main' && !q.carriedOver)
  const remain = remainingSeconds(session, now)
  const exam = village.examMode

  return (
    <div
      className="absolute inset-0"
      style={{
        background: exam
          ? 'linear-gradient(#EFEAE2 0%, #FFF6EC 48%, #CFE0D4 48%, #C3D9C8 100%)'
          : 'linear-gradient(#D9F0F7 0%, #FFF6EC 46%, #CFE0D4 46%, #A9C4B2 100%)',
        filter: dim ? 'brightness(0.55)' : undefined,
        transition: 'filter 900ms ease-out',
      }}
    >
      {/* 먼 언덕 */}
      <svg className="absolute bottom-[420px] left-0" width={1920} height={220} viewBox="0 0 1920 220" aria-hidden>
        <path d="M0 220 Q300 60 620 150 T1240 120 T1920 190 V220 Z" fill="#CFE0D4" opacity={0.85} />
        <path d="M0 220 Q420 130 900 190 T1920 160 V220 Z" fill="#A9C4B2" opacity={0.7} />
      </svg>

      {/* 길 */}
      <svg className="absolute bottom-0 left-0" width={1920} height={300} viewBox="0 0 1920 300" aria-hidden>
        <path d="M-40 300 Q560 190 1000 240 T1960 200 V300 Z" fill="#EAD9C2" opacity={0.9} />
      </svg>

      {/* 건물 5동 */}
      {BUILDING_SLOTS.map((slot) => {
        const Component = BUILDING_COMPONENT[slot.key]
        const field = FIELDS.find((f) => f.building === slot.key)!
        return (
          <div key={slot.key} className="absolute" style={{ left: slot.left, bottom: slot.bottom }}>
            <Component level={village.buildings[slot.key]} width={slot.width} growing={growing} />
            <div className="mt-2 flex items-center justify-center gap-2">
              <span
                className="rounded-full px-4 py-1 font-display"
                style={{ fontSize: 32, background: '#FFF6EC', border: `2px solid ${field.deep}`, color: field.deep }}
              >
                {field.buildingLabel}
              </span>
            </div>
          </div>
        )
      })}

      {/* 소품층 — 편의시설 · 기념비 · 작품 게시판 */}
      <div className="absolute bottom-[212px] left-[900px] flex items-end gap-10">
        {village.amenities.map((a) => (
          <Amenity key={a} kind={a} size={72} />
        ))}
      </div>
      {village.monuments.length > 0 && (
        <div className="absolute bottom-[214px] left-[1250px]">
          <Monument size={104} label={village.monuments[0]} />
        </div>
      )}
      <div className="absolute bottom-[300px] left-[1580px]">
        <WorkBoard works={session.repairParts} width={250} />
        <div className="mt-2 text-center font-display" style={{ fontSize: 28 }}>
          우리 작품
        </div>
      </div>

      {/* 전경 말랑이층 — 두세 마리가 부유한다 */}
      {world.mallangs.slice(0, IDLE_SLOTS.length).map((m, i) => (
        <div
          key={m.id}
          className="anim-floaty absolute"
          style={{ left: IDLE_SLOTS[i], bottom: 54 + (i % 2) * 22, animationDelay: `${i * 0.8}s` }}
        >
          <Mallang color={m.bodyColor} face={i === 1 ? 'glad' : 'base'} size={150} form={m.evolutionForm} accessory={m.wearing} />
        </div>
      ))}
      <div className="anim-floaty absolute bottom-[54px] left-[1720px]" style={{ animationDelay: '1.6s' }}>
        <Keeper field="care" size={150} />
      </div>

      {/* 상단 좌측 · 날씨 */}
      <div
        className="absolute left-[28px] top-[24px] flex items-center gap-4 rounded-[20px] px-7 py-4"
        style={{ background: '#FFF6EC', border: '2px solid #FFF0B3' }}
      >
        <span style={{ color: '#B8933A' }}>
          <WeatherIcon weather={village.weather} size={44} strokeWidth={2} />
        </span>
        <div>
          <div className="font-display" style={{ fontSize: 34 }}>
            {village.weather}
          </div>
          <div style={{ fontSize: 22, color: '#8C7A72' }}>{WEATHER_DESC[village.weather]}</div>
        </div>
      </div>

      {/* 우측 상단 · 남은 시간 */}
      {remain > 0 && (
        <div
          className="absolute right-[28px] top-[24px] flex items-baseline gap-4 rounded-[20px] px-8 py-4"
          style={{ background: '#FFF6EC', border: '2px solid #E8D9C8' }}
        >
          <span style={{ fontSize: 32 }}>남은 시간</span>
          <span className="font-display" style={{ fontSize: 46 }}>
            {formatClock(remain)}
          </span>
        </div>
      )}

      {/* 좌측 · 오늘의 의뢰 요약 */}
      {mainQuest && (
        <div
          className="absolute left-[28px] top-[168px] rounded-[20px] px-8 py-7"
          style={{ maxWidth: 580, background: QUEST_KIND.main.tint, border: `2px solid ${QUEST_KIND.main.deep}` }}
        >
          <div className="flex items-center gap-3" style={{ color: QUEST_KIND.main.deep, fontSize: 32 }}>
            <KindIcon kind="main" size={30} />
            <b>오늘의 의뢰</b>
          </div>
          <div className="mt-3 font-display" style={{ fontSize: 38 }}>
            {mainQuest.title}
          </div>
          <p className="mt-3" style={{ fontSize: 32, lineHeight: 1.45 }}>
            {mainQuest.story.request}
          </p>
        </div>
      )}

      {/* 하단 중앙 · 길드 게이지 */}
      <div
        className="absolute bottom-[26px] left-1/2 flex -translate-x-1/2 items-center gap-6 rounded-full px-9 py-4"
        style={{ background: '#D9D2F5', border: '2px solid #7A6BB5' }}
      >
        <span className="font-display" style={{ fontSize: 32, color: '#7A6BB5' }}>
          길드 의뢰
        </span>
        <div className="overflow-hidden rounded-full" style={{ width: 380, height: 22, background: '#FFF6EC', border: '2px solid #7A6BB5' }}>
          <div
            className="h-full rounded-full transition-[width] duration-700 ease-out"
            style={{ width: `${(village.guildProgress / village.guildGoal) * 100}%`, background: '#7A6BB5' }}
          />
        </div>
        <span className="font-display" style={{ fontSize: 32, color: '#7A6BB5' }}>
          {village.guildProgress}/{village.guildGoal}
        </span>
      </div>

      {exam && (
        <div
          className="absolute bottom-[26px] left-[28px] flex items-center gap-4 rounded-[20px] px-7 py-4"
          style={{ background: '#FFF6EC', border: '2px solid #E8D9C8' }}
        >
          <Mallang size={72} face="full" color="#C5EBDD" />
          <span style={{ fontSize: 32 }}>시험 잘 보고 와! 마을은 우리가 지킬게</span>
        </div>
      )}

      {/* 첫 사용 — 빈 터와 캠프 */}
      {!village.founded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-6" style={{ background: 'rgba(255,246,236,.88)' }}>
          <Mallang size={190} face="glad" className="anim-floaty" />
          <div className="font-display" style={{ fontSize: 64 }}>
            여기에 우리 마을이 세워져요
          </div>
        </div>
      )}
    </div>
  )
}
