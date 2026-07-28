'use client'

import { useState } from 'react'
import { Mallang } from '@/components/mallang/Mallang'
import { WeatherIcon } from '@/components/ui/Icons'
import { PillButton } from '@/components/ui/primitives'
import { useWorld } from '@/lib/client/world'
import { SHOP_ACCESSORIES, WEATHER_DESC } from '@/lib/domain/master'
import type { Weather, WorldSnapshot } from '@/lib/domain/types'

/**
 * T5 — 시즌 관리.
 *
 * 시험기간 모드는 원탭이고, 켜는 순간 전 화면이 차분한 톤으로 바뀐다.
 * 날씨 재굴림은 시즌당 한 번뿐이며, 맑음 고정은 언제든 쓸 수 있다.
 */
const WEATHERS: Weather[] = ['맑음', '구름 조금', '별똥별 소나기']

export function SeasonPanel({ world }: { world: WorldSnapshot }) {
  const { dispatch, say } = useWorld()
  const [rerollLeft, setRerollLeft] = useState(1)
  const at = () => new Date().toISOString()

  const reroll = () => {
    if (rerollLeft <= 0) {
      say('이번 시즌 재굴림은 다 썼어요')
      return
    }
    const next = WEATHERS[Math.floor(Math.random() * WEATHERS.length)]
    setRerollLeft((n) => n - 1)
    void dispatch({ type: 'season.weather', weather: next })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 lg:grid-cols-2">
        {/* 시즌 캘린더 · 시험기간 모드 */}
        <Card>
          <div className="font-display text-[18px]">시즌 캘린더</div>
          <div className="mt-3 flex flex-wrap gap-2">
            {['1주', '2주', '3주', '4주', '5주', '6주', '7주', '8주'].map((w, i) => (
              <span
                key={w}
                className="rounded-[14px] px-3 py-2 text-[13px]"
                style={{
                  background: i === 3 ? '#D9D2F5' : i === 7 ? '#FFF0B3' : '#FFF6EC',
                  border: '1.5px solid #E8D9C8',
                }}
              >
                {w}
                {i === 3 ? ' · 물드는 밤' : i === 7 ? ' · 완공식' : ''}
              </span>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <PillButton
              tint={world.village.examMode ? '#C5EBDD' : '#FFF6EC'}
              fg="#4A8B6F"
              line="#E8D9C8"
              onClick={() => dispatch({ type: 'season.exam', on: !world.village.examMode })}
            >
              시험기간 모드 {world.village.examMode ? '켜짐' : '꺼짐'}
            </PillButton>
            <span className="text-[13px]" style={{ color: '#8C7A72' }}>
              켜면 전 화면이 차분해지고 응원 말랑이가 나와요.
            </span>
          </div>

          {world.village.examMode && (
            <div className="anim-popin mt-4 flex items-center gap-4 rounded-[20px] px-5 py-4" style={{ background: '#EFEAE2' }}>
              <Mallang size={64} face="full" color="#C5EBDD" className="anim-floaty" />
              <span className="text-[15px]">시험 잘 보고 와! 마을은 우리가 지킬게</span>
            </div>
          )}
        </Card>

        {/* 날씨 */}
        <Card>
          <div className="font-display text-[18px]">날씨 미리보기</div>
          <div className="mt-3 flex items-center gap-4">
            <span style={{ color: '#B8933A' }}>
              <WeatherIcon weather={world.village.weather} size={44} />
            </span>
            <div>
              <div className="font-display text-[20px]">{world.village.weather}</div>
              <div className="text-[13px]" style={{ color: '#8C7A72' }}>
                {WEATHER_DESC[world.village.weather]}
              </div>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <PillButton size="sm" tint="#FFF6EC" line="#E8D9C8" onClick={reroll}>
              재굴림 (남은 {rerollLeft}회)
            </PillButton>
            <PillButton size="sm" tint="#FFF0B3" fg="#B8933A" onClick={() => dispatch({ type: 'season.weather', weather: '맑음' })}>
              맑음 고정
            </PillButton>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* 레이드 발동 */}
        <Card>
          <div className="font-display text-[18px]">레이드 발동</div>
          <p className="mt-2 text-[14px]" style={{ color: '#8C7A72' }}>
            단원 마무리에 한 번. 잠든 큰 나무의 실타래를 반 전체가 함께 풉니다.
          </p>
          <div className="mt-4">
            <PillButton
              tint="#D9D2F5"
              fg="#7A6BB5"
              onClick={() => dispatch({ type: 'crisis.start', kind: 'raid', goal: 24, seconds: 300, at: at() })}
            >
              지금 발동
            </PillButton>
          </div>
        </Card>

        {/* 물드는 밤 */}
        <Card>
          <div className="font-display text-[18px]">물드는 밤</div>
          <p className="mt-2 text-[14px]" style={{ color: '#8C7A72' }}>
            시즌 중반에 단 한 번. 전원이 자기 분야의 빛에 물듭니다.
          </p>
          <div className="mt-4">
            <PillButton tint="#3A3350" fg="#FFF6EC" onClick={() => dispatch({ type: 'session.night', at: at() })}>
              큰 화면에서 시작
            </PillButton>
          </div>
        </Card>

        {/* 시즌 종료 */}
        <Card>
          <div className="font-display text-[18px]">시즌 종료</div>
          <p className="mt-2 text-[14px]" style={{ color: '#8C7A72' }}>
            완공식을 열면 마을이 엽서가 되고, 마을 자체는 대륙에 남습니다.
          </p>
          <div className="mt-4">
            <PillButton tint="#FFC9B5" fg="#C96B4A" onClick={() => dispatch({ type: 'session.finale', at: at() })}>
              완공식 열기
            </PillButton>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* 한정 상점 로테이션 */}
        <Card>
          <div className="font-display text-[18px]">한정 상점 로테이션</div>
          <div className="mt-3 grid grid-cols-4 gap-2">
            {SHOP_ACCESSORIES.map((a, i) => (
              <div
                key={a.key}
                className="rounded-[16px] px-3 py-3 text-center text-[12px]"
                style={{ background: i === 7 ? '#FFF0B3' : '#FFF6EC', border: '1.5px solid #E8D9C8' }}
              >
                <Mallang size={44} accessory={a.key} color="#FFD6E5" />
                <div className="mt-1">{a.name}</div>
              </div>
            ))}
          </div>
          <div className="mt-3 text-[13px]" style={{ color: '#8C7A72' }}>
            이번 주 슬롯은 마지막 칸이에요. 놓친 물건은 시즌 마지막에 돌아와요.
          </div>
        </Card>

        {/* SNS 이미지 내보내기함 */}
        <Card>
          <div className="font-display text-[18px]">내보내기함</div>
          <p className="mt-2 text-[14px]" style={{ color: '#8C7A72' }}>
            정산 마무리 화면과 시즌 엽서를 그대로 저장할 수 있어요. 학생 이름은 말랑이 이름만 들어갑니다.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <PillButton size="sm" tint="#FFF6EC" line="#E8D9C8" onClick={() => window.open('/screen', '_blank')}>
              큰 화면 열기
            </PillButton>
            <PillButton size="sm" tint="#FFF6EC" line="#E8D9C8" onClick={() => window.open('/print', '_blank')}>
              인쇄물 열기
            </PillButton>
          </div>
        </Card>
      </div>
    </div>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-[20px] px-6 py-5" style={{ background: '#FFFFFF', border: '1.5px solid #E8D9C8' }}>
      {children}
    </div>
  )
}
