'use client';
import React from 'react';
import { W, sh, lt } from '@/lib/art/tokens';
import { GroundPlate, Bricks, PlankDoor, ArchWindow, Tree, Bush, Flowers, Lantern, RoofLines } from './Primitives';

/* 공통: 1단계는 토대 + 천막 */
function Tent({ x, gy, w, P }) {
  return (
    <g>
      <path d={`M${x + w / 2} ${gy - 72} L${x + 4} ${gy - 15} L${x + w - 4} ${gy - 15} Z`} fill={P.wall} stroke={P.ink} strokeWidth={W.hi} strokeLinejoin="round" />
      <path d={`M${x + w / 2} ${gy - 72} v57`} stroke={P.ink} strokeWidth={W.lo} opacity={0.4} />
    </g>
  );
}

/* ---------------- 도서관 (질문·탐구) ---------------- */
export function Library({ x, gy, stage = 4, P, t = {} }) {
  const w = 126, cx = x + w / 2;
  const pitch = t.roofPitch || 1;
  const rh = 58 * pitch;
  return (
    <g>
      <GroundPlate cx={cx} w={w + 52} gy={gy} P={P} />
      <Bricks x={x - 7} y={gy - 15} w={w + 14} h={15} P={P} />
      {stage === 1 ? <Tent x={x} gy={gy} w={w} P={P} /> : (
        <g>
          <rect x={x} y={gy - 79} width={w} height={64} rx={7} fill={P.wall} stroke={P.ink} strokeWidth={W.hi} />
          <path d={`M${x + w - 18} ${gy - 16} v-62 h18 v62 Z`} fill={sh(P.wall, 0.94)} />
          <path d={`M${cx} ${gy - 73 - rh} L${x - 16} ${gy - 73} L${x + w + 16} ${gy - 73} Z`} fill={P.field.ask} stroke={P.ink} strokeWidth={W.hi} strokeLinejoin="round" />
          <path d={`M${cx} ${gy - 73 - rh} L${x + w + 16} ${gy - 73} L${cx + 6} ${gy - 73} Z`} fill={sh(P.field.ask, 0.92)} />
          <RoofLines cx={cx} gy={gy - 73} halfW={w / 2 + 16} height={rh} P={P} />
          <path d={`M${cx} ${gy - 73 - rh} v${rh}`} stroke={P.ink} strokeWidth={W.lo} opacity={0.32} />
          <path d={`M${cx - 12} ${gy - 77 - rh} h24 a4 4 0 0 1 0 8 h-24 a4 4 0 0 1 0 -8 Z`} fill={P.mint} stroke={P.ink} strokeWidth={W.mid} />
        </g>
      )}
      {stage >= 3 && (
        <g>
          <PlankDoor cx={cx} y={gy - 15} P={P} />
          <ArchWindow cx={x + 24} cy={gy - 56} P={P} />
          <ArchWindow cx={x + w - 24} cy={gy - 56} P={P} />
        </g>
      )}
      {stage >= 4 && (
        <g>
          <Tree cx={x + (t.treeSide === 1 ? w + 40 : -40)} gy={gy - 15} s={0.95} P={P} />
          <Bush cx={x + (t.treeSide === 1 ? -22 : w + 24)} gy={gy - 15} s={0.9} P={P} />
          <Flowers x={x + 18} gy={gy - 13} n={2} P={P} hue={t.flowerHue} />
          <path d={`M${x + w - 4} ${gy - 86} h16`} stroke={P.ink} strokeWidth={W.mid} strokeLinecap="round" />
          <path d={`M${x + w + 11} ${gy - 86} v7`} stroke={P.ink} strokeWidth={1.6} />
          <rect x={x + w + 1} y={gy - 79} width={20} height={15} rx={4} fill={P.lemon} stroke={P.ink} strokeWidth={W.mid} />
          <path d={`M${x + w + 6} ${gy - 72} h10 M${x + w + 6} ${gy - 68} h7`} stroke={P.ink} strokeWidth={1.2} opacity={0.45} />
        </g>
      )}
    </g>
  );
}

