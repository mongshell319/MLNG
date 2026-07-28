import { promises as fs } from 'node:fs'
import path from 'node:path'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { applyAction, type Action } from '@/lib/domain/actions'
import type { WorldSnapshot } from '@/lib/domain/types'

/**
 * 세계 상태 저장소.
 *
 * 세 클라이언트가 하나의 상태를 공유해야 하고, C1의 실시간감이 서비스의 본체이므로
 * 저장소는 (1) 한 번의 원자적 커밋과 (2) 변경 구독, 두 가지만 책임진다.
 *
 *  · Supabase 어댑터 — worlds 테이블의 jsonb 한 행이 마을 하나다.
 *    클라이언트는 그 행의 postgres_changes 를 구독한다 (폴링 금지).
 *  · 로컬 어댑터 — 파일에 얹힌 인메모리 상태 + SSE. 계약이 같아서 개발·시연에서도
 *    세 화면이 실제로 함께 움직인다. 다만 인스턴스 하나에서만 성립하므로
 *    프로덕션에서는 아래 getStore()가 아예 뜨지 못하게 막는다.
 */

export interface WorldStore {
  readonly kind: 'supabase' | 'local'
  /** 없으면 null. 마을 생성은 명시적으로 create 로만 한다. */
  read(villageId: string): Promise<WorldSnapshot | null>
  create(villageId: string, snapshot: WorldSnapshot): Promise<WorldSnapshot>
  /**
   * 스냅샷을 통째로 갈아 끼우고 구독자에게 알린다.
   * 리듀서를 거치지 않는 유일한 경로라서 시연 도구(app/api/dev)에서만 쓴다.
   */
  overwrite(villageId: string, snapshot: WorldSnapshot): Promise<WorldSnapshot>
  dispatch(villageId: string, action: Action): Promise<{ snapshot: WorldSnapshot; note?: string }>
  /** 서버 내부 구독 (로컬 어댑터의 SSE 용). Supabase 어댑터는 클라이언트가 직접 구독한다. */
  subscribe?(villageId: string, cb: (s: WorldSnapshot) => void): () => void
}

// ─────────────────────────────────────────────────────────
// 로컬 어댑터
// ─────────────────────────────────────────────────────────

// 단일 인스턴스 배포에서는 영구 디스크를 여기에 마운트한다.
const DATA_DIR = process.env.MLNG_DATA_DIR ?? path.join(process.cwd(), '.data')

interface LocalState {
  worlds: Map<string, WorldSnapshot>
  listeners: Map<string, Set<(s: WorldSnapshot) => void>>
  queue: Promise<unknown>
}

// dev 서버의 모듈 리로드를 넘겨서 상태를 유지한다.
const g = globalThis as unknown as { __mallang?: LocalState }
const local: LocalState = (g.__mallang ??= { worlds: new Map(), listeners: new Map(), queue: Promise.resolve() })

function fileFor(villageId: string): string {
  // villageId 는 서버가 만든 값이지만, 경로 조작 가능성을 원천 차단한다.
  return path.join(DATA_DIR, `${villageId.replace(/[^a-zA-Z0-9_-]/g, '')}.json`)
}

async function loadFromDisk(villageId: string): Promise<WorldSnapshot | null> {
  try {
    return JSON.parse(await fs.readFile(fileFor(villageId), 'utf8')) as WorldSnapshot
  } catch {
    return null
  }
}

async function saveToDisk(villageId: string, snapshot: WorldSnapshot): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true })
    await fs.writeFile(fileFor(villageId), JSON.stringify(snapshot), 'utf8')
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
    if (disk) local.worlds.set(villageId, disk)
    return disk
  },

  async create(villageId, snapshot) {
    local.worlds.set(villageId, snapshot)
    await saveToDisk(villageId, snapshot)
    return snapshot
  },

  async overwrite(villageId, snapshot) {
    local.worlds.set(villageId, snapshot)
    await saveToDisk(villageId, snapshot)
    emit(villageId, snapshot)
    return snapshot
  },

  async dispatch(villageId, action) {
    // 액션을 직렬화해서 두 클라이언트가 동시에 눌러도 버전이 어긋나지 않게 한다.
    const run = local.queue.then(async () => {
      const current = await localStore.read(villageId)
      if (!current) throw new Error(`village not found: ${villageId}`)
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

export function serviceClient(): SupabaseClient | null {
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
      return (data?.snapshot as WorldSnapshot | undefined) ?? null
    },

    async create(villageId, snapshot) {
      const { error } = await client
        .from('worlds')
        .insert({ village_id: villageId, snapshot, version: snapshot.version })
      if (error) throw new Error(`world create failed: ${error.message}`)
      return snapshot
    },

    async overwrite(villageId, snapshot) {
      const { error } = await client
        .from('worlds')
        .update({ snapshot, version: snapshot.version })
        .eq('village_id', villageId)
      if (error) throw new Error(`world overwrite failed: ${error.message}`)
      return snapshot
    },

    async dispatch(villageId, action) {
      // 낙관적 잠금 — 같은 순간 들어온 다른 전달을 덮어쓰지 않는다.
      for (let attempt = 0; attempt < 6; attempt++) {
        const current = await this.read(villageId)
        if (!current) throw new Error(`village not found: ${villageId}`)
        const result = applyAction(current, action)
        const { data, error } = await client
          .from('worlds')
          .update({ snapshot: result.snapshot, version: result.snapshot.version })
          .eq('village_id', villageId)
          .eq('version', current.version)
          .select('village_id')
        if (error) throw new Error(`world write failed: ${error.message}`)
        if (data && data.length > 0) {
          void client
            .from('world_events')
            .insert({ village_id: villageId, action, version: result.snapshot.version })
          return result
        }
        // 다른 전달이 먼저 들어갔다. 최신 상태 위에서 다시 적용한다.
        await new Promise((r) => setTimeout(r, 20 + attempt * 30))
      }
      throw new Error('world write failed: too many concurrent writers')
    },
  }
}

let store: WorldStore | null = null

export function getStore(): WorldStore {
  if (store) return store
  const client = serviceClient()
  if (!client) {
    // 파일 어댑터는 인스턴스 하나에서만 성립한다. 서버가 두 대 뜨는 순간
    // 세계가 조용히 갈라지므로, 프로덕션에서는 그 사실을 아는 사람만 켤 수 있게 한다.
    //
    // 켜도 되는 경우: 컨테이너 한 개 + 영구 디스크로 도는 배포(Render·Fly·Railway·자체 서버).
    //   한 학교 규모에서는 이쪽이 Supabase보다 단순하고, SSE로 실시간도 그대로 된다.
    // 켜면 안 되는 경우: Vercel 같은 서버리스. 요청마다 다른 인스턴스가 뜬다.
    const singleInstance = process.env.MLNG_SINGLE_INSTANCE === '1'
    if (process.env.NODE_ENV === 'production' && !singleInstance) {
      throw new Error(
        'Supabase 설정이 필요합니다 (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).\n' +
          '컨테이너 한 개로 운영한다면 MLNG_SINGLE_INSTANCE=1 을 두고 영구 디스크를 MLNG_DATA_DIR 에 마운트하세요.',
      )
    }
    if (singleInstance && process.env.NODE_ENV === 'production') {
      console.log(`[말랑스쿨] 단일 인스턴스 모드 · 세계 상태를 ${DATA_DIR} 에 둡니다. 인스턴스를 늘리지 마세요.`)
    }
    store = localStore
    return store
  }
  store = makeSupabaseStore(client)
  return store
}

export function storeKind(): 'supabase' | 'local' {
  return getStore().kind
}
