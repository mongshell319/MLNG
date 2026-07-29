'use client';
import React, { useMemo } from 'react';
import { W, sh, lt, far, pickPalette } from '@/lib/art/tokens';
import { rng } from '@/lib/art/seed';
import { Foliage, Tree, Bush, GroundPlate, Bricks, PlankDoor, ArchWindow, Lantern } from './Primitives';
import Malang from '@/components/Malang';

/* 구간별 지역 색조 — 같은 레이어 구조에 팔레트만 갈아끼운다 */
const SITE_TONE = {
  forest: { far: '#C9D9C4', mid: '#A9C4B2', ground: '#CFE0D4', accent: '#8FBF9E' },
  lake: { far: '#C6DCE4', mid: '#A9C7D6', ground: '#D2E4EA', accent: '#BFE3EF' },
  mine: { far: '#D2CBC4', mid: '#BBB1A8', ground: '#DCD5CC', accent: '#C9B79E' },
  tower: { far: '#D3CBE0', mid: '#B7ACC9', ground: '#DED6E8', accent: '#D9D2F5' },
};

/* 레이어 1·2 — 원경 실루엣 (대기 원근: 채도 낮추고 굵기 줄임) */
function FarLayer({ P, tone, w, y, seed, kind = 'tree' }) {
  const r = rng(seed);
  const items = [];
  const n = 9;
  for (let i = 0; i <= n; i++) {
    const x = (w / n) * i + (r() - 0.5) * 40;
    const s = 0.55 + r() * 0.4;
    if (kind === 'rock') {
      items.push(<path key={i} d={`M${x - 46 * s} ${y} q${20 * s} -${58 * s} ${46 * s} -${62 * s} q${28 * s} ${6 * s} ${46 * s} ${62 * s} Z`} fill={tone.far} />);
    } else {
      items.push(
        <g key={i} transform={`translate(${x.toFixed(0)},${y}) scale(${s.toFixed(2)})`}>
          <rect x={-6} y={-46} width={12} height={48} fill={tone.far} />
          <circle cx={0} cy={-64} r={40} fill={tone.far} />
          <circle cx={-26} cy={-44} r={26} fill={tone.far} />
          <circle cx={26} cy={-44} r={24} fill={tone.far} />
        </g>
      );
    }
  }
  return <g opacity={0.85}>{items}</g>;
}

/* 레이어 3 — 중경 */
function MidLayer({ P, tone, w, y, seed, kind }) {
  const r = rng(seed + 7);
  const items = [];
  for (let i = 0; i < 6; i++) {
    const x = 60 + (w - 120) * (i / 5) + (r() - 0.5) * 90;
    const s = 0.8 + r() * 0.5;
    if (kind === 'rock') {
      items.push(
        <g key={i} transform={`translate(${x.toFixed(0)},${y}) scale(${s.toFixed(2)})`}>
          <path d="M-40 0 q14 -46 40 -50 q26 4 40 50 Z" fill={tone.mid} stroke={P.ink} strokeWidth={W.lo} strokeLinejoin="round" opacity={0.9} />
        </g>
      );
    } else {
      items.push(
        <g key={i} transform={`translate(${x.toFixed(0)},${y}) scale(${s.toFixed(2)})`} opacity={0.95}>
          <path d="M-7 0 q2 -26 -2 -40 q9 5 10 -5 q3 12 11 7 q-7 12 -5 38 Z" fill={sh(P.wood, 0.95)} stroke={P.ink} strokeWidth={W.lo} strokeLinejoin="round" />
          <Foliage cx={0} cy={-62} r={34} P={P} col={tone.mid} />
        </g>
      );
    }
  }
  return <g>{items}</g>;
}