/* ---------------- 공방 (창의·제작) ---------------- */
export function Workshop({ x, gy, stage = 4, P, t = {} }) {
  const w = 132, cx = x + w / 2;
  const gears = [];
  for (let i = 0; i < 24; i++) {
    const rr = i % 2 === 0 ? 19 : 19 * 0.72;
    const a = (Math.PI * 2 * i) / 24;
    gears.push(`${(x + 30 + rr * Math.cos(a)).toFixed(1)} ${(gy - 104 + rr * Math.sin(a)).toFixed(1)}`);
  }
  const tileMarks = [];
  for (let i = 1; i <= 6; i++) {
    const tt = i / 7;
    const xx = x - 16 + (w + 32) * tt;
    const yy = gy - 71 - 31 * Math.sin(Math.PI * tt);
    tileMarks.push(<path key={i} d={`M${xx.toFixed(1)} ${yy.toFixed(1)} q3 7 0 13`} stroke={P.ink} strokeWidth={1.3} fill="none" opacity={0.28} strokeLinecap="round" />);
  }
  return (
    <g>
      <GroundPlate cx={cx} w={w + 40} gy={gy} P={P} />
      <Bricks x={x - 7} y={gy - 15} w={w + 14} h={15} P={P} />
      {stage === 1 ? <Tent x={x} gy={gy} w={w} P={P} /> : (
        <g>
          <rect x={x} y={gy - 77} width={w} height={62} rx={7} fill={P.wall} stroke={P.ink} strokeWidth={W.hi} />
          <path d={`M${x + w - 20} ${gy - 16} v-60 h18 v60 Z`} fill={sh(P.wall, 0.94)} />
          <path d={`M${x - 16} ${gy - 71} q${w / 2 + 16} -62 ${w + 32} 0 Z`} fill={P.field.make} stroke={P.ink} strokeWidth={W.hi} strokeLinejoin="round" />
          <path d={`M${cx} ${gy - 102} q${w / 2 + 16} 8 ${w / 2 + 16} 31 h-${w / 2 + 16} Z`} fill={sh(P.field.make, 0.92)} opacity={0.9} />
          {tileMarks}
        </g>
      )}
      {stage >= 3 && (
        <g>
          <PlankDoor cx={cx + 20} y={gy - 15} w={28} h={42} P={P} />
          <ArchWindow cx={x + 26} cy={gy - 54} w={22} h={26} P={P} />
        </g>
      )}
      {stage >= 4 && (
        <g>
          <rect x={x + w - 42} y={gy - 124} width={19} height={34} rx={5} fill={P.peach} stroke={P.ink} strokeWidth={W.mid} />
          <rect x={x + w - 45} y={gy - 128} width={25} height={8} rx={4} fill={sh(P.peach, 0.9)} stroke={P.ink} strokeWidth={W.mid} />
          <path d={`M${x + w - 33} ${gy - 134} q-11 -10 1 -17 q13 -6 6 -16`} stroke={P.ink} strokeWidth={W.mid} fill="none" strokeLinecap="round" opacity={0.42} />
          <path d={`M${gears.join(' L')} Z`} fill={P.peach} stroke={P.ink} strokeWidth={W.mid} strokeLinejoin="round" />
          <circle cx={x + 30} cy={gy - 104} r={6.5} fill={P.wall} stroke={P.ink} strokeWidth={W.mid} />
          <rect x={x - 4} y={gy - 36} width={42} height={21} rx={5} fill={P.wood} stroke={P.ink} strokeWidth={W.mid} />
          <path d={`M${x + 4} ${gy - 36} v-12 M${x + 14} ${gy - 36} v-9 M${x + 24} ${gy - 36} v-13`} stroke={P.ink} strokeWidth={W.mid} strokeLinecap="round" opacity={0.7} />
          <Bush cx={x + w + 18} gy={gy - 15} s={0.8} P={P} />
        </g>
      )}
    </g>
  );
}

