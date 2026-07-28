'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import type { Action } from '@/lib/domain/actions'
import type { Mallang, WorldSnapshot } from '@/lib/domain/types'

/**
 * 세 클라이언트가 같은 세계를 본다.
 *
 * 어느 마을을 볼지는 쿠키 속 신원이 정한다 — 클라이언트가 마을을 고르지 않는다.
 * 구독은 Supabase Realtime(설정된 경우) 또는 SSE. 어느 쪽도 폴링하지 않는다.
 *
 * 역할은 지금 있는 경로가 알려 준다. 역할마다 쿠키가 따로라서, 한 브라우저에서
 * 교사·학생·교실 TV를 동시에 열어 둘 수 있다 — 시연할 때 창 세 개면 끝난다.
 */

function roleForPath(pathname: string): 'student' | 'gm' | 'screen' | null {
  if (pathname.startsWith('/student')) return 'student'
  if (pathname.startsWith('/screen')) return 'screen'
  if (pathname.startsWith('/teacher') || pathname.startsWith('/print') || pathname.startsWith('/dev')) return 'gm'
  return null
}

export interface ClientIdentity {
  kind: 'student' | 'gm' | 'screen'
  villageId: string
  code?: string
}

interface WorldContextValue {
  world: WorldSnapshot | null
  identity: ClientIdentity | null
  /** 이 화면이 어떤 역할로 서버에 말하는가 */
  role: 'student' | 'gm' | 'screen' | null
  /** 아직 입장하지 않았다 — 각 클라이언트가 자기 입장 화면을 띄운다 */
  needsEntry: boolean
  loading: boolean
  transport: 'supabase' | 'sse' | 'connecting'
  dispatch: (action: Action) => Promise<string | undefined>
  note: string
  say: (msg: string) => void
  me: Mallang | null
  /** 입장·퇴장 후 세계를 다시 잡는다 */
  refresh: () => Promise<void>
}

const WorldContext = createContext<WorldContextValue | null>(null)

export function WorldProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const role = roleForPath(pathname ?? '')
  const [world, setWorld] = useState<WorldSnapshot | null>(null)
  const [identity, setIdentity] = useState<ClientIdentity | null>(null)
  const [needsEntry, setNeedsEntry] = useState(false)
  const [loading, setLoading] = useState(true)
  const [transport, setTransport] = useState<'supabase' | 'sse' | 'connecting'>('connecting')
  const [note, setNote] = useState('')
  const noteTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const version = useRef(0)
  const cleanup = useRef<(() => void) | null>(null)

  const accept = useCallback((next: WorldSnapshot) => {
    // 늦게 도착한 스냅샷이 최신 상태를 되돌리지 않게 한다.
    if (next.version < version.current) return
    version.current = next.version
    setWorld(next)
  }, [])

  const say = useCallback((msg: string) => {
    if (!msg) return
    setNote(msg)
    if (noteTimer.current) clearTimeout(noteTimer.current)
    noteTimer.current = setTimeout(() => setNote(''), 2600)
  }, [])

  const connect = useCallback(
    async (villageId: string, kind: 'supabase' | 'local', token: string | null, ttlSeconds: number) => {
      cleanup.current?.()
      cleanup.current = null

      const url = process.env.NEXT_PUBLIC_SUPABASE_URL
      const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (kind === 'supabase' && url && anon && token) {
        const { createClient } = await import('@supabase/supabase-js')
        const client = createClient(url, anon, {
          auth: { persistSession: false, autoRefreshToken: false },
          global: { headers: { Authorization: `Bearer ${token}` } },
        })
        // RLS 가 village_id 클레임으로 구독 범위를 자른다.
        await client.realtime.setAuth(token)

        const channel = client
          .channel(`world:${villageId}`)
          .on(
            'postgres_changes',
            { event: 'UPDATE', schema: 'public', table: 'worlds', filter: `village_id=eq.${villageId}` },
            (payload) => accept((payload.new as { snapshot: WorldSnapshot }).snapshot),
          )
          .subscribe()

        // 토큰이 만료되기 전에 새로 받아 끼운다. 수업 중에 연결이 끊기면 안 된다.
        const renew = setInterval(
          () => {
            void fetch(`/api/world?as=${role}`, { cache: 'no-store' })
              .then((r) => (r.ok ? r.json() : null))
              .then((j: { realtimeToken?: string } | null) => {
                if (j?.realtimeToken) void client.realtime.setAuth(j.realtimeToken)
              })
              .catch(() => undefined)
          },
          Math.max(60_000, (ttlSeconds - 300) * 1000),
        )

        setTransport('supabase')
        cleanup.current = () => {
          clearInterval(renew)
          void client.removeChannel(channel)
        }
        return
      }

      const source = new EventSource(`/api/world/stream?as=${role}`)
      source.onmessage = (e) => accept(JSON.parse(e.data) as WorldSnapshot)
      setTransport('sse')
      cleanup.current = () => source.close()
    },
    [accept, role],
  )

  const refresh = useCallback(async () => {
    // 입구(/)처럼 역할이 없는 화면은 세계를 잡지 않는다.
    if (!role) {
      setLoading(false)
      setNeedsEntry(false)
      return
    }
    setLoading(true)
    const res = await fetch(`/api/world?as=${role}`, { cache: 'no-store' })

    if (res.status === 401 || res.status === 404) {
      cleanup.current?.()
      cleanup.current = null
      version.current = 0
      setWorld(null)
      setIdentity(null)
      setNeedsEntry(true)
      setLoading(false)
      return
    }

    const json = (await res.json()) as {
      snapshot: WorldSnapshot
      transport: 'supabase' | 'local'
      identity: ClientIdentity
      realtimeToken: string | null
      realtimeTtlSeconds: number
    }
    version.current = 0
    accept(json.snapshot)
    setIdentity(json.identity)
    setNeedsEntry(false)
    setLoading(false)
    await connect(json.identity.villageId, json.transport, json.realtimeToken, json.realtimeTtlSeconds ?? 3600)
  }, [accept, connect, role])

  useEffect(() => {
    void refresh()
    return () => {
      cleanup.current?.()
      cleanup.current = null
    }
    // 역할이 바뀌면(다른 화면으로 이동) 다시 잡는다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role])

  const dispatch = useCallback(
    async (action: Action) => {
      const res = await fetch(`/api/world?as=${role}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(action),
      })

      if (res.status === 401) {
        setNeedsEntry(true)
        return '다시 입장해 주세요'
      }

      const json = (await res.json()) as { snapshot?: WorldSnapshot; note?: string; error?: string }
      if (json.snapshot) accept(json.snapshot)
      const message = json.note ?? json.error
      if (message) say(message)
      return message
    },
    [accept, say, role],
  )

  const me = useMemo(() => {
    if (!world || !identity?.code) return null
    return world.mallangs.find((m) => m.code === identity.code) ?? null
  }, [world, identity])

  const value = useMemo<WorldContextValue>(
    () => ({ world, identity, role, needsEntry, loading, transport, dispatch, note, say, me, refresh }),
    [world, identity, role, needsEntry, loading, transport, dispatch, note, say, me, refresh],
  )

  return <WorldContext.Provider value={value}>{children}</WorldContext.Provider>
}

export function useWorld(): WorldContextValue {
  const ctx = useContext(WorldContext)
  if (!ctx) throw new Error('useWorld must be used inside WorldProvider')
  return ctx
}

/** 시간 파생값을 위한 공용 틱. 상태는 서버에서 오고 시계만 로컬에서 돈다. */
export function useNow(intervalMs = 250): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])
  return now
}