/* 구간 랜드마크 — 그 자리에만 있는 것. 진행도와 무관하게 장소를 각인시킨다 */
function Landmark({ id, P, tone, w, gy }) {
  const cx = w * 0.5;
  if (id === 's1') {  // 숲 어귀 — 이정표와 아치 입구
    return (
      <g transform={`translate(${w * 0.17}, ${gy})`}>
        <GroundPlate cx={0} w={90} gy={0} P={P} />
        <rect x={-6} y={-96} width={12} height={96} rx={5} fill={P.wood} stroke={P.ink} strokeWidth={W.hi} />
        <path d="M6 -88 h60 l-14 15 14 15 h-60 Z" fill={P.cream} stroke={P.ink} strokeWidth={W.mid} strokeLinejoin="round" />
        <path d="M18 -78 h30 M18 -68 h20" stroke={P.ink} strokeWidth={2.4} opacity={0.35} strokeLinecap="round" />
        <path d="M-6 -50 h-52 l10 12 -10 12 h52 Z" fill={P.lemon} stroke={P.ink} strokeWidth={P.mid || 2.2} strokeLinejoin="round" />
      </g>
    );
  }
  if (id === 's2') {  // 흩어진 오솔길 — 갈라지는 길
    return (
      <g>
        <path d={`M${w * 0.5} ${gy + 40} q-${w * 0.16} -50 -${w * 0.3} -70`} stroke={P.wood} strokeWidth={22} fill="none" opacity={0.55} strokeLinecap="round" />
        <path d={`M${w * 0.5} ${gy + 40} q${w * 0.1} -46 ${w * 0.26} -66`} stroke={P.wood} strokeWidth={22} fill="none" opacity={0.55} strokeLinecap="round" />
        <path d={`M${w * 0.5} ${gy + 40} v-30`} stroke={P.wood} strokeWidth={26} fill="none" opacity={0.55} strokeLinecap="round" />
        <g transform={`translate(${w * 0.5}, ${gy - 26})`}>
          <rect x={-5} y={-64} width={10} height={64} rx={5} fill={P.wood} stroke={P.ink} strokeWidth={W.mid} />
          <path d="M5 -58 h44 l-10 11 10 11 h-44 Z" fill={P.cream} stroke={P.ink} strokeWidth={W.mid} strokeLinejoin="round" />
          <path d="M-5 -34 h-44 l10 11 -10 11 h44 Z" fill={P.cream} stroke={P.ink} strokeWidth={W.mid} strokeLinejoin="round" />
        </g>
      </g>
    );
  }
  if (id === 's3') {  // 무너진 나무다리 — 계곡
    return (
      <g>
        <path d={`M${w * 0.1} ${gy + 6} q${w * 0.4} 62 ${w * 0.8} 0 L${w * 0.9} ${gy + 200} L${w * 0.1} ${gy + 200} Z`} fill={sh(tone.ground, 0.82)} stroke={P.ink} strokeWidth={W.mid} />
        <path d={`M${w * 0.16} ${gy + 46} q${w * 0.34} 40 ${w * 0.68} 4`} stroke={lt(P.water, 0.2)} strokeWidth={16} fill="none" opacity={0.7} strokeLinecap="round" />
      </g>
    );
  }
  if (id === 's4') {  // 잊힌 오두막
    return (
      <g transform={`translate(${w * 0.78}, ${gy})`}>
        <GroundPlate cx={0} w={190} gy={0} P={P} />
        <Bricks x={-78} y={-16} w={156} h={16} P={P} />
        <rect x={-70} y={-92} width={140} height={76} rx={8} fill={P.wall} stroke={P.ink} strokeWidth={W.hi} />
        <path d="M52 -17 v-74 h18 v74 Z" fill={sh(P.wall, 0.93)} />
        <path d="M0 -152 L-88 -86 L88 -86 Z" fill={tone.accent} stroke={P.ink} strokeWidth={W.hi} strokeLinejoin="round" />
        <path d="M0 -152 L88 -86 L8 -86 Z" fill={sh(tone.accent, 0.9)} />
        <path d="M-30 -120 l-16 12 M12 -132 l-14 10" stroke={P.ink} strokeWidth={3} opacity={0.4} strokeLinecap="round" />
        <PlankDoor cx={0} y={-16} w={30} h={46} P={P} />
        <ArchWindow cx={-44} cy={-58} w={22} h={26} P={P} />
        <ArchWindow cx={44} cy={-58} w={22} h={26} P={P} />
      </g>
    );
  }

  // ---- 물안개 호수 ----
  if (id === 'l1') {  // 나루터
    return (
      <g transform={`translate(${w * 0.24}, ${gy})`}>
        <path d={`M-140 -6 h280 v16 h-280 Z`} fill={lt(P.water, 0.15)} opacity={0.5} />
        <rect x={-90} y={-14} width={180} height={14} rx={5} fill={P.wood} stroke={P.ink} strokeWidth={W.mid} />
        {[-70, -30, 10, 50].map((px) => <rect key={px} x={px} y={0} width={11} height={34} rx={4} fill={sh(P.wood, 0.9)} stroke={P.ink} strokeWidth={W.lo} />)}
        <rect x={96} y={-70} width={10} height={70} rx={5} fill={P.wood} stroke={P.ink} strokeWidth={W.mid} />
        <path d="M106 -64 h34 l-8 9 8 9 h-34 Z" fill={P.cream} stroke={P.ink} strokeWidth={W.mid} strokeLinejoin="round" />
      </g>
    );
  }
  if (id === 'l3') {  // 가라앉은 나룻배
    return (
      <g transform={`translate(${w * 0.74}, ${gy})`}>
        <GroundPlate cx={0} w={220} gy={0} P={P} />
        <path d="M-96 -10 q96 44 192 0 q-24 34 -96 34 q-72 0 -96 -34 Z" fill={P.wood} stroke={P.ink} strokeWidth={W.hi} strokeLinejoin="round" />
        <path d="M0 24 v-34 M-60 -2 q60 26 120 0" stroke={P.ink} strokeWidth={1.8} opacity={0.35} fill="none" />
        <path d="M-10 -10 v-72" stroke={P.ink} strokeWidth={W.hi} strokeLinecap="round" />
        <path d="M-10 -78 q52 12 4 44 Z" fill={P.cream} stroke={P.ink} strokeWidth={W.mid} strokeLinejoin="round" />
      </g>
    );
  }
  if (id === 'l4') {  // 물 위의 정자
    return (
      <g transform={`translate(${w * 0.5}, ${gy - 4})`}>
        {[-64, -22, 22, 64].map((px) => <rect key={px} x={px - 5} y={-58} width={10} height={62} rx={4} fill={P.wood} stroke={P.ink} strokeWidth={W.mid} />)}
        <path d="M0 -130 L-96 -56 L96 -56 Z" fill={lt(P.water, 0.1)} stroke={P.ink} strokeWidth={W.hi} strokeLinejoin="round" />
        <path d="M0 -130 L96 -56 L8 -56 Z" fill={sh(lt(P.water, 0.1), 0.9)} />
        <circle cx={0} cy={-134} r={6} fill={P.lemon} stroke={P.ink} strokeWidth={W.mid} />
      </g>
    );
  }
  // ---- 오래된 폐광 ----
  if (id === 'm1') {  // 갱도 입구
    return (
      <g transform={`translate(${w * 0.5}, ${gy})`}>
        <path d="M-150 0 q30 -132 150 -136 q120 4 150 136 Z" fill={sh(tone.mid, 0.92)} stroke={P.ink} strokeWidth={W.hi} strokeLinejoin="round" />
        <path d="M-56 0 v-72 a56 56 0 0 1 112 0 v72 Z" fill="#3E3630" stroke={P.ink} strokeWidth={W.hi} strokeLinejoin="round" />
        <path d="M-68 0 v-82 h14 v82 M68 0 v-82 h-14 v82 M-70 -82 h140 v14 h-140 Z" fill={P.wood} stroke={P.ink} strokeWidth={W.mid} strokeLinejoin="round" />
      </g>
    );
  }
  if (id === 'm3') {  // 멈춘 수레길
    return (
      <g>
        <path d={`M${w * 0.08} ${gy + 12} h${w * 0.84}`} stroke={P.ink} strokeWidth={5} opacity={0.6} />
        <path d={`M${w * 0.08} ${gy + 26} h${w * 0.84}`} stroke={P.ink} strokeWidth={5} opacity={0.6} />
        {Array.from({ length: 14 }).map((_, i) => (
          <rect key={i} x={w * 0.08 + i * (w * 0.84 / 14)} y={gy + 8} width={16} height={22} rx={4} fill={sh(P.wood, 0.9)} stroke={P.ink} strokeWidth={W.lo} />
        ))}
      </g>
    );
  }
  if (id === 'm4') {  // 광부의 방
    return (
      <g transform={`translate(${w * 0.76}, ${gy})`}>
        <rect x={-100} y={-118} width={200} height={118} rx={10} fill="#4A413A" stroke={P.ink} strokeWidth={W.hi} />
        <rect x={-70} y={-84} width={54} height={54} rx={8} fill={lt(P.lemon, 0.15)} stroke={P.ink} strokeWidth={W.mid} />
        <Lantern cx={54} gy={-30} h={54} P={P} lit />
        <rect x={-96} y={-14} width={192} height={14} rx={5} fill={P.wood} stroke={P.ink} strokeWidth={W.mid} />
      </g>
    );
  }
  // ---- 등대섬 ----
  if (id === 't1') {  // 흔들리는 잔교
    return (
      <g>
        <path d={`M0 ${gy + 40} h${w} v120 h-${w} Z`} fill={lt(P.water, 0.1)} opacity={0.55} />
        {Array.from({ length: 10 }).map((_, i) => {
          const x = w * 0.1 + i * (w * 0.8 / 10);
          const dip = Math.sin((Math.PI * i) / 9) * 14;
          return (
            <g key={i}>
              <rect x={x} y={gy + 10 + dip} width={w * 0.8 / 10 - 8} height={14} rx={5} fill={P.wood} stroke={P.ink} strokeWidth={W.mid} />
              <rect x={x + 12} y={gy + 24 + dip} width={9} height={40} rx={4} fill={sh(P.wood, 0.88)} stroke={P.ink} strokeWidth={W.lo} />
            </g>
          );
        })}
      </g>
    );
  }
  if (id === 't3' || id === 't5') {  // 등대
    const lit = id === 't5';
    return (
      <g transform={`translate(${w * 0.72}, ${gy})`}>
        <GroundPlate cx={0} w={200} gy={0} P={P} />
        <path d="M-52 0 l14 -230 h76 l14 230 Z" fill={P.cream} stroke={P.ink} strokeWidth={W.hi} strokeLinejoin="round" />
        {[0, 1, 2].map((i) => <path key={i} d={`M-${46 - i * 8} ${-46 - i * 62} h${(46 - i * 8) * 2}`} stroke={P.lavender} strokeWidth={30} />)}
        <path d="M-52 0 l14 -230 h76 l14 230 Z" fill="none" stroke={P.ink} strokeWidth={W.hi} strokeLinejoin="round" />
        <rect x={-42} y={-268} width={84} height={38} rx={8} fill={P.wall} stroke={P.ink} strokeWidth={W.mid} />
        <path d="M0 -332 l50 60 h-100 Z" fill={P.lemon} stroke={P.ink} strokeWidth={W.hi} strokeLinejoin="round" />
        <path d="M0 -332 l50 60 h-50 Z" fill={sh(P.lemon, 0.9)} />
        {lit && <circle className="f-twinkle" cx={0} cy={-249} r={40} fill={P.lemon} opacity={0.35} />}
      </g>
    );
  }
  if (id === 'sx') {  // 이끼 낀 비석
    return (
      <g transform={`translate(${w * 0.22}, ${gy})`}>
        <GroundPlate cx={0} w={120} gy={0} P={P} />
        <path d="M-32 0 v-104 a32 32 0 0 1 64 0 v104 Z" fill={lt(P.wood, 0.25)} stroke={P.ink} strokeWidth={W.hi} strokeLinejoin="round" />
        <path d="M10 0 v-102 a32 32 0 0 0 -12 -26 a32 32 0 0 1 34 24 v104 Z" fill={sh(P.wood, 0.9)} opacity={0.6} />
        <path d="M-18 -78 h36 M-14 -62 h28 M-18 -46 h30" stroke={P.ink} strokeWidth={2.6} opacity={0.35} strokeLinecap="round" />
        <path d="M-32 -30 q16 -10 30 2 q14 12 34 0 v30 h-64 Z" fill={tone.accent} opacity={0.7} />
        <Bush cx={-44} gy={2} s={0.8} P={P} />
      </g>
    );
  }
  return null;
}

