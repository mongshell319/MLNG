import { NextResponse } from 'next/server'
import { cookieNameFor, cookieOptions, newMallangCode, sign } from '@/lib/server/auth'
import { getRegistry, ensureDemoClass } from '@/lib/server/registry'
import { getStore } from '@/lib/server/store'
import { LIMITS, available, clientKey, take } from '@/lib/server/ratelimit'
import { BODY_TINTS } from '@/lib/domain/master'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * 학생 입장.
 *
 * 두 갈래다.
 *   이어받기 — 말랑 코드를 대면 그 말랑이가 된다
 *   새로 만들기 — 이름과 몸색만 받는다. 실명도 이메일도 받지 않는다 (§3-5)
 *
 * 어느 쪽이든 코드는 여기서 한 번만 오가고, 이후에는 서명 쿠키만 쓴다.
 */
/** 클래스 코드가 어느 마을인지만 알려 준다. 입장 화면이 마을 이름을 부르기 위해서다. */
export async function GET(req: Request) {
  if (!take(`enterlook:${clientKey(req)}`, LIMITS.enter)) {
    return NextResponse.json({ error: '조금 뒤에 다시 해 주세요' }, { status: 429 })
  }
  const classCode = (new URL(req.url).searchParams.get('class') ?? '').toUpperCase().trim()
  if (classCode.length !== 6) return NextResponse.json({ error: '코드 6자리를 입력해주세요' }, { status: 400 })

  await ensureDemoClass()
  const ref = await getRegistry().byCode(classCode)
  if (!ref) return NextResponse.json({ error: '그 코드의 마을을 찾지 못했어요' }, { status: 404 })

  return NextResponse.json({ villageName: ref.villageName, hallName: ref.hallName })
}

export async function POST(req: Request) {
  const ip = clientKey(req)
  // 정상 입장은 넉넉히, 틀린 코드는 좁게. 한 교실이 IP 하나로 들어오기 때문이다.
  if (!take(`enter:${ip}`, LIMITS.enter)) {
    return NextResponse.json({ error: '조금 뒤에 다시 해 주세요' }, { status: 429 })
  }
  const failKey = `enterfail:${ip}`
  if (!available(failKey, LIMITS.enterFail)) {
    return NextResponse.json({ error: '조금 뒤에 다시 해 주세요' }, { status: 429 })
  }
  const miss = () => void take(failKey, LIMITS.enterFail)

  const body = (await req.json().catch(() => null)) as {
    classCode?: string
    mallangCode?: string
    name?: string
    bodyColor?: string
  } | null
  if (!body) return NextResponse.json({ error: 'unreadable' }, { status: 400 })

  const classCode = (body.classCode ?? '').toUpperCase().trim()
  if (classCode.length !== 6) return NextResponse.json({ error: '코드 6자리를 입력해주세요' }, { status: 400 })

  await ensureDemoClass()
  const ref = await getRegistry().byCode(classCode)
  if (!ref) {
    miss()
    return NextResponse.json({ error: '그 코드의 마을을 찾지 못했어요' }, { status: 404 })
  }

  const store = getStore()
  const world = await store.read(ref.villageId)
  if (!world) return NextResponse.json({ error: '마을을 찾지 못했어요' }, { status: 404 })

  // ── 이어받기 ────────────────────────────────────────
  if (body.mallangCode) {
    const code = body.mallangCode.toUpperCase().trim()
    const found = world.mallangs.find((m) => m.code === code)
    if (!found) {
      miss()
      return NextResponse.json({ error: '그 코드의 말랑이를 아직 못 찾았어요' }, { status: 404 })
    }

    const res = NextResponse.json({ ok: true, code: found.code, name: found.name })
    res.cookies.set(
      cookieNameFor('student'),
      sign({ kind: 'student', villageId: ref.villageId, hallId: found.hallId, code: found.code }),
      cookieOptions(),
    )
    return res
  }

  // ── 새로 만들기 ─────────────────────────────────────
  const name = (body.name ?? '').trim().slice(0, 8)
  if (!name) return NextResponse.json({ error: '이름을 지어 주세요' }, { status: 400 })

  // 몸색은 6틴트 중에서만. 클라이언트가 임의의 값을 넣지 못하게 한다.
  const bodyColor = BODY_TINTS.includes(body.bodyColor ?? '') ? body.bodyColor! : BODY_TINTS[0]

  let code = newMallangCode()
  for (let i = 0; i < 5 && world.mallangs.some((m) => m.code === code); i++) code = newMallangCode()

  const { snapshot } = await store.dispatch(ref.villageId, {
    type: 'mallang.create',
    id: `m-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`,
    code,
    name,
    bodyColor,
    hallId: ref.hallId,
    at: new Date().toISOString(),
  })

  const created = snapshot.mallangs.find((m) => m.code === code)
  if (!created) return NextResponse.json({ error: '지금은 새 주민을 받지 못했어요' }, { status: 409 })

  const res = NextResponse.json({ ok: true, code: created.code, name: created.name })
  res.cookies.set(
    cookieNameFor('student'),
    sign({ kind: 'student', villageId: ref.villageId, hallId: created.hallId, code: created.code }),
    cookieOptions(),
  )
  return res
}
