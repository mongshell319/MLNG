import { NextResponse } from 'next/server'
import {
  cookieNameFor,
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

  // 상대 경로로 보낸다.
  //
  // NextResponse.redirect 는 절대 URL을 요구하는데, 그 절대 URL은 req.url 에서 나온다.
  // 프록시 뒤(Codespaces·터널·리버스 프록시)에서는 req.url 이 내부 주소(localhost:3000)라서
  // TV가 자기 자신의 localhost 로 튕겨 나가고 교실 화면이 열리지 않는다.
  // 상대 Location 은 브라우저가 "자기가 요청한 주소" 기준으로 풀기 때문에 어디서든 맞다.
  const res = new NextResponse(null, {
    status: 307,
    headers: { location: identity ? '/screen' : '/screen?expired=1' },
  })
  if (identity) res.cookies.set(cookieNameFor('screen'), sign(identity), cookieOptions())
  return res
}
