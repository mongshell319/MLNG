import { createHmac } from 'node:crypto'
import type { Identity } from './auth'

/**
 * Supabase Realtime 용 토큰.
 *
 * 브라우저가 worlds 행을 구독하려면 Supabase 쪽에서도 신원이 있어야 한다.
 * anon 키로 열어 두면 RLS가 걸 것이 없어서 다른 학교의 세계까지 전부 구독된다.
 *
 * 그래서 우리 쿠키를 확인한 뒤, 그 마을에만 유효한 JWT를 서버가 발급한다.
 * RLS는 village_id 클레임 하나만 본다:
 *
 *   using (village_id = (auth.jwt() ->> 'village_id'))
 *
 * 토큰에는 마을 말고 아무것도 담지 않는다 — 말랑 코드도, 이름도 들어가지 않는다.
 */

const TTL_SECONDS = 60 * 60

function b64u(input: Buffer | string): string {
  return Buffer.from(input).toString('base64url')
}

export function realtimeTokenTtlSeconds(): number {
  return TTL_SECONDS
}

export function mintRealtimeToken(identity: Identity): string | null {
  const secret = process.env.SUPABASE_JWT_SECRET
  if (!secret) return null

  const now = Math.floor(Date.now() / 1000)
  const header = { alg: 'HS256', typ: 'JWT' }
  const payload = {
    // Supabase 는 이 role 로 RLS 정책을 고른다.
    role: 'authenticated',
    aud: 'authenticated',
    // 사람을 가리키는 값이 아니라 이 브라우저의 자리 표시다.
    sub: `${identity.kind}:${identity.villageId}`,
    village_id: identity.villageId,
    iat: now,
    exp: now + TTL_SECONDS,
  }

  const body = `${b64u(JSON.stringify(header))}.${b64u(JSON.stringify(payload))}`
  const mac = createHmac('sha256', secret).update(body).digest('base64url')
  return `${body}.${mac}`
}
