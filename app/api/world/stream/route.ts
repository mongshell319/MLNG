import { currentIdentity, roleFromRequest } from '@/lib/server/auth'
import { getStore } from '@/lib/server/store'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * 로컬 어댑터의 실시간 채널 (개발용).
 * Supabase를 붙이면 클라이언트가 postgres_changes 를 직접 구독하므로 이 경로는 쓰이지 않는다.
 * 어느 쪽이든 "폴링하지 않는다"는 계약은 같다.
 */
export async function GET(req: Request) {
  const identity = await currentIdentity(roleFromRequest(req))
  if (!identity) return new Response('입장이 필요해요', { status: 401 })

  const store = getStore()
  if (!store.subscribe) return new Response('stream not available for this store', { status: 501 })

  const villageId = identity.villageId
  const encoder = new TextEncoder()
  let unsubscribe: (() => void) | undefined
  let keepAlive: ReturnType<typeof setInterval> | undefined

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: unknown) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
        } catch {
          // 이미 닫힌 스트림
        }
      }

      const initial = await store.read(villageId)
      if (initial) send(initial)

      unsubscribe = store.subscribe!(villageId, send)
      keepAlive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': keep-alive\n\n'))
        } catch {
          /* noop */
        }
      }, 25_000)

      req.signal.addEventListener('abort', () => {
        unsubscribe?.()
        if (keepAlive) clearInterval(keepAlive)
        try {
          controller.close()
        } catch {
          /* noop */
        }
      })
    },
    cancel() {
      unsubscribe?.()
      if (keepAlive) clearInterval(keepAlive)
    },
  })

  return new Response(stream, {
    headers: {
      'content-type': 'text/event-stream; charset=utf-8',
      'cache-control': 'no-cache, no-transform',
      connection: 'keep-alive',
      'x-accel-buffering': 'no',
    },
  })
}
