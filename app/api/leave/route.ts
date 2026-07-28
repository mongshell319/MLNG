import { NextResponse } from 'next/server'
import { COOKIE_NAME } from '@/lib/server/auth'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/** 나가기. 공용 태블릿에서 다음 사람에게 넘길 때 쓴다. */
export async function POST() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set(COOKIE_NAME, '', { path: '/', maxAge: 0 })
  return res
}
