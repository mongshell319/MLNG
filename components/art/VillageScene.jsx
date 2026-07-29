'use client';
import React, { useMemo } from 'react';
import { W, sh, far, pickPalette } from '@/lib/art/tokens';
import { villageTraits, rng } from '@/lib/art/seed';
import { BUILDING_BY_FIELD, BUILDING_WIDTH, BUILDING_NAME } from './Buildings';
import { Tree, Bush, Flowers, Lantern, Monument, GroundPlate } from './Primitives';

/* 원경 언덕 — 실루엣 + 3톤 색면 (대기 원근) */
function Hills({ P, seed, w, y }) {
  const r = rng(seed);
  const layer = (col, base, amp, n) => {
    let d = `M0 ${y + 120} L0 ${base}`;
    for (let i = 0; i <= n; i++) {
      const x1 = (w / n) * i;
      const h = base - amp * (0.45 + r() * 0.55);
      d += ` Q${(x1 - w / n / 2).toFixed(0)} ${h.toFixed(0)} ${x1.toFixed(0)} ${base.toFixed(0)}`;
    }
    d += ` L${w} ${y + 120} Z`;
    return <path d={d} fill={col} />;
  };
  return (
    <g>
      {layer(P.hillFar, y, 74, 5)}
      {layer(P.hillNear, y + 22, 52, 7)}
    </g>
  );
}

export default function VillageScene({ room, width = 1600, height = 760, showLabels = false }) {
  const P = pickPalette({ phase: room.phase, weather: room.weather, examMode: room.examMode });
  const t = useMemo(() => villageTraits(room.code), [room.code]);
  const gy = height - 150;

  // 시드가 정한 순서와 간격으로 건물을 세운다 — 반마다 마을이 다르게 생긴다
  const widths = t.order.map((f) => BUILDING_WIDTH[f]);
  const total = widths.reduce((a, b) => a + b, 0) + t.gap * 4;
  let cursor = (width - total) / 2;
  const placed = t.order.map((f, i) => {
    const x = cursor;
    cursor += widths[i] + t.gap;
    return { field: f, x, w: widths[i] };
  });

  const night = P.id === 'night';

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%" preserveAspectRatio="xMidYMax slice" style={{ display: 'block' }}>
      {/* 하늘 */}
      <rect width={width} height={height} fill={P.sky} />
      <rect y={height * 0.42} width={width} height={height * 0.58} fill={P.skyLow} />
      {night && [...Array(26)].map((_, i) => (
        <circle key={i} className="f-twinkle" cx={(i * 137) % width} cy={40 + ((i * 79) % (height * 0.36))} r={i % 4 === 0 ? 2.6 : 1.7} fill={P.lemon} opacity={0.85} style={{ animationDelay: `${(i % 7) * 0.4}s` }} />
      ))}

      <Hills P={P} seed={t.hillSeed} w={width} y={gy - 96} />

      {/* 지면 */}
      <path d={`M0 ${gy + 4} q${width / 4} -18 ${width / 2} 0 q${width / 4} 18 ${width / 2} 0 L${width} ${height} L0 ${height} Z`} fill={P.grass} stroke={P.ink} strokeWidth={W.mid} strokeLinejoin="round" />
      <path d={`M0 ${gy + 30} q${width / 3} -12 ${width * 0.66} 4 T${width} ${gy + 34} L${width} ${height} L0 ${height} Z`} fill={sh(P.grass, 0.95)} />

      {/* 길 */}
      <path d={`M${width * 0.1} ${gy + 26} q${width * 0.4} -14 ${width * 0.8} 0`} stroke={P.wood} strokeWidth={16} fill="none" opacity={0.85} strokeLinecap="round" />

      {/* 건물 */}
      {placed.map(({ field, x, w }) => {
        const B = BUILDING_BY_FIELD[field];
        const stage = Math.max(1, Math.min(4, room.village[field] || 1));
        return (
          <g key={field}>
            <B x={x} gy={gy} stage={stage} P={P} t={t} />
            {showLabels && (
              <text x={x + w / 2} y={gy + 50} textAnchor="middle" fontFamily="Jua, sans-serif" fontSize={26} fill={P.ink}>
                {BUILDING_NAME[field]}
              </text>
            )}
          </g>
        );
      })}

      {/* 편의시설 — 재료로 지은 것들 */}
      {(room.amenities || []).includes('bench') && (
        <g transform={`translate(${width * 0.11}, ${gy + 14})`}>
          <GroundPlate cx={0} w={92} gy={0} P={P} />
          <rect x={-38} y={-22} width={76} height={11} rx={5} fill={P.wood} stroke={P.ink} strokeWidth={W.mid} />
          <rect x={-38} y={-40} width={76} height={9} rx={4} fill={P.wood} stroke={P.ink} strokeWidth={W.mid} />
          <path d={`M-30 -11 v11 M30 -11 v11 M-30 -40 v18 M30 -40 v18`} stroke={P.ink} strokeWidth={W.mid} strokeLinecap="round" />
        </g>
      )}
      {(room.amenities || []).includes('lamp') && <Lantern cx={width * 0.2} gy={gy + 14} h={72} P={P} lit={night} />}
      {(room.amenities || []).includes('fountain') && (
        <g transform={`translate(${width * 0.85}, ${gy + 12})`}>
          <GroundPlate cx={0} w={96} gy={0} P={P} />
          <ellipse cx={0} cy={-10} rx={40} ry={15} fill={P.water} stroke={P.ink} strokeWidth={W.mid} />
          <ellipse cx={0} cy={-13} rx={31} ry={10} fill={far(P.water, -0.1)} opacity={0.7} />
          <path d="M0 -20 v-22" stroke={P.ink} strokeWidth={W.mid} strokeLinecap="round" />
          <ellipse cx={0} cy={-45} rx={14} ry={7} fill={P.water} stroke={P.ink} strokeWidth={W.mid} />
        </g>
      )}

      {/* 기념비 */}
      {(room.monuments || []).length > 0 && <Monument cx={width * 0.93} gy={gy + 12} P={P} />}

      {/* 초목 — 시드로 흩뿌린다 */}
      <Tree cx={width * 0.06} gy={gy + 16} s={1.05} P={P} />
      <Bush cx={width * 0.96} gy={gy + 20} s={0.95} P={P} />
      <Flowers x={width * 0.3} gy={gy + 26} n={3} P={P} hue={t.flowerHue} />
      <Flowers x={width * 0.68} gy={gy + 28} n={2} P={P} hue="lemon" />
    </svg>
  );
}
