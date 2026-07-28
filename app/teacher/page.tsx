'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useWorld } from '@/lib/client/world'
import { Loader, Toast } from '@/components/ui/primitives'
import { GmGate } from '@/components/teacher/GmGate'
import { ScreenLink } from '@/components/teacher/ScreenLink'
import { SessionRemote } from '@/components/teacher/SessionRemote'
import { Publish } from '@/components/teacher/Publish'
import { Verify } from '@/components/teacher/Verify'
import { Dashboard } from '@/components/teacher/Dashboard'
import { SeasonPanel } from '@/components/teacher/SeasonPanel'
import { Onboarding } from '@/components/teacher/Onboarding'

/**
 * 교사 GM 클라이언트.
 * 여기서만 미제출 건수와 완료율을 다룬다 — 학생 화면으로 넘어가지 않는다 (§3-4).
 */

const TABS = [
  { key: 'publish', label: '원정 발행' },
  { key: 'verify', label: '검증함' },
  { key: 'class', label: '현황 · 리모컨' },
  { key: 'season', label: '시즌 관리' },
  { key: 'onboarding', label: '온보딩' },
] as const

type TabKey = (typeof TABS)[number]['key']

export default function TeacherApp() {
  const { world, note, needsEntry, loading, identity, refresh } = useWorld()
  const [tab, setTab] = useState<TabKey>('publish')

  if (needsEntry) return <GmGate />
  if (loading || !world) return <Loader label="교무실을 여는 중이에요" />
  // 학생 쿠키로 교사 화면을 열 수는 없다. 서버도 막지만 화면에서도 되돌린다.
  if (identity?.kind !== 'gm') return <GmGate />

  const pending = world.progress.filter((p) => p.status === 'delivering').length

  const leave = async () => {
    await fetch('/api/leave', { method: 'POST' })
    await refresh()
  }

  return (
    <div className="mx-auto w-full max-w-[1280px] px-5 py-5">
      <header className="mb-4 flex flex-wrap items-center gap-3">
        <Link href="/" className="font-display text-[22px]" style={{ color: '#6E5A54' }}>
          말랑스쿨 GM
        </Link>
        <span className="text-[13px]" style={{ color: '#8C7A72' }}>
          {world.village.name} · {world.halls[0]?.name}
        </span>
        <div className="ml-auto flex items-center gap-2">
          <ScreenLink />
          <button
            onClick={leave}
            className="squishy rounded-full px-4 py-2 text-[13px] font-bold"
            style={{ background: '#FFFFFF', border: '1.5px solid #E8D9C8', color: '#8C7A72' }}
          >
            나가기
          </button>
        </div>
      </header>

      <SessionRemote world={world} />

      <nav className="my-4 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="squishy flex items-center gap-2 rounded-full px-5 py-2 text-[14px] font-bold"
            style={{
              background: tab === t.key ? '#FFC9B5' : '#FFFFFF',
              border: `1.5px solid ${tab === t.key ? '#C96B4A' : '#E8D9C8'}`,
              color: tab === t.key ? '#C96B4A' : '#8C7A72',
            }}
          >
            {t.label}
            {t.key === 'verify' && pending > 0 && (
              <span className="rounded-full px-2 py-0.5 text-[12px]" style={{ background: '#FFF0B3', color: '#B8933A' }}>
                {pending}
              </span>
            )}
          </button>
        ))}
      </nav>

      {tab === 'publish' && <Publish world={world} />}
      {tab === 'verify' && <Verify world={world} />}
      {tab === 'class' && <Dashboard world={world} />}
      {tab === 'season' && <SeasonPanel world={world} />}
      {tab === 'onboarding' && <Onboarding world={world} />}

      <Toast message={note} />
    </div>
  )
}
