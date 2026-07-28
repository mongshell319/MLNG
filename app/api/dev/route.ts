import { NextResponse } from 'next/server'
import { cookieNameFor, cookieOptions, currentIdentity, sign } from '@/lib/server/auth'
import { devToolsEnabled } from '@/lib/server/devtools'
import { getStore } from '@/lib/server/store'
import { seedWorld } from '@/lib/domain/seed'
import type { ExpeditionType, WorldSnapshot } from '@/lib/domain/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * 시연용 조작.
 *
 * 여기서만 남의 말랑이 대신 눌러 준다. 스무 명이 전달하는 장면을 보려면
 * 브라우저 스무 개를 띄우는 수밖에 없는데, 그건 테스트가 아니라 노동이다.
 *
 * 권한 검사를 건너뛰므로 프로덕션에서는 꺼져 있다 (lib/server/devtools.ts).
 */

interface Body {
  op: 'deliver' | 'reset' | 'clearProgress' | 'asStudent'
  /** asStudent: 어느 말랑이가 될지. 없으면 아무나. */
  mallangCode?: string
  /** deliver: 몇 명이 전달할지 */
  count?: number
  /** deliver: GM 승인까지 할지 */
  approve?: boolean
  /** reset: 시연 데이터로 다시 채울지 */
  demo?: boolean
  expeditionType?: ExpeditionType
}

const PNG_1PX =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='

/** 시연 도구가 켜져 있는지, 켜져 있다면 시연 교실이 무엇인지. 인증 없이 볼 수 있다. */
export async function GET() {
  if (!devToolsEnabled()) return NextResponse.json({ enabled: false })
  const { DEMO } = await import('@/lib/server/registry')
  const { serviceClient } = await import('@/lib/server/store')
  // Supabase 를 붙이면 시연 교실을 만들지 않는다.
  const demo = serviceClient() ? null : { classCode: DEMO.classCode, pin: DEMO.pin }
  return NextResponse.json({ enabled: true, demo })
}

export async function POST(req: Request) {
  if (!devToolsEnabled()) {
    return NextResponse.json({ error: '시연 도구가 꺼져 있어요' }, { status: 404 })
  }
  const identity = await currentIdentity('gm')
  if (!identity) return NextResponse.json({ error: 'GM만 쓸 수 있어요' }, { status: 403 })

  const body = (await req.json().catch(() => null)) as Body | null
  if (!body?.op) return NextResponse.json({ error: 'op 가 필요해요' }, { status: 400 })

  const store = getStore()
  const at = () => new Date().toISOString()

  if (body.op === 'reset') {
    const current = await store.read(identity.villageId)
    const fresh = seedWorld({
      villageId: identity.villageId,
      villageName: current?.village.name ?? '작은 말랑 마을',
      classCode: current?.village.classCode ?? '',
      hallId: identity.hallId,
      hallName: current?.halls[0]?.name ?? '기가 공작소',
      subject: current?.halls[0]?.subject ?? '기술·가정',
      demo: body.demo ?? true,
    })
    // 로컬 어댑터는 덮어쓰고, Supabase 는 이미 있는 행을 갈아 끼운다.
    const snapshot = await store.overwrite(identity.villageId, {
      ...fresh,
      version: (current?.version ?? 0) + 1,
    })
    return NextResponse.json({ ok: true, snapshot })
  }

  const world = await store.read(identity.villageId)
  if (!world) return NextResponse.json({ error: '마을을 찾지 못했어요' }, { status: 404 })

  if (body.op === 'asStudent') {
    // 입장 의식(게이트 → 색 → 이름)을 매번 거치지 않고 바로 학생이 된다.
    // 학생 쿠키만 건드리므로 GM 쿠키는 그대로 살아 있다.
    const wanted = body.mallangCode?.toUpperCase()
    const target = wanted ? world.mallangs.find((m) => m.code === wanted) : world.mallangs[0]
    if (!target) return NextResponse.json({ error: '그 말랑이를 찾지 못했어요' }, { status: 404 })

    const res = NextResponse.json({ ok: true, code: target.code, name: target.name })
    res.cookies.set(
      cookieNameFor('student'),
      sign({ kind: 'student', villageId: target.villageId, hallId: target.hallId, code: target.code }),
      cookieOptions(),
    )
    return res
  }

  if (body.op === 'clearProgress') {
    const cleared: WorldSnapshot = {
      ...world,
      progress: [],
      letters: [],
      session: { ...world.session, prog: 0, repairParts: Array(9).fill(null), hearts: [], spotlight: [] },
    }
    const snapshot = await store.overwrite(identity.villageId, { ...cleared, version: world.version + 1 })
    return NextResponse.json({ ok: true, snapshot })
  }

  // ── 전달 시뮬레이션 ────────────────────────────────
  const quest =
    world.quests.find((q) => q.kind === 'main' && !q.carriedOver) ?? world.quests.find((q) => q.kind === 'main')
  if (!quest) return NextResponse.json({ error: '전달할 의뢰가 없어요' }, { status: 404 })

  const already = new Set(
    world.progress.filter((p) => p.status !== 'open' && p.questId === quest.id).map((p) => p.mallangId),
  )
  const targets = world.mallangs.filter((m) => !already.has(m.id)).slice(0, Math.max(1, body.count ?? 8))

  let snapshot = world
  for (const m of targets) {
    for (const i of [0, 1, 2] as const) {
      ;({ snapshot } = await store.dispatch(identity.villageId, {
        type: 'quest.check',
        questId: quest.id,
        mallangId: m.id,
        index: i,
        value: true,
        at: at(),
      }))
    }
    // 복구형 원정이 구조물에 사진을 붙이는 걸 보려면 실제 파일이 있어야 한다.
    ;({ snapshot } = await store.dispatch(identity.villageId, {
      type: 'quest.photo',
      questId: quest.id,
      mallangId: m.id,
      photoUrl: await storeDemoPhoto(identity.villageId, m.id, quest.id),
      at: at(),
    }))
    ;({ snapshot } = await store.dispatch(identity.villageId, {
      type: 'quest.deliver',
      questId: quest.id,
      mallangId: m.id,
      at: at(),
    }))
  }

  if (body.approve) {
    ;({ snapshot } = await store.dispatch(identity.villageId, { type: 'verify.approveAll', at: at() }))
  }

  return NextResponse.json({ ok: true, delivered: targets.length, snapshot })
}

async function storeDemoPhoto(villageId: string, mallangId: string, questId: string): Promise<string> {
  const { promises: fs } = await import('node:fs')
  const path = await import('node:path')
  const key = `${villageId}/${mallangId}/${questId}-demo.png`
  const dir = process.env.MLNG_DATA_DIR ?? path.join(process.cwd(), '.data')
  const dest = path.join(dir, 'uploads', key)
  try {
    await fs.mkdir(path.dirname(dest), { recursive: true })
    await fs.writeFile(dest, Buffer.from(PNG_1PX, 'base64'))
  } catch {
    /* 못 써도 상태에는 경로가 실린다 */
  }
  return key
}