/* ---------------- 유형별 진행 시각화 ---------------- */
function Progress({ type, prog, target, room, P, tone, w, gy }) {
  const pct = Math.max(0, Math.min(1, prog / Math.max(1, target)));
  const done = (n) => Math.round(pct * n);

  if (type === 'search') {
    const n = Math.max(8, target);
    const cells = [];
    for (let i = 0; i < n; i++) {
      const col = i % Math.ceil(n / 2);
      const row = Math.floor(i / Math.ceil(n / 2));
      const x = w * 0.14 + col * ((w * 0.72) / Math.ceil(n / 2));
      const y = gy - 190 + row * 76;
      const on = i < prog;
      cells.push(
        <g key={i} className={on ? 'f-twinkle' : ''}>
          <circle cx={x} cy={y} r={26} fill={on ? P.lemon : 'none'} stroke={on ? P.deepLemon || P.ink : far(P.fog, 0.2)} strokeWidth={on ? W.hi : W.mid} opacity={on ? 1 : 0.55} />
          {on && <circle cx={x} cy={y} r={11} fill={lt(P.lemon, 0.5)} />}
        </g>
      );
    }
    return <g>{cells}</g>;
  }

  if (type === 'breach') {
    const n = 10, dn = done(n);
    const planks = [];
    const x0 = w * 0.12, span = w * 0.76;
    for (let i = 0; i < n; i++) {
      const x = x0 + (span / n) * i;
      const dip = Math.sin((Math.PI * (i + 0.5)) / n) * 26;
      planks.push(
        <g key={i} className={i < dn ? 'f-grow' : ''}>
          <rect x={x} y={gy - 150 + dip} width={span / n - 7} height={22} rx={7}
            fill={i < dn ? P.wood : 'none'} stroke={i < dn ? P.ink : far(P.fog, 0.25)} strokeWidth={i < dn ? W.mid : W.lo} opacity={i < dn ? 1 : 0.5} />
          {i < dn && <path d={`M${x + 6} ${gy - 144 + dip} h${span / n - 19}`} stroke={P.ink} strokeWidth={1.2} opacity={0.25} />}
        </g>
      );
    }
    return (
      <g>
        <path d={`M${x0 - 26} ${gy - 128} q${span / 2 + 26} 30 ${span + 52} 0`} stroke={P.ink} strokeWidth={2} fill="none" opacity={0.35} />
        {planks}
        <path d={`M${x0 - 30} ${gy - 160} v70 M${x0 + span + 30} ${gy - 160} v70`} stroke={P.ink} strokeWidth={W.hi} strokeLinecap="round" />
      </g>
    );
  }

  if (type === 'repair') {
    const photos = (room.submissions || []).filter((s) => s.status === 'approved' && s.photo).slice(0, 9);
    const cells = [];
    const cw = 120, ch = 96, ox = w / 2 - (cw * 3) / 2, oy = gy - 330;
    for (let i = 0; i < 9; i++) {
      const x = ox + (i % 3) * cw, y = oy + Math.floor(i / 3) * ch;
      const ph = photos[i];
      cells.push(
        <g key={i} className={ph ? 'f-pop' : ''}>
          {ph ? <>
            <defs><clipPath id={`c${i}`}><rect x={x + 4} y={y + 4} width={cw - 12} height={ch - 12} rx={8} /></clipPath></defs>
            <image href={ph.photo} x={x + 4} y={y + 4} width={cw - 12} height={ch - 12} preserveAspectRatio="xMidYMid slice" clipPath={`url(#c${i})`} />
            <rect x={x + 4} y={y + 4} width={cw - 12} height={ch - 12} rx={8} fill="none" stroke={P.ink} strokeWidth={W.hi} />
          </> : (
            <rect x={x + 4} y={y + 4} width={cw - 12} height={ch - 12} rx={8} fill={far(P.fog, 0.1)} stroke={far(P.fog, 0.3)} strokeWidth={W.mid} strokeDasharray="7 6" opacity={0.6} />
          )}
        </g>
      );
    }
    return (
      <g>
        <rect x={ox - 14} y={oy - 14} width={cw * 3 + 28} height={ch * 3 + 28} rx={16} fill="none" stroke={P.ink} strokeWidth={W.hi} opacity={0.5} />
        {cells}
      </g>
    );
  }

  if (type === 'carry') {
    const x = w * 0.08 + pct * w * 0.76;
    return (
      <g>
        <path d={`M${w * 0.06} ${gy - 6} h${w * 0.88}`} stroke={P.wood} strokeWidth={10} opacity={0.5} strokeLinecap="round" />
        <g transform={`translate(${x.toFixed(0)}, ${gy - 20})`} style={{ transition: 'transform 1s cubic-bezier(.2,.9,.3,1.2)' }}>
          <GroundPlate cx={0} w={140} gy={0} P={P} />
          <path d="M-56 0 v-64 q56 -22 112 0 v64 Z" fill={P.field ? P.field.care : P.pink} stroke={P.ink} strokeWidth={W.hi} strokeLinejoin="round" />
          <path d="M20 0 v-72 q20 4 36 8 v64 Z" fill={sh(P.pink, 0.92)} />
          <path d="M-56 -34 h112 M-30 -64 v64 M4 -70 v70" stroke={P.ink} strokeWidth={1.6} opacity={0.35} />
          <circle cx={-34} cy={4} r={13} fill={P.wood} stroke={P.ink} strokeWidth={W.mid} />
          <circle cx={34} cy={4} r={13} fill={P.wood} stroke={P.ink} strokeWidth={W.mid} />
        </g>
      </g>
    );
  }

  if (type === 'decode') {
    const dn = done(12);
    const cells = [];
    const cw = 84, ox = w / 2 - cw * 3, oy = gy - 300;
    for (let i = 0; i < 12; i++) {
      const x = ox + (i % 6) * cw, y = oy + Math.floor(i / 6) * cw;
      const on = i < dn;
      cells.push(
        <g key={i} className={on ? 'f-pop' : ''}>
          <rect x={x + 5} y={y + 5} width={cw - 12} height={cw - 12} rx={10} fill={on ? P.lavender : 'none'} stroke={on ? P.ink : far(P.fog, 0.3)} strokeWidth={on ? W.mid : W.lo} opacity={on ? 1 : 0.5} />
          {on && <path d={`M${x + 20} ${y + cw / 2} h${cw - 42} M${x + cw / 2 - 1} ${y + 20} v${cw - 42}`} stroke={P.ink} strokeWidth={2} opacity={0.5} strokeLinecap="round" />}
        </g>
      );
    }
    return (
      <g>
        <rect x={ox - 12} y={oy - 12} width={cw * 6 + 24} height={cw * 2 + 24} rx={18} fill={lt(P.wood, 0.3)} stroke={P.ink} strokeWidth={W.hi} />
        {cells}
      </g>
    );
  }

  if (type === 'raid') {
    const threads = [];
    const n = 12, remain = n - done(n);
    for (let i = 0; i < n; i++) {
      if (i >= remain) continue;
      const x = w / 2 - 190 + (380 / n) * i;
      threads.push(<path key={i} d={`M${x} ${gy - 300} q${(i % 2 ? 20 : -20)} 90 0 190`} stroke={P.lavender} strokeWidth={5} fill="none" opacity={0.75} strokeLinecap="round" />);
    }
    const woke = pct >= 1;
    return (
      <g>
        <g transform={`translate(${w / 2}, ${gy})`}>
          <GroundPlate cx={0} w={260} gy={0} P={P} />
          <path d="M-26 0 q6 -80 -10 -128 q30 16 34 -18 q10 38 34 22 q-22 38 -18 124 Z" fill={P.wood} stroke={P.ink} strokeWidth={W.hi} strokeLinejoin="round" />
          <g opacity={woke ? 1 : 0.78}>
            <Foliage cx={0} cy={-230} r={130} P={P} col={woke ? tone.accent : far(tone.accent, 0.35)} />
          </g>
          {woke && (
            <g>
              <path d="M-40 -244 q14 16 30 0" stroke={P.ink} strokeWidth={4} fill="none" strokeLinecap="round" />
              <path d="M14 -244 q14 16 30 0" stroke={P.ink} strokeWidth={4} fill="none" strokeLinecap="round" />
              {[0, 1, 2, 3, 4, 5].map((k) => (
                <path key={k} className="f-twinkle" d={`M${-170 + k * 68} -320 l10 -22 l10 22 l22 10 l-22 10 l-10 22 l-10 -22 l-22 -10 Z`} fill={P.lemon} opacity={0.9} style={{ animationDelay: `${k * 0.3}s` }} />
              ))}
            </g>
          )}
        </g>
        {threads}
      </g>
    );
  }

  // explore — 안개가 걷히며 지형이 드러남 (진행도는 안개 두께로 표현)
  return null;
}

