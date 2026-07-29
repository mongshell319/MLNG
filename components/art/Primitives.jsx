'use client';
import React from 'react';
import { W, sh, lt } from '@/lib/art/tokens';

/* 지면 플레이트 — 드롭섀도가 아니라 플랫한 색면 */
export function GroundPlate({ cx, w, gy, P }) {
  return <ellipse cx={cx} cy={gy + 3} rx={w / 2} ry={7} fill={sh(P.grass, 0.93)} />;
}

/* 벽돌 토대 — 반복 스트로크 텍스처 */
export function Bricks({ x, y, w, h, P, fill }) {
  const col = fill || P.wood;
  const lines = [];
  const mid = y + h / 2;
  lines.push(<path key="m" d={`M${x + 3} ${mid} h${w - 6}`} stroke={P.ink} strokeWidth={1.2} opacity={0.26} />);
  for (let r = 0; r < 2; r++) {
    const yy = y + (h * r) / 2;
    const off = r % 2 === 0 ? 0 : w / 8;
    for (let i = 0; i < 4; i++) {
      const xx = x + off + (w * (i + 0.5)) / 4;
      if (xx > x + 3 && xx < x + w - 3) {
        lines.push(<path key={`b${r}${i}`} d={`M${xx.toFixed(1)} ${yy + 1} v${h / 2 - 2}`} stroke={P.ink} strokeWidth={1.2} opacity={0.26} />);
      }
    }
  }
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={5} fill={col} stroke={P.ink} strokeWidth={W.mid} />
      {lines}
    </g>
  );
}

/* 판자문 — 아치형 + 결 */
export function PlankDoor({ cx, y, w = 26, h = 40, P }) {
  const col = P.wood;
  return (
    <g>
      <path d={`M${cx - w / 2} ${y} v-${h - w / 2} a${w / 2} ${w / 2} 0 0 1 ${w} 0 v${h - w / 2} Z`} fill={col} stroke={P.ink} strokeWidth={W.mid} strokeLinejoin="round" />
      <path d={`M${cx + w / 2 - 7} ${y} v-${h - w / 2 - 2} a7 7 0 0 0 -7 -7`} fill={sh(col, 0.88)} opacity={0.55} />
      <path d={`M${cx - w / 6} ${y - 3} v-${h - w / 2 - 6} M${cx + w / 6} ${y - 3} v-${h - w / 2 - 6}`} stroke={P.ink} strokeWidth={1.2} opacity={0.3} />
      <circle cx={cx + w / 2 - 6} cy={y - h / 2 + 3} r={2.4} fill={P.ink} opacity={0.8} />
    </g>
  );
}

/* 아치창 — 유리 하이라이트 포함 */
export function ArchWindow({ cx, cy, w = 20, h = 24, P }) {
  const glass = lt(P.water, 0.35);
  return (
    <g>
      <path d={`M${cx - w / 2} ${cy + h / 2} v-${h - w / 2} a${w / 2} ${w / 2} 0 0 1 ${w} 0 v${h - w / 2} Z`} fill={glass} stroke={P.ink} strokeWidth={W.mid} strokeLinejoin="round" />
      <path d={`M${cx - w / 2 + 3} ${cy + h / 2 - 4} l${w / 2} -${(h * 0.62).toFixed(1)}`} stroke="#FFFFFF" strokeWidth={4} opacity={0.6} strokeLinecap="round" />
      <path d={`M${cx} ${cy + h / 2} v-${h - 2} M${cx - w / 2} ${cy + 2} h${w}`} stroke={P.ink} strokeWidth={1.4} opacity={0.5} />
    </g>
  );
}

/* 잎 덩어리 — 겹친 로브 + 하부 어두운 톤 */
export function Foliage({ cx, cy, r = 34, P, col }) {
  const c = col || P.leaf;
  const d = sh(c, 0.86);
  const lobes = [[-r * 0.55, r * 0.1, r * 0.62], [r * 0.55, r * 0.12, r * 0.6], [0, -r * 0.3, r * 0.78], [-r * 0.25, -r * 0.62, r * 0.48], [r * 0.3, -r * 0.55, r * 0.44]];
  return (
    <g>
      <path d={`M${cx - r * 0.9} ${cy + r * 0.3} q${r * 0.9} ${r * 0.55} ${r * 1.8} 0 q-${r * 0.6} ${r * 0.35} -${r * 1.8} 0 Z`} fill={d} opacity={0.9} />
      {lobes.map(([lx, ly, lr], i) => <circle key={i} cx={cx + lx} cy={cy + ly} r={lr} fill={c} />)}
      <path
        d={`M${cx - r * 0.95} ${cy + r * 0.15} q${r * 0.1} -${r * 0.75} ${r * 0.72} -${r * 0.95} q${r * 0.55} -${r * 0.42} ${r * 1.05} -${r * 0.05} q${r * 0.62} ${r * 0.05} ${r * 0.55} ${r * 0.72} q${r * 0.28} ${r * 0.62} -${r * 0.45} ${r * 0.85} q-${r * 0.9} ${r * 0.4} -${r * 1.87} 0 Z`}
        fill="none" stroke={P.ink} strokeWidth={W.mid} strokeLinejoin="round" />
      {[0, 1, 2].map((i) => (
        <path key={i} d={`M${cx - r * 0.4 + i * r * 0.4} ${cy - r * 0.05 + i * 3} q${r * 0.16} ${r * 0.13} ${r * 0.32} 0`} stroke={P.ink} strokeWidth={1.3} fill="none" opacity={0.26} strokeLinecap="round" />
      ))}
    </g>
  );
}

