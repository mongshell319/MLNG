'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * 클래스 스크린은 1920×1080 고정 무대다.
 * 3m 시청 거리 기준으로 잡은 크기(본문 최소 32px)가 화면 크기에 따라
 * 흔들리면 안 되므로, 레이아웃을 리플로우하지 않고 통째로 스케일한다.
 */
export function Stage({ children }: { children: React.ReactNode }) {
  const wrap = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const fit = () => {
      const el = wrap.current
      if (!el) return
      setScale(Math.min(el.clientWidth / 1920, el.clientHeight / 1080))
    }
    fit()
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [])

  return (
    <div ref={wrap} className="flex h-screen w-screen items-center justify-center overflow-hidden bg-[#FFF6EC]">
      <div
        className="stage-1080 relative overflow-hidden"
        style={{ transform: `scale(${scale})`, transformOrigin: 'center', flex: 'none' }}
      >
        {children}
      </div>
    </div>
  )
}
