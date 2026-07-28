'use client'

import { useEffect, useState } from 'react'
import { PillButton } from '@/components/ui/primitives'

/**
 * 교실 TV 열기.
 *
 * TV는 교사 태블릿과 다른 기기라 쿠키를 나눠 가질 수 없다. 그래서 짧은 토큰이 담긴
 * 링크를 만들어 TV에서 한 번 열게 한다. 토큰은 10분이면 만료되므로
 * 칠판에 적어 둔 주소가 학기 내내 살아 있는 일이 없다.
 */
export function ScreenLink() {
  const [open, setOpen] = useState(false)
  const [url, setUrl] = useState('')
  const [qr, setQr] = useState('')
  const [ttl, setTtl] = useState(10)
  const [problem, setProblem] = useState('')

  const make = async () => {
    setProblem('')
    setOpen(true)
    const res = await fetch('/api/enter/screen', { method: 'POST' })
    const json = (await res.json()) as { token?: string; ttlMinutes?: number; error?: string }
    if (!res.ok || !json.token) {
      setProblem(json.error ?? '지금은 만들지 못했어요')
      return
    }
    setUrl(`${location.origin}/api/enter/screen?t=${json.token}`)
    setTtl(json.ttlMinutes ?? 10)
  }

  useEffect(() => {
    if (!url) return
    let alive = true
    void import('qrcode').then(async (mod) => {
      const data = await mod.toDataURL(url, {
        margin: 1,
        color: { dark: '#6E5A54', light: '#FFF6EC' },
        width: 260,
      })
      if (alive) setQr(data)
    })
    return () => {
      alive = false
    }
  }, [url])

  return (
    <>
      <button
        onClick={make}
        className="squishy rounded-full px-4 py-2 text-[13px] font-bold"
        style={{ background: '#D9D2F5', color: '#7A6BB5', border: '1.5px solid #7A6BB5' }}
      >
        클래스 스크린 열기 ↗
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-6"
          style={{ background: 'rgba(110,90,84,.32)' }}
          onClick={() => setOpen(false)}
        >
          <div
            className="anim-popin w-full max-w-[460px] rounded-[24px] px-7 py-7 text-center"
            style={{ background: '#FFF6EC', border: '1.5px solid #E8D9C8' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="font-display text-[20px]">교실 TV에서 열기</div>
            <p className="mt-2 text-[14px]" style={{ color: '#8C7A72' }}>
              TV 브라우저로 이 QR을 찍거나 주소를 열면 됩니다. {ttl}분 뒤에는 다시 만들어야 해요.
            </p>

            {problem && (
              <div className="mt-3 text-[14px]" style={{ color: '#8C7A72' }}>
                {problem}
              </div>
            )}

            {qr && (
              <div className="mt-4 flex justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qr} alt="클래스 스크린 QR" width={200} height={200} style={{ borderRadius: 16 }} />
              </div>
            )}

            {url && (
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <PillButton
                  size="sm"
                  tint="#FFFFFF"
                  line="#E8D9C8"
                  onClick={() => void navigator.clipboard?.writeText(url)}
                >
                  주소 복사
                </PillButton>
                <PillButton size="sm" tint="#D9D2F5" fg="#7A6BB5" onClick={() => window.open(url, '_blank')}>
                  이 기기에서 열기
                </PillButton>
              </div>
            )}

            <div className="mt-5">
              <PillButton tint="#FFF6EC" line="#E8D9C8" onClick={() => setOpen(false)}>
                닫기
              </PillButton>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
