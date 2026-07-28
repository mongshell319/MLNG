'use client'

import { useWorld, useNow } from '@/lib/client/world'
import { derivePhase } from '@/lib/domain/phase'
import { Loader } from '@/components/ui/primitives'
import { Mallang } from '@/components/mallang/Mallang'
import { Stage } from '@/components/screen/Stage'
import { Panorama } from '@/components/screen/Panorama'
import { Opening } from '@/components/screen/Opening'
import { FieldScene, SegmentBadge } from '@/components/screen/Field'
import { CrisisOverlay, ToolOverlay } from '@/components/screen/Overlays'
import { Settle } from '@/components/screen/Settle'
import { DyeingNight, Finale } from '@/components/screen/Season'
import { formatClock, remainingSeconds } from '@/lib/domain/phase'

/**
 * C1 — 클래스 스크린 (TV · 최우선).
 *
 * 여덟 개 상태를 갖는 상태 머신이고, 그 상태는 전부 세션 하나에서 파생된다.
 * 학생이 전달하면 여기 진행도가 1초 안에 움직인다. 그게 이 화면의 전부다.
 */
export default function ClassScreen() {
  const { world, needsEntry, loading } = useWorld()
  const now = useNow(200)

  // TV는 스스로 입장하지 않는다. 교사가 만든 링크를 한 번 열어야 한다.
  if (needsEntry) {
    return (
      <Stage>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-8" style={{ background: '#FFF6EC' }}>
          <Mallang size={220} face="sleepy" color="#D9D2F5" className="anim-floaty" />
          <div className="font-display" style={{ fontSize: 64 }}>
            아직 교실이 열리지 않았어요
          </div>
          <div style={{ fontSize: 34, color: '#8C7A72' }}>
            교사 화면의 <b>클래스 스크린 열기</b>에서 QR을 띄우고, 이 화면으로 찍어 주세요.
          </div>
        </div>
      </Stage>
    )
  }

  if (loading || !world) {
    return (
      <Stage>
        <Loader label="교실을 여는 중이에요" />
      </Stage>
    )
  }

  const { phase, stage, inStage, stageLength } = derivePhase(world.session, now)
  const remain = remainingSeconds(world.session, now)

  return (
    <Stage>
      {/* 상태 1 · 상시 — 원정 전과 원정 후에 마을이 그대로 보인다 */}
      {(phase === 'before' || phase === 'after') && <Panorama world={world} now={now} />}

      {/* 상태 2 · 오프닝 40초 */}
      {phase === 'opening' && <Opening world={world} seconds={inStage} />}

      {/* 상태 3 · 원정 필드 */}
      {phase === 'live' && (
        <>
          <FieldScene world={world} className="absolute inset-0 h-full w-full" />
          <div className="absolute left-[28px] top-[24px]">
            <SegmentBadge world={world} />
          </div>
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
          {/* 하단 진행도 — 반 전체의 것 하나만 */}
          <div
            className="absolute bottom-[26px] left-1/2 flex -translate-x-1/2 items-center gap-6 rounded-full px-9 py-4"
            style={{ background: '#FFF6EC', border: '2px solid #7A6BB5' }}
          >
            <span className="font-display" style={{ fontSize: 32, color: '#7A6BB5' }}>
              오늘 구간
            </span>
            <div className="overflow-hidden rounded-full" style={{ width: 520, height: 22, background: '#FFFFFF', border: '2px solid #7A6BB5' }}>
              <div
                className="h-full rounded-full"
                style={{ width: `${world.session.prog}%`, background: '#D9D2F5', transition: 'width 800ms ease-out' }}
              />
            </div>
          </div>
          {/* 상태 4 · 난관과 레이드 */}
          <CrisisOverlay world={world} now={now} />
        </>
      )}

      {/* 상태 5 · 정산 */}
      {stage && <Settle world={world} stage={stage} inStage={inStage} stageLength={stageLength} now={now} />}

      {/* 상태 7 · 물드는 밤 */}
      {phase === 'night' && <DyeingNight world={world} />}

      {/* 상태 8 · 시즌 완공식 */}
      {phase === 'finale' && <Finale world={world} now={now} />}

      {/* 상태 6 · 잔도구 — 어느 화면 위에도 얹힌다 */}
      <ToolOverlay world={world} now={now} />
    </Stage>
  )
}
