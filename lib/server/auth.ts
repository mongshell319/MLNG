import { createHmac, timingSafeEqual, randomBytes, scryptSync } from 'node:crypto'
import { cookies } from 'next/headers'

/**
 * 신원.
 *
 * 학생에게는 계정도 이메일도 실명도 없다 (§3-5). 그래서 인증의 주체는 사람이 아니라
 * "말랑 코드를 쥔 브라우저"다. 코드를 한 번 확인하고 서명 쿠키를 발급한 뒤로는
 * 모든 요청에서 그 쿠키만 본다. 코드가 URL이나 요청 본문으로 돌아다니지 않는다.
 *
 * 세 종류가 있다.
 *   student — 자기 말랑이에 관한 것만 할 수 있다
 *   gm      — 세션·검증·리모컨·시즌을 움직인다
 *   screen  — 교실 TV. 읽기 전용에 가깝고 자기 연출만 진행시킨다
 */

export type Identity =
  | { kind: 'student'; villageId: string; hallId: string; code: string }
  | { kind: 'gm'; villageId: string; hallId: string }
  | { kind: 'screen'; villageId: string }

export const COOKIE_NAME = 'mlng_id'
const MAX_AGE = 60 * 60 * 24 * 120 // 한 시즌

interface Payload {
  v: 1
  kind: Identity['kind']
  villageId: string
  hallId?: string
  code?: string
  iat: number
}

function secret(): string {
  const s = process.env.SESSION_SECRET
  if (s && s.length >= 32) return s
  if (process.env.NODE_ENV === 'production') {
    throw new Error('SESSION_SECRET (32자 이상)이 필요합니다. 쿠키 위조를 막는 유일한 값입니다.')
  }
  // 개발 편의용. 프로덕션에서는 위에서 막힌다.
  return 'mallang-dev-secret-do-not-use-in-production'
}

const b64u = {
  encode: (buf: Buffer) => buf.toString('base64url'),
  decode: (s: string) => Buffer.from(s, 'base64url'),
}

export function sign(identity: Identity): string {
  const payload: Payload = { v: 1, iat: Date.now(), ...identity }
  const body = b64u.encode(Buffer.from(JSON.stringify(payload)))
  const mac = createHmac('sha256', secret()).update(body).digest('base64url')
  return `${body}.${mac}`
}

function open(token: string | undefined, maxAgeMs: number): Payload | null {
  if (!token) return null
  const [body, mac] = token.split('.')
  if (!body || !mac) return null

  const expected = createHmac('sha256', secret()).update(body).digest('base64url')
  const a = Buffer.from(mac)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null

  try {
    const p = JSON.parse(b64u.decode(body).toString()) as Payload
    if (p.v !== 1) return null
    if (Date.now() - p.iat > maxAgeMs) return null
    return p
  } catch {
    return null
  }
}

function toIdentity(p: Payload | null): Identity | null {
  if (!p) return null
  if (p.kind === 'student') {
    if (!p.code || !p.hallId) return null
    return { kind: 'student', villageId: p.villageId, hallId: p.hallId, code: p.code }
  }
  if (p.kind === 'gm') {
    if (!p.hallId) return null
    return { kind: 'gm', villageId: p.villageId, hallId: p.hallId }
  }
  return { kind: 'screen', villageId: p.villageId }
}

export function verify(token: string | undefined): Identity | null {
  return toIdentity(open(token, MAX_AGE * 1000))
}

/**
 * 교실 TV에 건네는 짧은 토큰.
 * GM이 만들고 TV가 한 번 교환해서 쿠키로 바꾼다. URL에 실려 다니므로 수명을 짧게 둔다.
 */
export const SCREEN_TOKEN_TTL_MS = 10 * 60 * 1000

export function screenToken(villageId: string): string {
  return sign({ kind: 'screen', villageId })
}

export function verifyScreenToken(token: string | undefined): Identity | null {
  const p = open(token, SCREEN_TOKEN_TTL_MS)
  if (!p || p.kind !== 'screen') return null
  return toIdentity(p)
}

/** 서버 컴포넌트·라우트 핸들러에서 현재 신원을 읽는다. */
export async function currentIdentity(): Promise<Identity | null> {
  const jar = await cookies()
  return verify(jar.get(COOKIE_NAME)?.value)
}

export function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: MAX_AGE,
  }
}

// ─────────────────────────────────────────────────────────
// 교사 PIN
// ─────────────────────────────────────────────────────────

/** scrypt. 교사 PIN은 짧으므로 해시 비용을 낮추지 않는다. */
export function hashPin(pin: string): string {
  const salt = randomBytes(16)
  const key = scryptSync(pin.normalize('NFKC'), salt, 32)
  return `${salt.toString('base64url')}.${key.toString('base64url')}`
}

export function checkPin(pin: string, stored: string): boolean {
  const [saltB64, keyB64] = stored.split('.')
  if (!saltB64 || !keyB64) return false
  const key = scryptSync(pin.normalize('NFKC'), b64u.decode(saltB64), 32)
  const a = b64u.decode(keyB64)
  if (a.length !== key.length) return false
  return timingSafeEqual(a, key)
}

/** 클래스 코드 — 6자, 대문자. 헷갈리는 글자(I·O·0·1)를 뺀다. */
export function newClassCode(): string {
  const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const bytes = randomBytes(6)
  return Array.from(bytes, (b) => A[b % A.length]).join('')
}

export function newMallangCode(): string {
  const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const D = '23456789'
  const bytes = randomBytes(6)
  return (
    A[bytes[0] % A.length] +
    A[bytes[1] % A.length] +
    D[bytes[2] % D.length] +
    D[bytes[3] % D.length] +
    A[bytes[4] % A.length] +
    D[bytes[5] % D.length]
  )
}
