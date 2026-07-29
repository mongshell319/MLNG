'use client'

import { FieldScene as ArtFieldScene } from '@/components/art'
import { toArtCrowd, toArtRoom, toArtSegment, toArtSite } from '@/lib/art/adapter'
import { EXPEDITION_BY_KEY } from '@/lib/domain/master'
import type { WorldSnapshot } from '@/lib/domain/types'

/**
 * C1 상태 3 — 원정 필드. 유형 7종.
 *
 * 그림은 아트팩의 FieldScene 이 그린다. 5레이어 배경 + 유형별 진행 시각화 7종 +
 * 구간별 랜드마크 + 접속한 말랑이들이 한 장의 SVG로 나온다.
 * 세 클라이언트가 같은 그림을 보는 것이 이 화면의 요점이다.
 * 제출 1건마다 prog가 오르고 그 즉시 여기 반영된다.
 *
 * 아트는 가로 비율로 구성돼 있어서 폭을 좁게 주면 좁은 대로 다시 짜인다.
 * 그래서 TV는 아트의 기준 크기 그대로, 세로로 긴 학생 화면은 좁은 폭을 준다 —
 * 늘려 놓고 잘라내는 것보다 처음부터 그 폭으로 그리게 하는 편이 덜 잘린다.
 */
const TV = { width: 1600, height: 760 }
const STUDENT = { width: 560, height: 760 }

export function FieldScene({
  world,
  className,
  style,
  size = 'tv',
}: {
  world: WorldSnapshot
  className?: string
  style?: React.CSSProperties
  size?: 'tv' | 'student'
}) {
  const { session } = world
  const box = size === 'tv' ? TV : STUDENT

  return (
    <div className={className} style={style} aria-label="원정 필드">
      <ArtFieldScene
        room={toArtRoom(world.village, session, world.progress)}
        site={toArtSite(session.siteId)}
        segment={toArtSegment(session.siteId, session.segmentIndex)}
        crowd={toArtCrowd(world.mallangs)}
        width={box.width}
        height={box.height}
      />
    </div>
  )
}


/** 상단 구간명 + 유형 아이콘 배지. TV와 학생 화면이 같은 문구를 쓴다. */
export function SegmentBadge({ world, size = 'tv' }: { world: WorldSnapshot; size?: 'tv' | 'student' }) {
  const site = world.sites.find((s) => s.id === world.session.siteId)
  const seg = site?.segments[world.session.segmentIndex]
  const type = EXPEDITION_BY_KEY[world.session.expeditionType]
  const tv = size === 'tv'
  return (
    <div
      className="inline-flex items-center gap-4 rounded-[20px]"
      style={{
        background: '#FFF6EC',
        border: `${tv ? 2 : 1.5}px solid #E8D9C8`,
        padding: tv ? '14px 28px' : '8px 16px',
      }}
    >
      <span className="font-display" style={{ fontSize: tv ? 38 : 18 }}>
        {site?.name} · {seg?.name}
      </span>
      <span
        className="rounded-full font-bold"
        style={{
          background: '#D9D2F5',
          color: '#7A6BB5',
          fontSize: tv ? 30 : 14,
          padding: tv ? '6px 20px' : '3px 12px',
        }}
      >
        {type.label}
      </span>
    </div>
  )
}