/* ---------------- 광장 (협력·배려) ---------------- */
export function Plaza({ x, gy, stage = 4, P, t = {} }) {
  const w = 148, cx = x + w / 2;
  const bricks = [];
  for (let i = 0; i < 6; i++) bricks.push(<path key={i} d={`M${x + 8 + i * 24} ${gy - 4} v-7`} stroke={P.ink} strokeWidth={1.2} opacity={0.28} />);
  const archMarks = [];
  for (let i = 1; i <= 7; i++) {
    const a = (Math.PI * i) / 8;
    const rx = cx - (w / 2 - 12) * Math.cos(a);
    const ry = gy - 66 - (w / 2 - 12) * Math.sin(a);
    archMarks.push(<path key={i} d={`M${rx.toFixed(1)} ${ry.toFixed(1)} l${(6 * Math.cos(a)).toFixed(1)} ${(-6 * Math.sin(a)).toFixed(1)}`} stroke={P.ink} strokeWidth={1.3} opacity={0.28} />);
  }
  const flags = [P.lemon, P.mint, P.pink, P.lavender, P.peach];
  return (
    <g>
      <GroundPlate cx={cx} w={w + 30} gy={gy} P={P} />
      <path d={`M${x - 8} ${gy} h${w + 16} v-13 q-${w / 2 + 8} -9 -${w + 16} 0 Z`} fill={P.wood} stroke={P.ink} strokeWidth={W.mid} strokeLinejoin="round" />
      {bricks}
      {stage === 1 ? (
        <g>
          <Bricks x={x + 16} y={gy - 52} w={20} h={38} P={P} fill={P.field.care} />
          <Bricks x={x + w - 36} y={gy - 52} w={20} h={38} P={P} fill={P.field.care} />
        </g>
      ) : (
        <g>
          <path d={`M${x + 12} ${gy - 14} v-52 a${w / 2 - 12} ${w / 2 - 12} 0 0 1 ${w - 24} 0 v52 h-24 v-46 a${w / 2 - 36} ${w / 2 - 36} 0 0 0 -${w - 72} 0 v46 Z`} fill={P.field.care} stroke={P.ink} strokeWidth={W.hi} strokeLinejoin="round" />
          <path d={`M${x + w - 36} ${gy - 14} v-46 a${w / 2 - 36} ${w / 2 - 36} 0 0 0 -8 -28 a${w / 2 - 12} ${w / 2 - 12} 0 0 1 32 22 v52 Z`} fill={sh(P.field.care, 0.93)} />
          {archMarks}
        </g>
      )}
      {stage >= 3 && (
        <g>
          <ellipse cx={cx} cy={gy - 20} rx={30} ry={12} fill={lt(P.water, 0.25)} stroke={P.ink} strokeWidth={W.mid} />
          <ellipse cx={cx} cy={gy - 22} rx={23} ry={8} fill={lt(P.water, 0.55)} />
          <path d={`M${cx} ${gy - 28} v-18`} stroke={P.ink} strokeWidth={W.mid} strokeLinecap="round" />
          <ellipse cx={cx} cy={gy - 49} rx={11} ry={5.5} fill={lt(P.water, 0.4)} stroke={P.ink} strokeWidth={W.mid} />
          <path d={`M${cx - 7} ${gy - 52} q-5 -9 2 -13 M${cx + 7} ${gy - 52} q5 -9 -2 -13`} stroke={P.ink} strokeWidth={1.6} fill="none" opacity={0.5} strokeLinecap="round" />
        </g>
      )}
      {stage >= 4 && (
        <g>
          <Lantern cx={x - 10} gy={gy - 14} P={P} lit={P.id === 'night'} />
          <Lantern cx={x + w + 10} gy={gy - 14} P={P} lit={P.id === 'night'} />
          <Bush cx={x + w + 30} gy={gy - 15} s={0.82} P={P} />
          <Flowers x={x - 34} gy={gy - 13} n={2} P={P} hue={t.flowerHue} />
          {t.banner !== false && (
            <g>
              <path d={`M${x - 10} ${gy - 83} q${w / 2 + 10} 22 ${w + 20} 0`} stroke={P.ink} strokeWidth={1.6} fill="none" opacity={0.55} />
              {flags.map((cl, i) => {
                const tt = (i + 1) / 6;
                const px = x - 10 + (w + 20) * tt;
                const py = gy - 83 + 22 * Math.sin(Math.PI * tt) * 0.92;
                return <path key={i} d={`M${px.toFixed(1)} ${py.toFixed(1)} l6 0 l-3 9 Z`} fill={cl} stroke={P.ink} strokeWidth={1.4} strokeLinejoin="round" />;
              })}
            </g>
          )}
        </g>
      )}
    </g>
  );
}