export function Tree({ cx, gy, s = 1, P }) {
  return (
    <g transform={`translate(${cx},${gy}) scale(${s})`}>
      <path d="M-9 0 q2 -30 -3 -46 q10 6 12 -6 q3 14 12 8 q-8 14 -6 44 Z" fill={P.wood} stroke={P.ink} strokeWidth={W.mid} strokeLinejoin="round" />
      <Foliage cx={0} cy={-72} r={40} P={P} />
    </g>
  );
}

export function Bush({ cx, gy, s = 1, P }) {
  return <g transform={`translate(${cx},${gy}) scale(${s})`}><Foliage cx={0} cy={-14} r={20} P={P} /></g>;
}

export function Flowers({ x, gy, n = 3, P, hue = 'pink' }) {
  const cols = { pink: [P.pink, P.lemon, P.lavender], lemon: [P.lemon, P.peach, P.pink], lavender: [P.lavender, P.pink, P.mint] }[hue] || [P.pink];
  const out = [];
  for (let i = 0; i < n; i++) {
    const cx = x + i * 15;
    const c = cols[i % cols.length];
    out.push(<path key={`s${i}`} d={`M${cx} ${gy - 4} v-11`} stroke={sh(P.leaf, 0.8)} strokeWidth={1.8} strokeLinecap="round" />);
    for (let k = 0; k < 5; k++) {
      const a = (Math.PI * 2 * k) / 5 - Math.PI / 2;
      out.push(<circle key={`p${i}${k}`} cx={(cx + 4.2 * Math.cos(a)).toFixed(1)} cy={(gy - 19 + 4.2 * Math.sin(a)).toFixed(1)} r={3} fill={c} stroke={P.ink} strokeWidth={1.1} />);
    }
    out.push(<circle key={`c${i}`} cx={cx} cy={gy - 19} r={1.9} fill={P.lemon} stroke={P.ink} strokeWidth={1} />);
  }
  return <g>{out}</g>;
}

export function Lantern({ cx, gy, h = 46, P, lit = false }) {
  return (
    <g>
      <rect x={cx - 5} y={gy - h} width={10} height={h} rx={5} fill={P.wood} stroke={P.ink} strokeWidth={W.mid} />
      <path d={`M${cx - 14} ${gy - h - 2} h28 l-6 -21 h-16 Z`} fill={P.lemon} stroke={P.ink} strokeWidth={W.mid} strokeLinejoin="round" />
      <path d={`M${cx - 9} ${gy - h - 10} h18`} stroke={P.ink} strokeWidth={1.2} opacity={0.35} />
      {lit && <circle className="f-twinkle" cx={cx} cy={gy - h - 12} r={16} fill={P.lemon} opacity={0.28} />}
    </g>
  );
}

/* 지붕 결 — 저투명도 반복선 */
export function RoofLines({ cx, gy, halfW, height, P, n = 4 }) {
  const out = [];
  for (let i = 1; i <= n; i++) {
    const t = i / (n + 1);
    const yy = gy - height * t;
    const hw = halfW * (1 - t);
    out.push(<path key={i} d={`M${(cx - hw).toFixed(1)} ${yy.toFixed(1)} h${(hw * 2).toFixed(1)}`} stroke={P.ink} strokeWidth={1.2} opacity={0.2} />);
  }
  return <g>{out}</g>;
}

export function Monument({ cx, gy, P, label }) {
  return (
    <g>
      <GroundPlate cx={cx} w={70} gy={gy} P={P} />
      <path d={`M${cx - 22} ${gy} v-52 a22 22 0 0 1 44 0 v52 Z`} fill={P.wall} stroke={P.ink} strokeWidth={W.hi} strokeLinejoin="round" />
      <path d={`M${cx + 8} ${gy} v-50 a22 22 0 0 0 -8 -18 a22 22 0 0 1 22 20 v48 Z`} fill={sh(P.wall, 0.93)} />
      <path d={`M${cx - 11} ${gy - 34} h22 M${cx - 8} ${gy - 24} h16`} stroke={P.ink} strokeWidth={1.4} opacity={0.4} />
      <circle cx={cx} cy={gy - 52} r={6} fill={P.lemon} stroke={P.ink} strokeWidth={W.mid} />
    </g>
  );
}
