'use client'

import { useNow, useWorld } from '@/lib/client/world'
import { PHASE_LABEL } from '@/lib/domain/master'
import { derivePhase, formatClock, remainingSeconds } from '@/lib/domain/phase'
import type { WorldSnapshot } from '@/lib/domain/types'

/**
 * GM 리모컨 바 — 교사 화면 어디에 있어도 세션을 움직일 수 있어야 한다.
 * 누르는 순간 클래스 스크린과 스물여덟 대의 학생 화면이 같이 넘어간다.
 */
export function SessionRemote({ world }: { world: WorldSnapshot }) {
  const { dispatch, transport } = useWorld()
  const now = useNow(500)
  const { phase } = derivePhase(world.session, now)
  const at = () => new Date().toISOString()
  const remain = remainingSeconds(world.session, now)

  return (
    <div
      className="flex flex-wrap items-center gap-3 rounded-[20px] px-5 py-4"
      style={{ background: '#FFFFFF', border: '1.5px solid #E8D9C8' }}
    >
      <div className="flex items-center gap-2">
        <span className="rounded-full px-3 py-1 text-[13px] font-bold" style={{ background: '#D9D2F5', color: '#7A6BB5' }}>
          {PHASE_LABEL[phase]}
        </span>
        {remain > 0 && (
          <span className="text-[13px]" style={{ color: '#8C7A72' }}>
            남은 시간 {formatClock(remain)}
          </span>
        )}
      </div>

      <div className="ml-auto flex flex-wrap gap-2">
        {(phase === 'before' || phase === 'after') && (
          <Btn
            tint="#FFC9B5"
            fg="#C96B4A"
            onClick={() =>
              dispatch({
                type: 'session.open',
                siteId: world.session.siteId,
                segmentIndex: world.session.segmentIndex,
                expeditionType: world.session.expeditionType,
                minutes: 25,
                at: at(),
              })
            }
          >
            ▶ 수업 시작
          </Btn>
        )}

        {phase === 'opening' && (
          <Btn tint="#FFF6EC" fg="#8C7A72" onClick={() => dispatch({ type: 'session.live', at: at() })}>
            오프닝 건너뛰기
          </Btn>
        )}

        {phase === 'live' && (
          <>
            {world.session.crisis.active ? (
              <Btn tint="#D9D2F5" fg="#7A6BB5" onClick={() => dispatch({ type: 'crisis.end', at: at() })}>
                난관 마무리
              </Btn>
            ) : (
              <>
                <Btn
                  tint="#D9D2F5"
                  fg="#7A6BB5"
                  onClick={() => dispatch({ type: 'crisis.start', kind: 'fog', goal: 20, seconds: 180, at: at() })}
                >
                  난관 발동
                </Btn>
                <Btn
                  tint="#D9D2F5"
                  fg="#7A6BB5"
                  onClick={() => dispatch({ type: 'crisis.start', kind: 'raid', goal: 24, seconds: 300, at: at() })}
                >
                  레이드
                </Btn>
              </>
            )}
            <Btn tint="#C5EBDD" fg="#4A8B6F" onClick={() => dispatch({ type: 'session.settle', fast: false, at: at() })}>
              정산 시작
            </Btn>
            <Btn tint="#FFF6EC" fg="#4A8B6F" onClick={() => dispatch({ type: 'session.settle', fast: true, at: at() })}>
              빠른 정산
            </Btn>
          </>
        )}

        {phase !== 'before' && (
          <Btn tint="#FFF6EC" fg="#8C7A72" onClick={() => dispatch({ type: 'session.after', at: at() })}>
            원정 끝내기
          </Btn>
        )}

        <span className="ml-2 self-center text-[12px]" style={{ color: '#B8A99E' }}>
          {transport === 'supabase' ? 'Realtime 연결됨' : transport === 'sse' ? '실시간 연결됨' : '연결 중'}
        </span>
      </div>
    </div>
  )
}

function Btn({
  children,
  onClick,
  tint,
  fg,
}: {
  children: React.ReactNode
  onClick: () => void
  tint: string
  fg: string
}) {
  return (
    <button
      onClick={onClick}
      className="squishy rounded-full px-4 py-2 text-[14px] font-bold"
      style={{ background: tint, color: fg, border: `1.5px solid ${fg}` }}
    >
      {children}
    </button>
  )
}
