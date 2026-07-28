import { NextResponse } from 'next/server'
import {
  COOKIE_NAME,
  SCREEN_TOKEN_TTL_MS,
  cookieOptions,
  currentIdentity,
  screenToken,
  sign,
  verifyScreenToken,
} from '@/lib/server/auth'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * 교실 TV 입장.
 *
 * TV는 교사와 다른 기기인 경우가 대부분이라 쿠키를 나눠 가질 수 없다.
 * 그래서 GM이 짧은 토큰을 만들고(POST), TV가 그 링크를 한 번 열어(GET) 쿠키로 바꾼다.
 * 토큰 수명은 10분이라 화면에 띄워 둔 주소가 오래 살아남지 않는다.
 */
export async function POST() {
  const identity = await currentIdentity()
  if (!identity || identity.kind !== 'gm') {
    return NextResponse.json({ error: 'GM만 만들 수 있어요' }, { status: 403 })
  }
  const token = screenToken(identity.villageId)
  return NextResponse.json({ token, ttlMinutes: Math.round(SCREEN_TOKEN_TTL_MS / 60000) })
}

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get('t') ?? undefined
  const identity = verifyScreenToken(token)
  if (!identity) {
    return NextResponse.redirect(new URL('/screen?expired=1', req.url))
  }
  const res = NextResponse.redirect(new URL('/screen', req.url))
  res.cookies.set(COOKIE_NAME, sign(identity), cookieOptions())
  return res
}
