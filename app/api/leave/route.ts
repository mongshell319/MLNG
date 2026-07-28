import { NextResponse } from 'next/server'
import { COOKIE_NAMES, type Role } from '@/lib/server/auth'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * 나가기. 공용 태블릿에서 다음 사람에게 넘길 때 쓴다.
 * as= 를 주면 그 역할만, 없으면 전부 비운다.
 */
export async function POST(req: Request) {
  const as = new URL(req.url).searchParams.get('as')
  const targets: Role[] =
    as === 'student' || as === 'gm' || as === 'screen' ? [as] : (['student', 'gm', 'screen'] as Role[])

  const res = NextResponse.json({ ok: true })
  for (const kind of targets) res.cookies.set(COOKIE_NAMES[kind], '', { path: '/', maxAge: 0 })
  return res
}
