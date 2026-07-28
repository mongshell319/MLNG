import { promises as fs } from 'node:fs'
import path from 'node:path'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { applyAction, type Action } from '@/lib/domain/actions'
import { seedWorld } from '@/lib/domain/seed'
import type { WorldSnapshot } from '@/lib/domain/types'

/**
 * 세계 상태 저장소.
 *
 * 세 클라이언트가 하나의 상태를 공유해야 하고, C1의 실시간감이 서비스의 본체이므로
 * 저장소는 (1) 한 번의 원자적 커밋과 (2) 변경 구독, 두 가지만 책임진다.
 *
 *  · SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 가 있으면 Supabase 어댑터.
 *    worlds 테이블의 jsonb 한 행이 마을 하나이고, 클라이언트는 그 행의
 *    postgres_changes 를 구독한다 (폴링 금지 — handoff §데이터 페칭).
 *  · 없으면 로컬 어댑터. 파일에 얹힌 인메모리 상태 + SSE 로 같은 계약을 만족한다.
 *    개발·시연에서 Supabase 프로젝트 없이도 세 화면이 실제로 함께 움직인다.
 */

export interface WorldStore {
  readonly kind: 'supabase' | 'local'
  read(villageId: string): Promise<WorldSnapshot>
  dispatch(villageId: string, action: Action): Promise<{ snapshot: WorldSnapshot; note?: string }>
  /** 서버 내부 구독 (로컬 어댑터의 SSE 용). Supabase 어댑터는 클라이언트가 직접 구독한다. */
  subscribe?(villageId: string, cb: (s: WorldSnapshot) => void): () => void
}

export const DEFAULT_VILLAGE = 'v-1'

// ─────────────────────────────────────────────────────────
// 로컬 어댑터
// ─────────────────────────────────────────────────────────

const DATA_DIR = path.join(process.cwd(), '.data')

interface LocalState {
  worlds: Map<string, WorldSnapshot>
  listeners: Map<string, Set<(s: WorldSnapshot) => void>>
  queue: Promise<unknown>
}

// dev 서버의 모듈 리로드를 넘겨서 상태를 유지한다.
const g = globalThis as unknown as { __mallang?: LocalState }
const local: LocalState = (g.__mallang ??= { worlds: new Map(), listeners: new Map(), queue: Promise.resolve() })

async function loadFromDisk(villageId: string): Promise<WorldSnapshot | null> {
  try {
    const raw = await fs.readFile(path.join(DATA_DIR, `${villageId}.json`), 'utf8')
    return JSON.parse(raw) as WorldSnapshot
  } catch {
    return null
  }
}

async function saveToDisk(villageId: string, snapshot: WorldSnapshot): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true })
    await fs.writeFile(path.join(DATA_DIR, `${villageId}.json`), JSON.stringify(snapshot), 'utf8')
  } catch {
    // 디스크에 못 써도 세계는 계속 돈다. 메모리가 진실이고 파일은 편의다.
  }
}

function emit(villageId: string, snapshot: WorldSnapshot) {
  for (const cb of local.listeners.get(villageId) ?? []) cb(snapshot)
}

const localStore: WorldStore = {
  kind: 'local',

  async read(villageId) {
    const cached = local.worlds.get(villageId)
    if (cached) return cached
    const disk = await loadFromDisk(villageId)
    const snapshot = disk ?? seedWorld()
    local.worlds.set(villageId, snapshot)
    if (!disk) void saveToDisk(villageId, snapshot)
    return snapshot
  },

  async dispatch(villageId, action) {
    // 액션을 직렬화해서 두 클라이언트가 동시에 눌러도 버전이 어긋나지 않게 한다.
    const run = local.queue.then(async () => {
      const current = await localStore.read(villageId)
      const result = applyAction(current, action)
      local.worlds.set(villageId, result.snapshot)
      void saveToDisk(villageId, result.snapshot)
      emit(villageId, result.snapshot)
      return result
    })
    local.queue = run.catch(() => undefined)
    return run
  },

  subscribe(villageId, cb) {
    let set = local.listeners.get(villageId)
    if (!set) {
      set = new Set()
      local.listeners.set(villageId, set)
    }
    set.add(cb)
    return () => set!.delete(cb)
  },
}

// ─────────────────────────────────────────────────────────
// Supabase 어댑터
// ─────────────────────────────────────────────────────────

function serviceClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false } })
}

function makeSupabaseStore(client: SupabaseClient): WorldStore {
  return {
    kind: 'supabase',

    async read(villageId) {
      const { data, error } = await client
        .from('worlds')
        .select('snapshot')
        .eq('village_id', villageId)
        .maybeSingle()
      if (error) throw new Error(`world read failed: ${error.message}`)
      if (data?.snapshot) return data.snapshot as WorldSnapshot

      const fresh = seedWorld()
      await client.from('worlds').insert({ village_id: villageId, snapshot: fresh, version: fresh.version })
      return fresh
    },

    async dispatch(villageId, action) {
      // 낙관적 잠금 — 같은 순간 들어온 다른 전달을 덮어쓰지 않는다.
      for (let attempt = 0; attempt < 5; attempt++) {
        const current = await this.read(villageId)
        const result = applyAction(current, action)
        const { data, error } = await client
          .from('worlds')
          .update({ snapshot: result.snapshot, version: result.snapshot.version })
          .eq('village_id', villageId)
          .eq('version', current.version)
          .select('village_id')
        if (error) throw new Error(`world write failed: ${error.message}`)
        if (data && data.length > 0) return result
      }
      throw new Error('world write failed: too many concurrent writers')
    },
  }
}

let store: WorldStore | null = null

export function getStore(): WorldStore {
  if (store) return store
  const client = serviceClient()
  store = client ? makeSupabaseStore(client) : localStore
  return store
}

export function storeKind(): 'supabase' | 'local' {
  return getStore().kind
}
