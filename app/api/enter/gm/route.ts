import { NextResponse } from 'next/server'
import { COOKIE_NAME, checkPin, cookieOptions, sign } from '@/lib/server/auth'
import { ensureDemoClass, getRegistry } from '@/lib/server/registry'
import { LIMITS, clientKey, take } from '@/lib/server/ratelimit'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/** 교사 입장. 클래스 코드 + PIN. */
export async function POST(req: Request) {
  if (!take(`entergm:${clientKey(req)}`, LIMITS.enter)) {
    return NextResponse.json({ error: '조금 뒤에 다시 해 주세요' }, { status: 429 })
  }

  const body = (await req.json().catch(() => null)) as { classCode?: string; pin?: string } | null
  if (!body) return NextResponse.json({ error: 'unreadable' }, { status: 400 })

  const classCode = (body.classCode ?? '').toUpperCase().trim()
  const pin = body.pin ?? ''

  await ensureDemoClass()
  const ref = await getRegistry().byCode(classCode)

  // 코드가 없는 경우와 PIN이 틀린 경우를 구분해서 알려 주지 않는다.
  if (!ref || !checkPin(pin, ref.teacherPinHash)) {
    return NextResponse.json({ error: '코드나 PIN이 맞지 않아요' }, { status: 401 })
  }

  const res = NextResponse.json({ ok: true, villageName: ref.villageName, hallName: ref.hallName })
  res.cookies.set(COOKIE_NAME, sign({ kind: 'gm', villageId: ref.villageId, hallId: ref.hallId }), cookieOptions())
  return res
}
