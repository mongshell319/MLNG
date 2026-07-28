import Link from 'next/link'
import { Mallang } from '@/components/mallang/Mallang'
import { Keeper } from '@/components/mallang/Keeper'

/**
 * 세 클라이언트로 들어가는 입구.
 * 학생은 실제로 여기를 거치지 않는다 — QR이나 말랑 코드로 /student 에 바로 도착한다.
 */

const DOORS = [
  {
    href: '/screen',
    title: '클래스 스크린',
    sub: '교실 TV · 1920×1080',
    body: '스물여덟 명의 결과가 동시에 터지는 곳. 이 서비스가 파는 경험의 본체.',
    tint: '#D9D2F5',
    deep: '#7A6BB5',
  },
  {
    href: '/student',
    title: '학생',
    sub: '태블릿 가로 · 폰 세로',
    body: '마을 광장에 도착해서, 의뢰를 받고, 원정지로 떠난다.',
    tint: '#FFC9B5',
    deep: '#C96B4A',
  },
  {
    href: '/teacher',
    title: '교사 GM',
    sub: '태블릿 / PC 가로',
    body: '원정 발행, 검증, 리모컨, 시즌 관리. 주 20분 안에 끝난다.',
    tint: '#C5EBDD',
    deep: '#4A8B6F',
  },
]

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1120px] flex-col justify-center gap-8 px-6 py-14">
      <header className="flex items-end gap-4">
        <Mallang size={78} face="glad" className="anim-floaty" />
        <div>
          <h1 className="font-display text-[40px] leading-tight">말랑스쿨</h1>
          <p className="text-[15px]" style={{ color: '#8C7A72' }}>
            수업 한 차시를 원정으로 바꾸는 곳. 모든 마을은 말랑 대륙 위에 있고, 시즌이 끝나도 사라지지 않는다.
          </p>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        {DOORS.map((d) => (
          <Link
            key={d.href}
            href={d.href}
            className="squishy rounded-[20px] p-6"
            style={{ background: d.tint, border: `1.5px solid ${d.deep}` }}
          >
            <div className="font-display text-[26px]" style={{ color: d.deep }}>
              {d.title}
            </div>
            <div className="mt-1 text-[13px] font-bold" style={{ color: d.deep }}>
              {d.sub}
            </div>
            <p className="mt-3 text-[14px] leading-relaxed">{d.body}</p>
          </Link>
        ))}
      </div>

      <div
        className="flex flex-wrap items-center justify-between gap-4 rounded-[20px] px-6 py-5"
        style={{ background: '#FFFFFF', border: '1.5px solid #E8D9C8' }}
      >
        <div className="flex items-center gap-3">
          <Keeper field="care" size={54} />
          <div className="text-[14px]">
            인쇄물이 필요하면 <b>모험가 증표 · 교실 게이트 · 시즌 엽서</b>를 여기서 뽑아 가세요.
          </div>
        </div>
        <Link
          href="/print"
          className="squishy rounded-full px-6 py-3 text-[15px] font-bold"
          style={{ background: '#FFF0B3', border: '1.5px solid #B8933A', color: '#B8933A' }}
        >
          인쇄물 보기
        </Link>
      </div>
    </main>
  )
}
