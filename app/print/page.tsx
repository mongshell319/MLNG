'use client'

import { useEffect, useState } from 'react'
import { Mallang } from '@/components/mallang/Mallang'
import { Keeper } from '@/components/mallang/Keeper'
import { Monument } from '@/components/screen/Buildings'
import { useWorld } from '@/lib/client/world'
import { Loader } from '@/components/ui/primitives'
import type { Mallang as MallangType } from '@/lib/domain/types'
import './print.css'

/**
 * P1–P3 — 인쇄물.
 *
 * P1 모험가 증표 (명함 90×54mm) — 코팅해서 나눠 주는 것이 학기 초 개막식이다.
 * P2 교실 게이트 (A3)
 * P3 시즌 엽서
 *
 * 브라우저 인쇄로 PDF를 뽑는다. 인쇄 시 화면용 안내는 전부 빠진다.
 */
export default function PrintSheets() {
  const { world, needsEntry, identity } = useWorld()
  const [qrs, setQrs] = useState<Record<string, string>>({})

  const cardMallangs = world?.mallangs.slice(0, 8) ?? []

  useEffect(() => {
    if (cardMallangs.length === 0) return
    let alive = true
    void import('qrcode').then(async (mod) => {
      const out: Record<string, string> = {}
      for (const m of cardMallangs) {
        out[m.code] = await mod.toDataURL(`${location.origin}/student?code=${m.code}`, {
          margin: 0,
          color: { dark: '#6E5A54', light: '#FFF6EC' },
          width: 200,
        })
      }
      if (alive) setQrs(out)
    })
    return () => {
      alive = false
    }
    // 말랑이 목록이 바뀔 때만 다시 만든다
  }, [cardMallangs.map((m) => m.code).join(',')]) // eslint-disable-line react-hooks/exhaustive-deps

  // 증표에는 말랑 코드가 찍힌다. 교사만 뽑을 수 있어야 한다.
  if (needsEntry || (identity && identity.kind !== 'gm')) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <Keeper field="steady" size={110} className="anim-floaty" />
        <div className="font-display text-[22px]">인쇄물은 GM 화면에서 꺼내요</div>
        <p className="text-[15px]" style={{ color: '#8C7A72' }}>
          증표에 말랑 코드가 찍히기 때문에, 교사로 입장한 다음에 열 수 있어요.
        </p>
        <a
          href="/teacher"
          className="squishy rounded-full px-6 py-3 text-[15px] font-bold"
          style={{ background: '#FFC9B5', color: '#C96B4A', border: '1.5px solid #C96B4A' }}
        >
          GM으로 들어가기
        </a>
      </div>
    )
  }

  if (!world) return <Loader label="인쇄물을 꺼내는 중이에요" />

  return (
    <div className="print-root">
      <div className="no-print flex w-full max-w-[900px] flex-wrap items-center gap-3 rounded-[20px] px-6 py-4" style={{ background: '#FFF6EC', border: '1.5px solid #E8D9C8' }}>
        <div className="font-display text-[19px]">인쇄물</div>
        <span className="hint">브라우저 인쇄(⌘/Ctrl+P)로 A3 PDF가 나옵니다. 배경 그래픽 옵션을 켜 주세요.</span>
        <button
          onClick={() => window.print()}
          className="squishy ml-auto rounded-full px-5 py-2 text-[14px] font-bold"
          style={{ background: '#FFC9B5', color: '#C96B4A', border: '1.5px solid #C96B4A' }}
        >
          인쇄하기
        </button>
      </div>

      {/* P1 — 모험가 증표 앞면 */}
      <section className="sheet sheet-a3">
        <h2 className="font-display" style={{ fontSize: 24 }}>
          P1 · 모험가 증표 (앞면)
        </h2>
        <p className="hint">자르는 선 없이 90×54mm. 코팅해서 나눠 주세요.</p>
        <div className="mt-6 flex flex-wrap gap-4">
          {cardMallangs.map((m) => (
            <BadgeFront key={m.code} m={m} village={world.village.name} season={world.village.season} />
          ))}
        </div>
      </section>

      {/* P1 — 뒷면 */}
      <section className="sheet sheet-a3">
        <h2 className="font-display" style={{ fontSize: 24 }}>
          P1 · 모험가 증표 (뒷면)
        </h2>
        <p className="hint">앞면과 같은 순서입니다.</p>
        <div className="mt-6 flex flex-wrap gap-4">
          {cardMallangs.map((m) => (
            <BadgeBack key={m.code} m={m} qr={qrs[m.code]} />
          ))}
        </div>
      </section>

      {/* P2 — 교실 게이트 */}
      <section className="sheet sheet-a3 flex flex-col items-center justify-center">
        <svg width="220mm" viewBox="0 0 600 780" aria-label="교실 게이트">
          <path d="M90 760 V270 a210 210 0 0 1 420 0 V760" fill="none" stroke="#6E5A54" strokeWidth={14} strokeLinecap="round" />
          <path d="M140 760 V276 a160 160 0 0 1 320 0 V760 Z" fill="#FFF0B3" opacity={0.5} />
          <path d="M300 120 l16 34 37 4 -27 25 7 37 -33-19 -33 19 7-37 -27-25 37-4Z" fill="#FFF0B3" stroke="#B8933A" strokeWidth={5} strokeLinejoin="round" />
        </svg>
        <div className="mt-6 text-center">
          <div className="font-display" style={{ fontSize: 44 }}>
            이 문을 지나면 원정이 시작된다
          </div>
          <div className="mt-3" style={{ fontSize: 20, color: '#8C7A72' }}>
            {world.village.name}
          </div>
        </div>
      </section>

      {/* P3 — 시즌 엽서 앞면 */}
      <section className="sheet sheet-a3">
        <h2 className="font-display" style={{ fontSize: 24 }}>
          P3 · 시즌 엽서 (앞면)
        </h2>
        <div className="mt-6 flex flex-wrap gap-6">
          <div className="card-postcard relative overflow-hidden">
            <svg viewBox="0 0 400 240" style={{ width: '100%', height: '70%' }} aria-label="마을 전경">
              <rect x={0} y={0} width={400} height={240} fill="#D9F0F7" />
              <path d="M0 150 Q120 100 220 140 T400 120 V240 H0Z" fill="#CFE0D4" />
              <path d="M0 190 Q140 160 260 195 T400 180 V240 H0Z" fill="#A9C4B2" />
              <rect x={40} y={110} width={70} height={50} rx={8} fill="#C5EBDD" stroke="#6E5A54" strokeWidth={3} />
              <rect x={140} y={120} width={64} height={44} rx={8} fill="#FFC9B5" stroke="#6E5A54" strokeWidth={3} />
              <rect x={240} y={116} width={60} height={48} rx={8} fill="#FFD6E5" stroke="#6E5A54" strokeWidth={3} />
              <path d="M330 165 L345 118 L360 165 Z" fill="#D9D2F5" stroke="#6E5A54" strokeWidth={3} strokeLinejoin="round" />
            </svg>
            <div className="mt-2 flex items-end justify-between">
              <div>
                <div className="font-display" style={{ fontSize: 20 }}>
                  {world.village.name}
                </div>
                <div style={{ fontSize: 12, color: '#8C7A72' }}>시즌 {world.village.season}</div>
              </div>
              <Monument size={40} />
            </div>
          </div>

          {/* 뒷면 */}
          <div className="card-postcard">
            <div className="flex h-full gap-4">
              <div className="flex-1">
                <div className="font-display" style={{ fontSize: 16 }}>
                  시즌 여권 요약
                </div>
                <div className="mt-2 flex flex-col gap-2">
                  {world.sites.map((s) => (
                    <div key={s.id} className="flex items-center gap-2" style={{ fontSize: 12 }}>
                      <span style={{ width: 12, height: 12, borderRadius: 4, border: '1px solid #6E5A54', display: 'inline-block' }} />
                      {s.name}
                    </div>
                  ))}
                  <div className="mt-2" style={{ borderTop: '1px dashed #C9BBB0', paddingTop: 6, fontSize: 12, color: '#8C7A72' }}>
                    기억에 남는 하루
                  </div>
                  <div style={{ height: 34, borderBottom: '1px dashed #C9BBB0' }} />
                  <div style={{ height: 34, borderBottom: '1px dashed #C9BBB0' }} />
                </div>
              </div>
              <div className="flex flex-col items-center justify-start">
                <div
                  className="flex items-center justify-center"
                  style={{ width: 76, height: 90, border: '1.5px dashed #C9BBB0', borderRadius: 8 }}
                >
                  <Keeper field="care" size={54} />
                </div>
                <div className="mt-1" style={{ fontSize: 10, color: '#B8A99E' }}>
                  말랑 우표 자리
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

function BadgeFront({ m, village, season }: { m: MallangType; village: string; season: number }) {
  return (
    <div className="card-90x54">
      <Mallang color={m.bodyColor} size={100} face="glad" form={m.evolutionForm} accessory={m.wearing} />
      <div>
        <div className="font-display" style={{ fontSize: 20 }}>
          {m.name}
        </div>
        <div style={{ fontSize: 11, color: '#8C7A72' }}>{village}</div>
        <div style={{ fontSize: 11, color: '#8C7A72' }}>시즌 {season}</div>
        <div className="mt-2 inline-block rounded-full px-2 py-0.5" style={{ background: '#FFF0B3', fontSize: 10, color: '#B8933A' }}>
          모험가 증표
        </div>
      </div>
    </div>
  )
}

function BadgeBack({ m, qr }: { m: MallangType; qr?: string }) {
  return (
    <div className="card-90x54" style={{ justifyContent: 'space-between' }}>
      <div>
        <div style={{ fontSize: 10, color: '#B8A99E' }}>말랑 코드</div>
        <div className="font-display" style={{ fontSize: 22, letterSpacing: '0.12em' }}>
          {m.code}
        </div>
        <div className="mt-2" style={{ fontSize: 10, color: '#8C7A72', maxWidth: '38mm' }}>
          학년이 바뀌어도 이 코드로 같은 말랑이를 이어받아요.
        </div>
      </div>
      {qr ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={qr} alt="" width={110} height={110} />
      ) : (
        <div style={{ width: 110, height: 110 }} />
      )}
    </div>
  )
}
