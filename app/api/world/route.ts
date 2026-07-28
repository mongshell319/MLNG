import { NextResponse } from 'next/server'
import type { Action } from '@/lib/domain/actions'
import { DEFAULT_VILLAGE, getStore } from '@/lib/server/store'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(req: Request) {
  const villageId = new URL(req.url).searchParams.get('village') ?? DEFAULT_VILLAGE
  const snapshot = await getStore().read(villageId)
  return NextResponse.json({ snapshot, transport: getStore().kind }, { headers: { 'cache-control': 'no-store' } })
}

export async function POST(req: Request) {
  const villageId = new URL(req.url).searchParams.get('village') ?? DEFAULT_VILLAGE
  const action = (await req.json()) as Action
  if (!action || typeof action.type !== 'string') {
    return NextResponse.json({ error: 'unknown action' }, { status: 400 })
  }
  const { snapshot, note } = await getStore().dispatch(villageId, action)
  return NextResponse.json({ snapshot, note }, { headers: { 'cache-control': 'no-store' } })
}
