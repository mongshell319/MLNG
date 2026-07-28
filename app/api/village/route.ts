import { NextResponse } from 'next/server'
import { cookieNameFor, cookieOptions, hashPin, newClassCode, sign } from '@/lib/server/auth'
import { getRegistry } from '@/lib/server/registry'
import { getStore } from '@/lib/server/store'
import { LIMITS, clientKey, take } from '@/lib/server/ratelimit'
import { seedWorld } from '@/lib/domain/seed'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * 새 마을 세우기 (T1 온보딩 1단계).
 *
 * 교사의 회원가입에 해당하지만 이메일을 받지 않는다. 클래스 코드와 PIN 한 쌍이
 * 그 마을의 GM 자격이다. 만들어진 마을은 빈 터에서 시작하고 학생은 아직 없다.
 */
export async function POST(req: Request) {
  if (!take(`village:${clientKey(req)}`, LIMITS.enter)) {
    return NextResponse.json({ error: '조금 뒤에 다시 해 주세요' }, { status: 429 })
  }

  const body = (await req.json().catch(() => null)) as {
    villageName?: string
    hallName?: string
    subject?: string
    pin?: string
  } | null
  if (!body) return NextResponse.json({ error: 'unreadable' }, { status: 400 })

  const villageName = (body.villageName ?? '').trim().slice(0, 20) || '작은 말랑 마을'
  const hallName = (body.hallName ?? '').trim().slice(0, 20) || '공작소'
  const subject = (body.subject ?? '').trim().slice(0, 20) || '공통'
  const pin = (body.pin ?? '').trim()

  if (pin.length < 4) {
    return NextResponse.json({ error: 'PIN은 네 자 이상으로 정해 주세요' }, { status: 400 })
  }

  const registry = getRegistry()
  const store = getStore()

  // 코드 충돌은 사실상 없지만, 부딪히면 조용히 다시 뽑는다.
  let classCode = newClassCode()
  for (let i = 0; i < 5 && (await registry.byCode(classCode)); i++) classCode = newClassCode()
  if (await registry.byCode(classCode)) {
    return NextResponse.json({ error: '지금은 코드를 만들지 못했어요' }, { status: 503 })
  }

  const villageId = `v-${classCode.toLowerCase()}`
  const hallId = `hall-${classCode.toLowerCase()}-1`

  await store.create(
    villageId,
    seedWorld({ villageId, villageName, classCode, hallId, hallName, subject, demo: false }),
  )
  await registry.create({
    classCode,
    villageId,
    hallId,
    villageName,
    hallName,
    teacherPinHash: hashPin(pin),
    createdAt: new Date().toISOString(),
  })

  const res = NextResponse.json({ ok: true, classCode, villageName, hallName })
  res.cookies.set(cookieNameFor('gm'), sign({ kind: 'gm', villageId, hallId }), cookieOptions())
  return res
}
