'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { Action } from '@/lib/domain/actions'
import type { Mallang, WorldSnapshot } from '@/lib/domain/types'

/**
 * 세 클라이언트가 같은 세계를 본다.
 *
 * 구독은 Supabase Realtime(설정된 경우) 또는 SSE. 어느 쪽도 폴링하지 않는다 —
 * "C1의 실시간감이 서비스의 본체"라는 요구가 여기에 걸려 있다.
 */

const VILLAGE = 'v-1'

interface WorldContextValue {
  world: WorldSnapshot | null
  transport: 'supabase' | 'sse' | 'connecting'
  dispatch: (action: Action) => Promise<string | undefined>
  note: string
  say: (msg: string) => void
  me: Mallang | null
  setMyCode: (code: string | null) => void
  myCode: string | null
}

const WorldContext = createContext<WorldContextValue | null>(null)

const CODE_KEY = 'mallang.code'

export function WorldProvider({ children }: { children: React.ReactNode }) {
  const [world, setWorld] = useState<WorldSnapshot | null>(null)
  const [transport, setTransport] = useState<'supabase' | 'sse' | 'connecting'>('connecting')
  const [note, setNote] = useState('')
  const [myCode, setMyCodeState] = useState<string | null>(null)
  const noteTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const version = useRef(0)

  const accept = useCallback((next: WorldSnapshot) => {
    // 늦게 도착한 스냅샷이 최신 상태를 되돌리지 않게 한다.
    if (next.version < version.current) return
    version.current = next.version
    setWorld(next)
  }, [])

  useEffect(() => {
    setMyCodeState(localStorage.getItem(CODE_KEY))
  }, [])

  useEffect(() => {
    let cancelled = false
    let cleanup: (() => void) | undefined

    ;(async () => {
      const res = await fetch(`/api/world?village=${VILLAGE}`, { cache: 'no-store' })
      const json = (await res.json()) as { snapshot: WorldSnapshot; transport: 'supabase' | 'local' }
      if (cancelled) return
      accept(json.snapshot)

      const url = process.env.NEXT_PUBLIC_SUPABASE_URL
      const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (json.transport === 'supabase' && url && anon) {
        const { createClient } = await import('@supabase/supabase-js')
        const client = createClient(url, anon)
        const channel = client
          .channel(`world:${VILLAGE}`)
          .on(
            'postgres_changes',
            { event: 'UPDATE', schema: 'public', table: 'worlds', filter: `village_id=eq.${VILLAGE}` },
            (payload) => accept((payload.new as { snapshot: WorldSnapshot }).snapshot),
          )
          .subscribe()
        setTransport('supabase')
        cleanup = () => {
          void client.removeChannel(channel)
        }
        return
      }

      const source = new EventSource(`/api/world/stream?village=${VILLAGE}`)
      source.onmessage = (e) => accept(JSON.parse(e.data) as WorldSnapshot)
      setTransport('sse')
      cleanup = () => source.close()
    })()

    return () => {
      cancelled = true
      cleanup?.()
    }
  }, [accept])

  const say = useCallback((msg: string) => {
    if (!msg) return
    setNote(msg)
    if (noteTimer.current) clearTimeout(noteTimer.current)
    noteTimer.current = setTimeout(() => setNote(''), 2600)
  }, [])

  const dispatch = useCallback(
    async (action: Action) => {
      const res = await fetch(`/api/world?village=${VILLAGE}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(action),
      })
      const json = (await res.json()) as { snapshot: WorldSnapshot; note?: string }
      if (json.snapshot) accept(json.snapshot)
      if (json.note) say(json.note)
      return json.note
    },
    [accept, say],
  )

  const setMyCode = useCallback((code: string | null) => {
    if (code) localStorage.setItem(CODE_KEY, code)
    else localStorage.removeItem(CODE_KEY)
    setMyCodeState(code)
  }, [])

  const me = useMemo(() => {
    if (!world) return null
    return world.mallangs.find((m) => m.code === myCode) ?? null
  }, [world, myCode])

  const value = useMemo<WorldContextValue>(
    () => ({ world, transport, dispatch, note, say, me, setMyCode, myCode }),
    [world, transport, dispatch, note, say, me, setMyCode, myCode],
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
