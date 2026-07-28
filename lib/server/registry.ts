import { promises as fs } from 'node:fs'
import path from 'node:path'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * 클래스 코드 장부.
 *
 * 마을은 여럿이다. 어느 브라우저가 어느 마을로 들어갈지는 클래스 코드가 정한다.
 * 세계 상태(worlds)와 분리해 두는 이유는, 코드 조회가 "아직 신원이 없는" 요청에서
 * 일어나기 때문이다. 세계를 통째로 읽지 않고 이 표만 본다.
 */

export interface ClassRef {
  classCode: string
  villageId: string
  hallId: string
  villageName: string
  hallName: string
  teacherPinHash: string
  createdAt: string
}

export interface Registry {
  byCode(classCode: string): Promise<ClassRef | null>
  create(ref: ClassRef): Promise<void>
  /** 같은 마을에 상회를 하나 더 여는 경우 */
  addHall(classCode: string, hallId: string, hallName: string, teacherPinHash: string): Promise<ClassRef | null>
}

const DATA_DIR = process.env.MLNG_DATA_DIR ?? path.join(process.cwd(), '.data')
const FILE = path.join(DATA_DIR, 'registry.json')

const g = globalThis as unknown as { __mallangRegistry?: Map<string, ClassRef> }

async function loadLocal(): Promise<Map<string, ClassRef>> {
  if (g.__mallangRegistry) return g.__mallangRegistry
  let map = new Map<string, ClassRef>()
  try {
    const raw = await fs.readFile(FILE, 'utf8')
    map = new Map(Object.entries(JSON.parse(raw) as Record<string, ClassRef>))
  } catch {
    // 첫 실행
  }
  g.__mallangRegistry = map
  return map
}

async function saveLocal(map: Map<string, ClassRef>): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true })
    await fs.writeFile(FILE, JSON.stringify(Object.fromEntries(map)), 'utf8')
  } catch {
    // 메모리가 진실이고 파일은 편의다
  }
}

const localRegistry: Registry = {
  async byCode(classCode) {
    const map = await loadLocal()
    return map.get(classCode.toUpperCase()) ?? null
  },
  async create(ref) {
    const map = await loadLocal()
    map.set(ref.classCode.toUpperCase(), ref)
    await saveLocal(map)
  },
  async addHall(classCode, hallId, hallName, teacherPinHash) {
    const map = await loadLocal()
    const found = map.get(classCode.toUpperCase())
    if (!found) return null
    const next: ClassRef = { ...found, hallId, hallName, teacherPinHash }
    map.set(next.classCode, next)
    await saveLocal(map)
    return next
  },
}

function serviceClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false } })
}

function rowToRef(r: Record<string, unknown>): ClassRef {
  return {
    classCode: r.class_code as string,
    villageId: r.village_id as string,
    hallId: r.hall_id as string,
    villageName: r.village_name as string,
    hallName: r.hall_name as string,
    teacherPinHash: r.teacher_pin_hash as string,
    createdAt: r.created_at as string,
  }
}

function makeSupabaseRegistry(client: SupabaseClient): Registry {
  return {
    async byCode(classCode) {
      const { data, error } = await client
        .from('classes')
        .select('*')
        .eq('class_code', classCode.toUpperCase())
        .maybeSingle()
      if (error) throw new Error(`class lookup failed: ${error.message}`)
      return data ? rowToRef(data) : null
    },
    async create(ref) {
      const { error } = await client.from('classes').insert({
        class_code: ref.classCode.toUpperCase(),
        village_id: ref.villageId,
        hall_id: ref.hallId,
        village_name: ref.villageName,
        hall_name: ref.hallName,
        teacher_pin_hash: ref.teacherPinHash,
      })
      if (error) throw new Error(`class create failed: ${error.message}`)
    },
    async addHall(classCode, hallId, hallName, teacherPinHash) {
      const { data, error } = await client
        .from('classes')
        .update({ hall_id: hallId, hall_name: hallName, teacher_pin_hash: teacherPinHash })
        .eq('class_code', classCode.toUpperCase())
        .select('*')
        .maybeSingle()
      if (error) throw new Error(`class update failed: ${error.message}`)
      return data ? rowToRef(data) : null
    },
  }
}

let registry: Registry | null = null

export function getRegistry(): Registry {
  if (registry) return registry
  const client = serviceClient()
  registry = client ? makeSupabaseRegistry(client) : localRegistry
  return registry
}

/**
 * 개발용 시연 교실.
 * Supabase가 붙어 있으면 만들지 않는다 — 실서비스에 고정 PIN을 두지 않기 위해서다.
 */
export const DEMO = {
  classCode: 'MLNG24',
  villageId: 'v-1',
  hallId: 'hall-1',
  pin: 'demo',
}

export async function ensureDemoClass(): Promise<ClassRef | null> {
  if (process.env.NODE_ENV === 'production') return null
  if (serviceClient()) return null

  const { getStore } = await import('./store')
  const store = getStore()

  const found = await localRegistry.byCode(DEMO.classCode)
  if (found) {
    // 장부는 있는데 세계가 없는 경우(.data 를 지운 뒤)도 되살린다.
    if (!(await store.read(found.villageId))) await createDemoWorld(found)
    return found
  }

  const { hashPin } = await import('./auth')
  const ref: ClassRef = {
    classCode: DEMO.classCode,
    villageId: DEMO.villageId,
    hallId: DEMO.hallId,
    villageName: '작은 말랑 마을',
    hallName: '기가 공작소',
    teacherPinHash: hashPin(DEMO.pin),
    createdAt: new Date().toISOString(),
  }
  await localRegistry.create(ref)
  await createDemoWorld(ref)
  return ref
}

async function createDemoWorld(ref: ClassRef): Promise<void> {
  const [{ getStore }, { seedWorld }] = await Promise.all([import('./store'), import('@/lib/domain/seed')])
  await getStore().create(
    ref.villageId,
    seedWorld({
      villageId: ref.villageId,
      villageName: ref.villageName,
      classCode: ref.classCode,
      hallId: ref.hallId,
      hallName: ref.hallName,
      subject: '기술·가정',
      demo: true,
    }),
  )
}
