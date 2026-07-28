import { NextResponse } from 'next/server'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { currentIdentity } from '@/lib/server/auth'
import { serviceClient } from '@/lib/server/store'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  heic: 'image/heic',
}

/**
 * 제출 사진 보기.
 *
 * 버킷은 비공개다. 같은 마을에 입장한 브라우저만 통과시킨다 —
 * 완성된 작품은 교실 TV(복구형 원정의 구조물 파츠)와 교사 검증함에 함께 걸리므로
 * 마을 단위가 이 사진들의 경계다.
 */
export async function GET(req: Request) {
  const identity = await currentIdentity()
  if (!identity) return new NextResponse('입장이 필요해요', { status: 401 })

  const key = new URL(req.url).searchParams.get('p') ?? ''
  // 경로 조작과 다른 마을 엿보기를 한 번에 막는다.
  if (!key || key.includes('..') || !key.startsWith(`${identity.villageId}/`)) {
    return new NextResponse('찾지 못했어요', { status: 404 })
  }

  const client = serviceClient()
  if (client) {
    const { data, error } = await client.storage.from('submissions').createSignedUrl(key, 60)
    if (error || !data) return new NextResponse('찾지 못했어요', { status: 404 })
    return NextResponse.redirect(data.signedUrl)
  }

  const file = path.join(process.cwd(), '.data', 'uploads', key)
  try {
    const bytes = await fs.readFile(file)
    const ext = key.split('.').pop() ?? 'jpg'
    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        'content-type': TYPES[ext] ?? 'application/octet-stream',
        'cache-control': 'private, max-age=60',
      },
    })
  } catch {
    return new NextResponse('찾지 못했어요', { status: 404 })
  }
}