/* ---------------- 원정 필드 씬 ---------------- */
export default function FieldScene({ room, site, segment, width = 1600, height = 760, crowd = [] }) {
  const P = pickPalette({ phase: room.phase, weather: room.weather, examMode: room.examMode });
  const tone = SITE_TONE[site?.id] || SITE_TONE.forest;
  const kind = site?.id === 'mine' ? 'rock' : 'tree';
  const gy = height - 120;
  const seed = useMemo(() => (room.code || 'X') + (segment?.id || ''), [room.code, segment?.id]);
  const pct = Math.max(0, Math.min(1, room.prog / Math.max(1, room.target)));
  const fogOpacity = Math.max(0, 0.74 - pct * 0.62);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%" preserveAspectRatio="xMidYMax slice" style={{ display: 'block' }}>
      {/* 1. 하늘 */}
      <rect width={width} height={height} fill={P.sky} />
      <rect y={height * 0.34} width={width} height={height * 0.66} fill={P.skyLow} />

      {/* 2. 원경 */}
      <FarLayer P={P} tone={tone} w={width} y={gy - 118} seed={seed} kind={kind} />

      {/* 3. 중경 */}
      <MidLayer P={P} tone={tone} w={width} y={gy - 30} seed={seed} kind={kind} />

      {/* 4. 지면 */}
      <path d={`M0 ${gy} q${width / 3} -22 ${width * 0.66} 6 T${width} ${gy + 6} L${width} ${height} L0 ${height} Z`} fill={tone.ground} stroke={P.ink} strokeWidth={W.mid} strokeLinejoin="round" />
      <path d={`M0 ${gy + 34} q${width / 4} -14 ${width / 2} 2 T${width} ${gy + 40} L${width} ${height} L0 ${height} Z`} fill={sh(tone.ground, 0.94)} />
      {[0.08, 0.26, 0.52, 0.74, 0.92].map((t, i) => (
        <path key={i} d={`M${width * t} ${gy + 16 + i * 5} q9 -12 18 0`} stroke={sh(tone.ground, 0.84)} strokeWidth={W.mid} fill="none" strokeLinecap="round" />
      ))}

      {/* 4.5 구간 랜드마크 */}
      <Landmark id={segment?.id} P={P} tone={tone} w={width} gy={gy} />

      {/* 5. 유형별 진행 */}
      <Progress type={room.expType} prog={room.prog} target={room.target} room={room} P={P} tone={tone} w={width} gy={gy} />

      {/* 5.5 원정대 — 실제 접속한 말랑이들이 필드에 선다 */}
      {crowd.length > 0 && (
        <g>
          {crowd.map((st, i) => {
            const t = crowd.length === 1 ? 0.5 : i / (crowd.length - 1);
            const x = width * 0.12 + width * 0.76 * t;
            const y = gy + 16 + (i % 3) * 12;
            const size = 62 - (i % 3) * 6;
            return (
              <g key={st.id} transform={`translate(${x.toFixed(0)}, ${y.toFixed(0)})`} className="f-float" style={{ animationDelay: `${(i % 5) * 0.5}s` }}>
                <ellipse cx={0} cy={4} rx={size * 0.42} ry={6} fill={sh(tone.ground, 0.86)} />
                <g transform={`translate(${-size / 2}, ${-size * 1.1})`}>
                  <Malang color={st.color} face={i % 4 === 0 ? 'glad' : 'base'} size={size} form={st.form} acc={st.wearing} />
                </g>
              </g>
            );
          })}
        </g>
      )}

      {/* 6. 안개 — 진행할수록 걷힌다 */}
      <g className="f-fog" style={{ pointerEvents: 'none' }} opacity={fogOpacity}>
        <rect x={-80} y={0} width={width + 160} height={height} fill={P.fog} />
        <ellipse cx={width * 0.2} cy={gy - 120} rx={330} ry={110} fill="#FFFFFF" opacity={0.35} />
        <ellipse cx={width * 0.72} cy={gy - 170} rx={380} ry={120} fill="#FFFFFF" opacity={0.3} />
      </g>
    </svg>
  );
}
