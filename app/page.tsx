import Link from 'next/link'
import { Mallang } from '@/components/mallang/Mallang'
import { Keeper } from '@/components/mallang/Keeper'

/**
 * 세 클라이언트로 들어가는 입구.
 * 학생은 실제로 여기를 거치지 않는다 — QR이나 말랑 코드로 /student 에 바로 도착한다.
 */

const DOORS = [
  {
    href: '/teacher',
    title: '교사 GM',
    sub: '여기서 시작합니다',
    body: '마을을 세우면 클래스 코드가 나옵니다. 학생 입장도, 교실 TV도 그 코드에서 갈라져요.',
    tint: '#C5EBDD',
    deep: '#4A8B6F',
  },
  {
    href: '/student',
    title: '학생',
    sub: '태블릿 가로 · 폰 세로',
    body: '클래스 코드나 QR로 들어와 말랑이를 만들고, 의뢰를 받고, 원정지로 떠납니다.',
    tint: '#FFC9B5',
    deep: '#C96B4A',
  },
  {
    href: '/screen',
    title: '클래스 스크린',
    sub: '교실 TV · 1920×1080',
    body: '교사 화면의 "클래스 스크린 열기"로 띄웁니다. 스물여덟 명의 결과가 동시에 터지는 곳.',
    tint: '#D9D2F5',
    deep: '#7A6BB5',
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
            <b>모험가 증표 · 교실 게이트 · 시즌 엽서</b>는 GM으로 입장한 뒤 뽑을 수 있어요.
            <br />
            <span style={{ color: '#8C7A72' }}>증표에 말랑 코드가 찍히기 때문이에요.</span>
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
