'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useNow, useWorld } from '@/lib/client/world'
import { derivePhase } from '@/lib/domain/phase'
import { isExpedition } from '@/lib/domain/master'
import { Loader, Toast } from '@/components/ui/primitives'
import { Entry } from '@/components/student/Entry'
import { Plaza } from '@/components/student/Plaza'
import { Board } from '@/components/student/Board'
import { HallDesk } from '@/components/student/HallDesk'
import { Shop } from '@/components/student/Shop'
import { Room } from '@/components/student/Room'
import { StudentField } from '@/components/student/StudentField'
import { Lake } from '@/components/student/Lake'
import { ContinentMap } from '@/components/student/ContinentMap'
import { Spring } from '@/components/student/Spring'
import { Arrival, PlaceShell } from '@/components/student/PlaceShell'
import type { Place } from '@/lib/domain/types'

/**
 * 학생 클라이언트.
 *
 * 두 개의 모드 (§4):
 *  · 원정 중 — 마을을 거치지 않고 오늘의 장소에 이미 도착해 있다. 라우터가 place를 무시한다.
 *  · 자유 시간 — 광장에 서서 아무 데나 걸어간다.
 *
 * 첫 화면(광장)에 학교·수업 관련 단어가 하나도 없어야 한다는 규칙이
 * 가장 엄격하게 걸리는 클라이언트다.
 */
export default function StudentPage() {
  return (
    <Suspense fallback={<Loader label="세계로 가는 중이에요" />}>
      <StudentApp />
    </Suspense>
  )
}

function StudentApp() {
  const { world, me, note, needsEntry, loading } = useWorld()
  const params = useSearchParams()
  const now = useNow(500)
  const [place, setPlace] = useState<Place>('plaza')
  const [arrived, setArrived] = useState(false)

  const phase = world ? derivePhase(world.session, now).phase : 'before'
  const expedition = isExpedition(phase)

  // 원정이 시작되면 도착 연출을 한 번 띄운다. 끝나면 다시 광장으로 돌려놓는다.
  useEffect(() => {
    if (expedition) setArrived(true)
    else setPlace('plaza')
  }, [expedition])

  if (needsEntry) return <Entry classCode={params.get('class') ?? undefined} />
  if (loading || !world) return <Loader label="세계로 가는 중이에요" />
  if (!me) return <Entry classCode={params.get('class') ?? undefined} />

  if (expedition) {
    return (
      <>
        <StudentField world={world} me={me} now={now} />
        {arrived && <Arrival world={world} me={me} onDone={() => setArrived(false)} />}
        <Toast message={note} />
      </>
    )
  }

  const screens: Record<Place, React.ReactNode> = {
    plaza: <Plaza world={world} me={me} go={setPlace} />,
    board: <Board world={world} me={me} />,
    hall: <HallDesk world={world} me={me} />,
    shop: <Shop world={world} me={me} />,
    room: <Room world={world} me={me} />,
    lake: <Lake world={world} me={me} />,
    map: <ContinentMap world={world} />,
    spring: <Spring world={world} me={me} />,
    field: <StudentField world={world} me={me} now={now} />,
  }

  return (
    <>
      <PlaceShell place={place} go={setPlace} me={me}>
        {screens[place]}
      </PlaceShell>
      <Toast message={note} />
    </>
  )
}
