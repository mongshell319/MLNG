import { NextResponse } from 'next/server'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { currentIdentity } from '@/lib/server/auth'
import { getStore, serviceClient } from '@/lib/server/store'
import { LIMITS, take } from '@/lib/server/ratelimit'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const MAX_BYTES = 6 * 1024 * 1024
const ALLOWED: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
}

/**
 * 제출 사진.
 *
 * 업로드와 상태 반영을 한 번에 한다. 클라이언트가 photoUrl 을 직접 정하게 두면
 * 임의의 외부 주소가 교실 TV와 교사 검증함에 그대로 렌더된다 — 그래서 경로는
 * 서버만 만든다. 상태에는 스토리지 경로만 실리고, 보기는 /api/photo 를 거친다.
 */
export async function POST(req: Request) {
  const identity = await currentIdentity()
  if (!identity || identity.kind !== 'student') {
    return NextResponse.json({ error: '학생만 올릴 수 있어요' }, { status: 403 })
  }
  if (!take(`upload:${identity.villageId}:${identity.code}`, LIMITS.upload)) {
    return NextResponse.json({ error: '조금 천천히 해 주세요' }, { status: 429 })
  }

  const form = await req.formData().catch(() => null)
  const file = form?.get('file')
  const questId = String(form?.get('questId') ?? '')
  if (!(file instanceof File) || !questId) {
    return NextResponse.json({ error: '사진을 찾지 못했어요' }, { status: 400 })
  }

  const ext = ALLOWED[file.type]
  if (!ext) return NextResponse.json({ error: '사진 파일만 올릴 수 있어요' }, { status: 415 })
  if (file.size > MAX_BYTES) return NextResponse.json({ error: '사진이 조금 커요' }, { status: 413 })

  const store = getStore()
  const world = await store.read(identity.villageId)
  if (!world) return NextResponse.json({ error: '마을을 찾지 못했어요' }, { status: 404 })

  const me = world.mallangs.find((m) => m.code === identity.code)
  if (!me) return NextResponse.json({ error: '말랑이를 찾지 못했어요' }, { status: 401 })
  if (!world.quests.some((q) => q.id === questId)) {
    return NextResponse.json({ error: '그 의뢰를 찾지 못했어요' }, { status: 404 })
  }

  const safeQuest = questId.replace(/[^a-zA-Z0-9_-]/g, '')
  const key = `${identity.villageId}/${me.id}/${safeQuest}-${Date.now()}.${ext}`
  const bytes = Buffer.from(await file.arrayBuffer())

  const client = serviceClient()
  if (client) {
    const { error } = await client.storage
      .from('submissions')
      .upload(key, bytes, { contentType: file.type, upsert: true })
    if (error) return NextResponse.json({ error: '사진을 저장하지 못했어요' }, { status: 502 })
  } else {
    const dest = path.join(process.env.MLNG_DATA_DIR ?? path.join(process.cwd(), '.data'), 'uploads', key)
    await fs.mkdir(path.dirname(dest), { recursive: true })
    await fs.writeFile(dest, bytes)
  }

  const { snapshot } = await store.dispatch(identity.villageId, {
    type: 'quest.photo',
    questId,
    mallangId: me.id,
    photoUrl: key,
    at: new Date().toISOString(),
  })

  return NextResponse.json({ ok: true, snapshot })
}
