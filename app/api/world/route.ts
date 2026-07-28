import { NextResponse } from 'next/server'
import type { Action } from '@/lib/domain/actions'
import { authorize } from '@/lib/domain/authz'
import { currentIdentity, roleFromRequest } from '@/lib/server/auth'
import { getStore } from '@/lib/server/store'
import { LIMITS, take } from '@/lib/server/ratelimit'
import { mintRealtimeToken, realtimeTokenTtlSeconds } from '@/lib/server/realtimeToken'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/** 세션을 통째로 움직이는 액션은 더 좁은 한도를 쓴다. */
const HEAVY = new Set<Action['type']>([
  'session.open',
  'session.settle',
  'session.after',
  'session.night',
  'session.finale',
  'session.reset',
  'crisis.start',
  'verify.approveAll',
])

export async function GET(req: Request) {
  const identity = await currentIdentity(roleFromRequest(req))
  if (!identity) return NextResponse.json({ error: '입장이 필요해요' }, { status: 401 })

  const snapshot = await getStore().read(identity.villageId)
  if (!snapshot) return NextResponse.json({ error: '마을을 찾지 못했어요' }, { status: 404 })

  // 브라우저가 Realtime 을 구독할 때 쓸 토큰. 이 마을에만 유효하다.
  const realtimeToken = getStore().kind === 'supabase' ? mintRealtimeToken(identity) : null

  return NextResponse.json(
    {
      snapshot,
      transport: getStore().kind,
      identity: {
        kind: identity.kind,
        villageId: identity.villageId,
        code: identity.kind === 'student' ? identity.code : undefined,
      },
      realtimeToken,
      realtimeTtlSeconds: realtimeTokenTtlSeconds(),
    },
    { headers: { 'cache-control': 'no-store' } },
  )
}

export async function POST(req: Request) {
  const identity = await currentIdentity(roleFromRequest(req))
  if (!identity) return NextResponse.json({ error: '입장이 필요해요' }, { status: 401 })

  let action: Action
  try {
    action = (await req.json()) as Action
  } catch {
    return NextResponse.json({ error: 'unreadable action' }, { status: 400 })
  }
  if (!action || typeof action.type !== 'string') {
    return NextResponse.json({ error: 'unknown action' }, { status: 400 })
  }

  const heavy = HEAVY.has(action.type)
  const who = identity.kind === 'student' ? identity.code : identity.kind
  if (!take(`${identity.villageId}:${who}:${heavy ? 'heavy' : 'light'}`, heavy ? LIMITS.session : LIMITS.action)) {
    return NextResponse.json({ error: '조금 천천히 해 주세요' }, { status: 429 })
  }

  const store = getStore()
  const snapshot = await store.read(identity.villageId)
  if (!snapshot) return NextResponse.json({ error: '마을을 찾지 못했어요' }, { status: 404 })

  // 권한은 리듀서 밖에서 본다. 리듀서는 "무슨 일이 일어나는가"만 안다.
  const verdict = authorize(action, identity, snapshot)
  if (!verdict.ok) return NextResponse.json({ error: verdict.reason }, { status: verdict.status })

  const result = await store.dispatch(identity.villageId, action)
  return NextResponse.json(
    { snapshot: result.snapshot, note: result.note },
    { headers: { 'cache-control': 'no-store' } },
  )
}
