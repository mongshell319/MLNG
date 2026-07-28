import type { Metadata, Viewport } from 'next'
import { WorldProvider } from '@/lib/client/world'
import './globals.css'

export const metadata: Metadata = {
  title: '말랑스쿨',
  description: '수업 한 차시를 원정으로 바꾸는 곳',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#FFF6EC',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        {/* 본문 Pretendard · 디스플레이 Jua. 프로덕션에서는 self-host 권장 (handoff §Assets) */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Jua&display=swap" rel="stylesheet" />
        <link
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.min.css"
          rel="stylesheet"
        />
      </head>
      <body>
        <WorldProvider>{children}</WorldProvider>
      </body>
    </html>
  )
}
