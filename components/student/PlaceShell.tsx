'use client'

import { useEffect } from 'react'
import { Mallang } from '@/components/mallang/Mallang'
import { ClassIcon, MapPinIcon } from '@/components/ui/Icons'
import { CLASS_ABILITY, PLACE_LABEL } from '@/lib/domain/master'
import type { Mallang as MallangType, Place, WorldSnapshot } from '@/lib/domain/types'

/**
 * 장소 셸.
 *
 * 상단 탭바는 두지 않는다 (§S2). 하단에 지도 버튼 하나만 두고,
 * 그 밖의 이동은 전부 광장의 건물을 탭해서 일어난다.
 */
export function PlaceShell({
  place,
  go,
  me,
  children,
}: {
  place: Place
  go: (p: Place) => void
  me: MallangType
  children: React.ReactNode
}) {
  const label = PLACE_LABEL[place]
  const cls = CLASS_ABILITY[me.classRole]

  return (
    <div className="flex min-h-screen flex-col" style={{ background: '#FFF6EC' }}>
      {place !== 'plaza' && (
        <header className="flex items-center justify-between px-5 pt-5">
          <button
            onClick={() => go('plaza')}
            className="squishy flex items-center gap-2 rounded-full px-4 py-2 text-[14px] font-bold"
            style={{ background: '#FFFFFF', border: '1.5px solid #E8D9C8' }}
          >
            ← 광장으로
          </button>
          <div className="text-center">
            <div className="font-display text-[20px]">{label.name}</div>
            <div className="text-[12px]" style={{ color: '#B8A99E' }}>
              {label.sub}
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-full px-3 py-1.5" style={{ background: '#FFFFFF', border: '1.5px solid #E8D9C8' }}>
            <Mallang color={me.bodyColor} size={26} form={me.evolutionForm} accessory={me.wearing} />
            <span className="text-[13px] font-bold">{me.name}</span>
            <span style={{ color: '#8C7A72' }} title={cls.label}>
              <ClassIcon role={me.classRole} size={14} />
            </span>
          </div>
        </header>
      )}

      <main className="flex-1">{children}</main>

      {/* 하단에 지도 버튼 하나만 */}
      {place !== 'map' && (
        <div className="sticky bottom-0 flex justify-center px-5 pb-5 pt-3">
          <button
            onClick={() => go('map')}
            className="squishy flex items-center gap-2 rounded-full px-6 py-3 text-[15px] font-bold"
            style={{ background: '#FFF6EC', border: '1.5px solid #6E5A54' }}
          >
            <MapPinIcon size={17} />
            지도
          </button>
        </div>
      )}
    </div>
  )
}

/**
 * 도착 연출 — "○○이 숲 어귀에 도착했습니다".
 * 세계가 나를 데려다준다는 느낌이 이 3초에 걸려 있다.
 */
export function Arrival({
  world,
  me,
  onDone,
}: {
  world: WorldSnapshot
  me: MallangType
  onDone: () => void
}) {
  const site = world.sites.find((s) => s.id === world.session.siteId)
  const seg = site?.segments[world.session.segmentIndex]

  useEffect(() => {
    const id = setTimeout(onDone, 2800)
    return () => clearTimeout(id)
  }, [onDone])

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6"
      style={{ background: 'rgba(255,246,236,.96)' }}
      onClick={onDone}
    >
      <Mallang color={me.bodyColor} size={140} face="surprise" form={me.evolutionForm} accessory={me.wearing} className="anim-popin" />
      <div className="anim-popin text-center">
        <div className="font-display text-[28px]">
          {me.name}이(가) {site?.name}에 도착했습니다
        </div>
        <div className="mt-1 text-[15px]" style={{ color: '#8C7A72' }}>
          {seg?.name}
        </div>
      </div>
    </div>
  )
}