/* ---------------- 등대 (도전·발표) ---------------- */
export function Lighthouse({ x, gy, stage = 4, P }) {
  const w = 86, cx = x + w / 2;
  const H = stage <= 2 ? 96 : 132;
  const stripes = [];
  if (stage >= 2) {
    for (let i = 0; i < 3; i++) {
      const y0 = gy - 15 - ((i * 2 + 1) * H) / 7;
      const t0 = (gy - 15 - y0) / H;
      const halfw = w / 2 - 6 - (w / 2 - 6 - 11) * t0;
      stripes.push(<path key={i} d={`M${(cx - halfw).toFixed(1)} ${y0.toFixed(1)} h${(halfw * 2).toFixed(1)}`} stroke={P.field.dare} strokeWidth={H / 7} />);
    }
  }
  return (
    <g>
      <GroundPlate cx={cx} w={w + 34} gy={gy} P={P} />
      <Bricks x={x - 10} y={gy - 15} w={w + 20} h={15} P={P} />
      {stage === 1 ? (
        <path d={`M${x + 12} ${gy - 15} l9 -46 h${w - 42} l9 46 Z`} fill={P.wall} stroke={P.ink} strokeWidth={W.hi} strokeLinejoin="round" />
      ) : (
        <g>
          <path d={`M${x + 6} ${gy - 15} l11 -${H} h${w - 34} l11 ${H} Z`} fill={P.wall} stroke={P.ink} strokeWidth={W.hi} strokeLinejoin="round" />
          {stripes}
          <path d={`M${x + w - 17} ${gy - 16} l-11 -${H} h9 l11 ${H} Z`} fill={sh(P.wall, 0.93)} opacity={0.8} />
          <path d={`M${x + 6} ${gy - 15} l11 -${H} h${w - 34} l11 ${H} Z`} fill="none" stroke={P.ink} strokeWidth={W.hi} strokeLinejoin="round" />
          <rect x={x + 12} y={gy - 15 - H - 20} width={w - 24} height={20} rx={6} fill={P.wall} stroke={P.ink} strokeWidth={W.mid} />
          <path d={`M${x + 18} ${gy - 19 - H} v-13 M${cx} ${gy - 19 - H} v-13 M${x + w - 18} ${gy - 19 - H} v-13`} stroke={P.ink} strokeWidth={1.4} opacity={0.38} />
          <path d={`M${x + 8} ${gy - 15 - H - 20} h${w - 16} a3 3 0 0 0 0 -6 h-${w - 16} a3 3 0 0 0 0 6 Z`} fill={P.field.dare} stroke={P.ink} strokeWidth={W.mid} />
          <path d={`M${cx} ${gy - 15 - H - 72} l${w / 2 - 4} 46 h-${w - 8} Z`} fill={P.lemon} stroke={P.ink} strokeWidth={W.hi} strokeLinejoin="round" />
          <path d={`M${cx} ${gy - 15 - H - 72} l${w / 2 - 4} 46 h-${w / 2 - 4} Z`} fill={sh(P.lemon, 0.92)} />
          <circle cx={cx} cy={gy - 15 - H - 76} r={5} fill={P.peach} stroke={P.ink} strokeWidth={W.mid} />
        </g>
      )}
      {stage >= 3 && (
        <g>
          <PlankDoor cx={cx} y={gy - 15} w={24} h={38} P={P} />
          <ArchWindow cx={cx} cy={gy - 15 - H * 0.62} w={18} h={22} P={P} />
        </g>
      )}
      {stage >= 4 && (
        <g>
          {[0, 1, 2].map((k) => (
            <path key={k} d={`M${cx + w / 2 + 6 + k * 9} ${gy - 15 - H - 9 - k * 5} l7 -4`} stroke={P.lemon} strokeWidth={3.4} strokeLinecap="round" opacity={0.75 - k * 0.2} />
          ))}
          <Bush cx={x - 20} gy={gy - 15} s={0.78} P={P} />
          <Bush cx={x + w + 18} gy={gy - 15} s={0.7} P={P} />
        </g>
      )}
    </g>
  );
}

