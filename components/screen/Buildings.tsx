import { photoSrc } from '@/lib/client/photo'

/**
 * 마을 소품 — 아트가 그리지 않는 것만 남아 있다.
 *
 * 건물 5종 × 4단계와 편의시설은 원래 여기 플레이스홀더로 있었지만,
 * 아트팩의 components/art/Buildings.jsx 와 VillageScene 이 그 자리를 가져갔다.
 * 여기 남은 둘은 아트가 그릴 수 없는 것들이다 —
 * 기념비는 마을 밖(대륙 지도·인쇄물)에서 낱개로 쓰이고,
 * 작품 게시판은 학생이 올린 실제 사진을 건다.
 */

const INK = '#6E5A54'

export function Monument({ size = 90, label }: { size?: number; label?: string }) {
  return (
    <svg width={size} height={size * 1.2} viewBox="0 0 90 108" aria-label={label ?? '기념비'}>
      <path d="M45 6 L66 30 V96 H24 V30 Z" fill="#EFEAE2" stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
      <ellipse cx={45} cy={98} rx={34} ry={9} fill="#CFE0D4" stroke={INK} strokeWidth={2.2} />
      <path d="M36 48 h18 M36 60 h18 M36 72 h12" stroke={INK} strokeWidth={2.4} strokeLinecap="round" opacity={0.55} />
    </svg>
  )
}

/** 학생 작품 게시판 — 제출 사진 자리. 사진이 없으면 그라디언트 플레이스홀더. */
export function WorkBoard({ works, width = 300 }: { works: (string | null)[]; width?: number }) {
  return (
    <div
      className="rounded-[18px] p-3"
      style={{ background: '#F3E3CC', border: `2px solid ${INK}`, width }}
    >
      <div className="grid grid-cols-3 gap-2">
        {works.slice(0, 6).map((w, i) => (
          <div
            key={i}
            className="rounded-[10px]"
            style={{
              aspectRatio: '4 / 3',
              border: `2px solid ${INK}`,
              background: w
                ? `center/cover url(${photoSrc(w)})`
                : `linear-gradient(140deg, ${['#FFD6E5', '#C5EBDD', '#D9D2F5', '#FFF0B3', '#FFC9B5', '#BFE3EF'][i % 6]}, #FFF6EC)`,
            }}
          />
        ))}
      </div>
    </div>
  )
}
