/**
 * 토큰 버킷.
 *
 * 한 인스턴스 안에서만 센다. 서버리스에서 인스턴스가 여럿이면 실제 한도는
 * 인스턴스 수만큼 늘어난다 — 그래서 이걸 보안 경계로 삼지 않는다.
 * 권한 검사(authz)가 경계이고, 이건 실수나 폭주로 세계가 흔들리는 걸 막는 완충이다.
 * 더 엄한 한도가 필요해지면 Upstash 같은 공유 카운터로 바꾸면 된다.
 */

interface Bucket {
  tokens: number
  updatedAt: number
}

const g = globalThis as unknown as { __mallangBuckets?: Map<string, Bucket> }
const buckets: Map<string, Bucket> = (g.__mallangBuckets ??= new Map())

export interface Limit {
  /** 최대 보유 토큰 = 순간 최대 연속 요청 */
  burst: number
  /** 초당 회복량 */
  perSecond: number
}

export const LIMITS = {
  /** 전달·체크 같은 학생의 평상 조작 */
  action: { burst: 30, perSecond: 2 },
  /** 세션을 통째로 움직이는 것 — 오작동하면 교실이 흔들린다 */
  session: { burst: 8, perSecond: 0.5 },
  /**
   * 입장.
   *
   * 한 교실은 학교 NAT 뒤에서 IP 하나로 보인다. 스물여덟 명이 수업 시작 종과 함께
   * 동시에 들어오는 것이 정상이므로, 성공한 입장까지 조이면 서비스가 문 앞에서 막힌다.
   * 그래서 넉넉히 두고, 대신 아래 enterFail 이 "틀린 코드"만 따로 센다.
   */
  enter: { burst: 80, perSecond: 2 },
  /** 틀린 입장 시도만 소비한다. 코드 대입을 늦추는 건 이쪽 몫이다. */
  enterFail: { burst: 10, perSecond: 0.05 },
  /** 사진 업로드 */
  upload: { burst: 12, perSecond: 0.3 },
} satisfies Record<string, Limit>

/** 토큰을 쓰지 않고 남았는지만 본다. 실패했을 때만 소비하는 버킷에 쓴다. */
export function available(key: string, limit: Limit, now = Date.now()): boolean {
  const b = buckets.get(key)
  if (!b) return true
  return Math.min(limit.burst, b.tokens + ((now - b.updatedAt) / 1000) * limit.perSecond) >= 1
}

export function take(key: string, limit: Limit, now = Date.now()): boolean {
  const b = buckets.get(key)
  if (!b) {
    buckets.set(key, { tokens: limit.burst - 1, updatedAt: now })
    return true
  }
  const refilled = Math.min(limit.burst, b.tokens + ((now - b.updatedAt) / 1000) * limit.perSecond)
  if (refilled < 1) {
    b.tokens = refilled
    b.updatedAt = now
    return false
  }
  b.tokens = refilled - 1
  b.updatedAt = now

  // 오래된 버킷은 흘려 보낸다.
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) {
      if (now - v.updatedAt > 600_000) buckets.delete(k)
    }
  }
  return true
}

/** 신원이 없는 요청은 IP로 센다. 프록시 뒤에서는 첫 홉만 신뢰한다. */
export function clientKey(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0].trim()
  return req.headers.get('x-real-ip') ?? 'unknown'
}
