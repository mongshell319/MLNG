'use client'

import { VillageScene } from '@/components/art'
import { Mallang } from '@/components/mallang/Mallang'
import { Keeper } from '@/components/mallang/Keeper'
import { KindIcon, WeatherIcon } from '@/components/ui/Icons'
import { artVillageSlots, BUILDING_BY_ART_FIELD, toArtRoom } from '@/lib/art/adapter'
import { pickPalette } from '@/lib/art/tokens'
import { FIELDS, QUEST_KIND, WEATHER_DESC } from '@/lib/domain/master'
import { formatClock, remainingSeconds } from '@/lib/domain/phase'
import type { WorldSnapshot } from '@/lib/domain/types'
import { WorkBoard } from './Buildings'

/**
 * C1 상태 1 — 상시 (마을 거점).
 *
 * 화면 전면이 학급 마을 파노라마다. 다섯 건물이 각각 성장 4단계를 갖고,
 * 편의시설과 기념비와 작품 게시판이 함께 보인다. 말랑이 두세 마리가 부유한다.
 * 수치 비교는 어디에도 없다 — 길드 게이지의 n/24 만이 유일한 숫자이며 이건 반 전체의 것이다.
 */

/**
 * 마을 그림은 아트팩의 VillageScene 이 통째로 그린다.
 *
 * 아트는 1600×760 으로 구성돼 있다. 무대(1920×1080)는 그보다 세로로 길어서, 아트가 스스로
 * 정한 대로(preserveAspectRatio="xMidYMax slice") 높이를 채우고 좌우가 조금 잘리게 둔다.
 * 잘리는 건 가장자리 나무·덤불뿐이고, 대신 지면 높이와 건물 크기가 미리보기와 같아진다.
 */
const ART_W = 1600
const ART_H = 760
const ART_SCALE = 1080 / ART_H // 1.421 — 세로를 채운다
const ART_LEFT = (1920 - ART_W * ART_SCALE) / 2 // -177 — 좌우로 잘려 나가는 만큼

/** 아트 좌표 → 무대 좌표 */
const sx = (x: number) => x * ART_SCALE + ART_LEFT
const sy = (y: number) => y * ART_SCALE

/** 지면선. 아래로 213px 이 잔디밭이고 여기 위에 이름표·말랑이가 선다. */
const GROUND = sy(ART_H - 150)

/**
 * 전경 말랑이 자리.
 * 건물은 화면 가운데에 모여 서므로(시드 배치) 양 끝이 비어 있다. 이름표와 길드 게이지가
 * 잔디밭 가운데를 쓰기 때문에 말랑이는 그 바깥으로 내보낸다.
 */
const IDLE_SLOTS = [96, 1614]

/**
 * 건물 이름표 높이.
 * 아트가 이름표를 두는 자리(artLabelY)는 잔디밭 한가운데라 TV에서는 길드 게이지와 겹친다.
 * 무대에서는 지면선 바로 아래, 게이지 위쪽 빈 띠에 놓는다.
 */
const LABEL_TOP = 16

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

  const room = toArtRoom(village, session, world.progress)
  const P = pickPalette(room)
  const slots = artVillageSlots(room.code, ART_W)
  const labelY = GROUND + LABEL_TOP

  return (
    <div
      className="absolute inset-0"
      style={{
        background: P.sky,
        filter: dim ? 'brightness(0.55)' : undefined,
        transition: 'filter 900ms ease-out',
      }}
    >
      {/* 마을 파노라마 — 하늘·언덕·지면·건물 5동·편의시설·기념비·초목 전부 아트가 그린다 */}
      <div className={`absolute inset-0 ${growing ? 'anim-growup' : ''}`}>
        <VillageScene room={room} width={ART_W} height={ART_H} />
      </div>

      {/* 건물 이름표 — 아트가 세운 자리를 따라간다 (아트의 26px 이름표는 TV 최소 32px에 못 미친다) */}
      {slots.map((slot) => {
        const field = FIELDS.find((f) => f.building === BUILDING_BY_ART_FIELD[slot.field])!
        return (
          <span
            key={slot.field}
            className="absolute -translate-x-1/2 whitespace-nowrap rounded-full px-4 py-1 font-display"
            style={{
              left: sx(slot.cx),
              top: labelY,
              fontSize: 32,
              background: '#FFF6EC',
              border: `2px solid ${field.deep}`,
              color: field.deep,
            }}
          >
            {field.buildingLabel}
          </span>
        )
      })}

      {/* 작품 게시판 — 학생이 올린 사진이라 아트가 그릴 수 없다. 비어 있는 하늘 오른쪽에 건다. */}
      <div className="absolute right-[28px] top-[152px]">
        <WorkBoard works={session.repairParts} width={250} />
        <div className="mt-2 text-center font-display" style={{ fontSize: 28 }}>
          우리 작품
        </div>
      </div>

      {/* 전경 말랑이층 — 잔디밭 양 끝에서 부유한다 */}
      {world.mallangs.slice(0, IDLE_SLOTS.length).map((m, i) => (
        <div
          key={m.id}
          className="anim-floaty absolute"
          style={{ left: IDLE_SLOTS[i], top: GROUND + 12 + (i % 2) * 20, animationDelay: `${i * 0.8}s` }}
        >
          <Mallang color={m.bodyColor} face={i === 1 ? 'glad' : 'base'} size={150} form={m.evolutionForm} accessory={m.wearing} />
        </div>
      ))}
      <div className="anim-floaty absolute" style={{ left: 1780, top: GROUND + 22, animationDelay: '1.6s' }}>
        <Keeper field="care" size={120} />
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
