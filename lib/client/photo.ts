import type { WorldSnapshot } from '@/lib/domain/types'

/**
 * 제출 사진.
 *
 * 상태에는 스토리지 경로만 실린다. 보기는 항상 /api/photo 를 거쳐
 * 같은 마을에 입장한 브라우저인지 확인한 뒤 짧은 서명 URL로 넘어간다.
 */
export function photoSrc(key: string | null | undefined): string | null {
  if (!key) return null
  return `/api/photo?p=${encodeURIComponent(key)}`
}

export interface UploadResult {
  ok: boolean
  snapshot?: WorldSnapshot
  error?: string
}

/** 업로드와 상태 반영을 서버가 한 번에 한다 — 클라이언트는 경로를 정하지 않는다. */
export async function uploadPhoto(file: File, questId: string): Promise<UploadResult> {
  const form = new FormData()
  form.append('file', file)
  form.append('questId', questId)

  const res = await fetch('/api/upload', { method: 'POST', body: form })
  const json = (await res.json().catch(() => ({}))) as UploadResult
  if (!res.ok) return { ok: false, error: json.error ?? '사진을 올리지 못했어요' }
  return { ok: true, snapshot: json.snapshot }
}