/* ---------------- 정원 (꾸준함·완수) ---------------- */
export function Garden({ x, gy, stage = 4, P, t = {} }) {
  const w = 140, cx = x + w / 2;
  const stones = [];
  if (stage >= 2) {
    for (let i = 0; i < 9; i++) {
      const xx = x + 4 + (i * (w - 8)) / 9;
      const yy = gy - 20 - 9 * Math.sin((Math.PI * (i + 0.5)) / 9);
      stones.push(<rect key={i} x={xx.toFixed(1)} y={yy.toFixed(1)} width={((w - 8) / 9 - 3).toFixed(1)} height={11} rx={4} fill={P.wood} stroke={P.ink} strokeWidth={1.7} />);
    }
  }
  const vines = [[-28, -40], [-14, -58], [0, -66], [16, -56], [28, -38]];
  return (
    <g>
      <GroundPlate cx={cx} w={w + 24} gy={gy} P={P} />
      <path d={`M${x} ${gy - 14} q${w / 2} -16 ${w} 0 v14 q-${w / 2} 8 -${w} 0 Z`} fill={sh(P.grass, 0.94)} stroke={P.ink} strokeWidth={W.mid} strokeLinejoin="round" />
      <path d={`M${x} ${gy - 14} q${w / 2} -16 ${w} 0 q-${w / 2} 8 -${w} 0 Z`} fill={P.field.keep} stroke={P.ink} strokeWidth={W.mid} strokeLinejoin="round" />
      {stones}
      {stage >= 2 && (<g><Bush cx={x + 16} gy={gy - 20} s={0.85} P={P} /><Bush cx={x + w - 16} gy={gy - 20} s={0.85} P={P} /></g>)}
      {stage >= 3 && (
        <g>
          <path d={`M${cx - 30} ${gy - 22} v-30 a30 30 0 0 1 60 0 v30`} fill="none" stroke={P.ink} strokeWidth={W.hi} strokeLinejoin="round" />
          <path d={`M${cx - 30} ${gy - 46} h60 M${cx - 25} ${gy - 60} h50 M${cx - 13} ${gy - 22} v-46 M${cx + 13} ${gy - 22} v-46`} stroke={P.ink} strokeWidth={1.5} opacity={0.42} />
          {vines.map(([dx, dy], i) => (
            <g key={i}>
              <circle cx={cx + dx} cy={gy + dy} r={7} fill={P.leaf} stroke={P.ink} strokeWidth={1.6} />
              <circle cx={cx + dx + 3} cy={gy + dy - 3} r={2.6} fill={P.pink} stroke={P.ink} strokeWidth={1.2} />
            </g>
          ))}
        </g>
      )}
      {stage >= 4 && (
        <g>
          <Flowers x={x + 26} gy={gy - 22} n={3} P={P} hue={t.flowerHue} />
          <Flowers x={x + w - 52} gy={gy - 22} n={2} P={P} hue="lavender" />
          <path d={`M${x + w - 30} ${gy - 22} v-14 h16 v14 Z`} fill={P.mint} stroke={P.ink} strokeWidth={W.mid} strokeLinejoin="round" />
          <path d={`M${x + w - 14} ${gy - 33} l10 -5 l1 5`} fill="none" stroke={P.ink} strokeWidth={W.mid} strokeLinejoin="round" />
          <path d={`M${x + w - 30} ${gy - 33} q-7 -6 0 -9`} fill="none" stroke={P.ink} strokeWidth={W.mid} />
          {[0, 1, 2].map((i) => <path key={i} d={`M${x + 18 + i * 20} ${gy - 6} q6 -6 12 0`} stroke={sh(P.grass, 0.82)} strokeWidth={W.mid} fill="none" />)}
        </g>
      )}
    </g>
  );
}

export const BUILDING_BY_FIELD = { ask: Library, make: Workshop, care: Plaza, dare: Lighthouse, keep: Garden };
export const BUILDING_WIDTH = { ask: 126, make: 132, care: 148, dare: 86, keep: 140 };
export const BUILDING_NAME = { ask: '도서관', make: '공방', care: '광장', dare: '등대', keep: '정원' };
