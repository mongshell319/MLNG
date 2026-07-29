'use client';
import React from 'react';

const ink = '#6E5A54';
const beak = '#FFD34D';

function star(cx, cy) {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? 6.2 : 2.6;
    const a = (Math.PI / 5) * i - Math.PI / 2;
    pts.push(`${(cx + r * Math.cos(a)).toFixed(2)} ${(cy + r * Math.sin(a)).toFixed(2)}`);
  }
  return 'M' + pts.join(' L') + ' Z';
}

/**
 * 말랑이. 디자인 스펙 §2 좌표 그대로.
 * face: base | glad | full | star | focus | surprise | sleepy | sleep
 * acc:  ribbon | starpin | sprout | glasses | strawhat | goggle | scarf | crown
 * form: book | tinker | warm | fire | sprout
 */
export default function Malang({ color = '#FFD6E5', face = 'base', size = 100, acc = null, form = '', style, className }) {
  const k = [];
  const E = React.createElement;

  if (form === 'fire') {
    k.push(E('path', { key: 'cape', d: 'M26 40 q-9 30 -2 54 q13 6 26 6 q13 0 26 -6 q7 -24 -2 -54 Z', fill: '#FFC9B5', stroke: ink, strokeWidth: 2.4, strokeLinejoin: 'round' }));
    k.push(E('path', { key: 'h', d: 'M50 13 q-4 -8 1 -12 q3 5 7 1 q1 7 -3 11 Z', fill: beak, stroke: ink, strokeWidth: 2, strokeLinejoin: 'round' }));
  } else {
    k.push(E('path', { key: 'h', d: 'M50 13 q-2 -9 8 -11', fill: 'none', stroke: ink, strokeWidth: 3, strokeLinecap: 'round' }));
  }
  k.push(E('ellipse', { key: 'f1', cx: 39, cy: 103, rx: 7, ry: 4.5, fill: beak, stroke: ink, strokeWidth: 2.2 }));
  k.push(E('ellipse', { key: 'f2', cx: 61, cy: 103, rx: 7, ry: 4.5, fill: beak, stroke: ink, strokeWidth: 2.2 }));
  k.push(E('path', { key: 'b', d: 'M50 14 C33 18 21 40 21 64 C21 87 33 100 50 100 C67 100 79 87 79 64 C79 40 67 18 50 14 Z', fill: color, stroke: ink, strokeWidth: 3 }));
  k.push(E('ellipse', { key: 'w1', cx: 20, cy: 66, rx: 5.5, ry: 10, fill: color, stroke: ink, strokeWidth: 2.2 }));
  k.push(E('ellipse', { key: 'w2', cx: 80, cy: 66, rx: 5.5, ry: 10, fill: color, stroke: ink, strokeWidth: 2.2 }));

  if (form === 'tinker') {
    k.push(E('circle', { key: 'p1', cx: 50, cy: 82, r: 9, fill: 'none', stroke: ink, strokeWidth: 2, opacity: 0.5 }));
    k.push(E('circle', { key: 'p2', cx: 50, cy: 82, r: 3.4, fill: 'none', stroke: ink, strokeWidth: 2, opacity: 0.5 }));
  }
  if (form === 'book') k.push(E('path', { key: 'p1', d: 'M40 80 h20 M40 86 h14', stroke: ink, strokeWidth: 2, strokeLinecap: 'round', opacity: 0.42 }));
  if (form === 'sprout') k.push(E('path', { key: 'p1', d: 'M74 78 q-2 -12 -12 -14 q2 12 12 14 Z', fill: '#C5EBDD', stroke: '#4A8B6F', strokeWidth: 2, strokeLinejoin: 'round' }));

  if (form === 'warm') {
    k.push(E('path', { key: 'bl1', d: 'M32 64 c-2.6 -3.4 -7 -1.4 -7 1.6 c0 2.8 4.2 4.6 7 6.4 c2.8 -1.8 7 -3.6 7 -6.4 c0 -3 -4.4 -5 -7 -1.6 Z', fill: '#FFB3C6' }));
    k.push(E('path', { key: 'bl2', d: 'M68 64 c-2.6 -3.4 -7 -1.4 -7 1.6 c0 2.8 4.2 4.6 7 6.4 c2.8 -1.8 7 -3.6 7 -6.4 c0 -3 -4.4 -5 -7 -1.6 Z', fill: '#FFB3C6' }));
  } else {
    k.push(E('ellipse', { key: 'bl1', cx: 32, cy: 64, rx: 5.5, ry: 3.2, fill: '#FFB3C6' }));
    k.push(E('ellipse', { key: 'bl2', cx: 68, cy: 64, rx: 5.5, ry: 3.2, fill: '#FFB3C6' }));
  }

  if (face === 'full') {
    k.push(E('path', { key: 'e1', d: 'M35 56 q5 6 11 0', fill: 'none', stroke: ink, strokeWidth: 2.6, strokeLinecap: 'round' }));
    k.push(E('path', { key: 'e2', d: 'M54 56 q5 6 11 0', fill: 'none', stroke: ink, strokeWidth: 2.6, strokeLinecap: 'round' }));
  } else if (face === 'star') {
    k.push(E('path', { key: 'e1', d: star(41, 56), fill: beak, stroke: ink, strokeWidth: 1.4, strokeLinejoin: 'round' }));
    k.push(E('path', { key: 'e2', d: star(59, 56), fill: beak, stroke: ink, strokeWidth: 1.4, strokeLinejoin: 'round' }));
  } else if (face === 'glad') {
    k.push(E('circle', { key: 'e1', cx: 41, cy: 55, r: 3.1, fill: ink }));
    k.push(E('circle', { key: 'e2', cx: 59, cy: 55, r: 3.1, fill: ink }));
    k.push(E('circle', { key: 'g1', cx: 42.2, cy: 53.8, r: 1, fill: '#fff' }));
    k.push(E('circle', { key: 'g2', cx: 60.2, cy: 53.8, r: 1, fill: '#fff' }));
  } else if (face === 'focus') {
    k.push(E('path', { key: 'e1', d: 'M36 54 h9', stroke: ink, strokeWidth: 3, strokeLinecap: 'round' }));
    k.push(E('path', { key: 'e2', d: 'M55 54 h9', stroke: ink, strokeWidth: 3, strokeLinecap: 'round' }));
    k.push(E('path', { key: 'br1', d: 'M35 47 l10 3', stroke: ink, strokeWidth: 2.2, strokeLinecap: 'round' }));
    k.push(E('path', { key: 'br2', d: 'M65 47 l-10 3', stroke: ink, strokeWidth: 2.2, strokeLinecap: 'round' }));
  } else if (face === 'surprise') {
    k.push(E('circle', { key: 'e1', cx: 41, cy: 54, r: 4, fill: 'none', stroke: ink, strokeWidth: 2.4 }));
    k.push(E('circle', { key: 'e2', cx: 59, cy: 54, r: 4, fill: 'none', stroke: ink, strokeWidth: 2.4 }));
  } else if (face === 'sleepy') {
    k.push(E('path', { key: 'e1', d: 'M35 55 q5 4 11 0', fill: 'none', stroke: ink, strokeWidth: 2.6, strokeLinecap: 'round' }));
    k.push(E('path', { key: 'e2', d: 'M54 55 q5 4 11 0', fill: 'none', stroke: ink, strokeWidth: 2.6, strokeLinecap: 'round' }));
  } else if (face === 'sleep') {
    k.push(E('path', { key: 'e1', d: 'M36 56 h9', stroke: ink, strokeWidth: 2.6, strokeLinecap: 'round' }));
    k.push(E('path', { key: 'e2', d: 'M55 56 h9', stroke: ink, strokeWidth: 2.6, strokeLinecap: 'round' }));
    k.push(E('text', { key: 'z', x: 72, y: 36, fontSize: 13, fontWeight: 700, fill: ink, fontFamily: 'Jua' }, 'z z'));
  } else {
    k.push(E('circle', { key: 'e1', cx: 41, cy: 55, r: 2.6, fill: ink }));
    k.push(E('circle', { key: 'e2', cx: 59, cy: 55, r: 2.6, fill: ink }));
  }

  k.push(E('path', { key: 'bk', d: face === 'star' ? 'M44 61 L56 61 L50 71 Z' : 'M45 61 L55 61 L50 68.5 Z', fill: beak, stroke: ink, strokeWidth: 2, strokeLinejoin: 'round' }));

  if (acc === 'goggle') {
    k.push(E('rect', { key: 'a1', x: 31, y: 25, width: 38, height: 7, rx: 3.5, fill: '#C5EBDD', stroke: ink, strokeWidth: 2 }));
    k.push(E('circle', { key: 'a2', cx: 50, cy: 28, r: 8, fill: '#FFF0B3', stroke: ink, strokeWidth: 2 }));
  }
  if (acc === 'ribbon') k.push(E('path', { key: 'a1', d: 'M50 11 l-13 -7 v14 Z M50 11 l13 -7 v14 Z', fill: '#FFB3C6', stroke: ink, strokeWidth: 2, strokeLinejoin: 'round' }));
  if (acc === 'strawhat') {
    k.push(E('ellipse', { key: 'a1', cx: 50, cy: 15, rx: 22, ry: 6, fill: '#FFF0B3', stroke: ink, strokeWidth: 2 }));
    k.push(E('path', { key: 'a2', d: 'M38 14 q0 -12 12 -12 q12 0 12 12', fill: '#FFF0B3', stroke: ink, strokeWidth: 2 }));
  }
  if (acc === 'crown') k.push(E('path', { key: 'a1', d: 'M38 14 L39 4 L45 9 L50 2 L55 9 L61 4 L62 14 Z', fill: '#FFF0B3', stroke: '#B8933A', strokeWidth: 2, strokeLinejoin: 'round' }));
  if (acc === 'sprout') k.push(E('path', { key: 'a1', d: 'M50 12 v-6 M50 6 q-8 -6 -12 0 q6 4 12 0 M50 6 q8 -6 12 0 q-6 4 -12 0', fill: '#C5EBDD', stroke: '#4A8B6F', strokeWidth: 2, strokeLinejoin: 'round' }));
  if (acc === 'starpin') k.push(E('path', { key: 'a1', d: star(50, 8), fill: '#FFF0B3', stroke: '#B8933A', strokeWidth: 1.6, strokeLinejoin: 'round' }));
  if (acc === 'glasses') {
    k.push(E('circle', { key: 'a1', cx: 41, cy: 55, r: 7.5, fill: 'rgba(255,255,255,.55)', stroke: ink, strokeWidth: 2 }));
    k.push(E('circle', { key: 'a2', cx: 59, cy: 55, r: 7.5, fill: 'rgba(255,255,255,.55)', stroke: ink, strokeWidth: 2 }));
    k.push(E('path', { key: 'a3', d: 'M48.5 55 h3', stroke: ink, strokeWidth: 2 }));
  }
  if (acc === 'scarf') k.push(E('path', { key: 'a1', d: 'M28 70 q22 12 44 0 l-2 10 q-20 11 -40 0 Z', fill: '#FFB3C6', stroke: ink, strokeWidth: 2, strokeLinejoin: 'round' }));

  if (form === 'book') {
    k.push(E('circle', { key: 'f1', cx: 41, cy: 55, r: 8, fill: 'none', stroke: ink, strokeWidth: 2 }));
    k.push(E('circle', { key: 'f2', cx: 59, cy: 55, r: 8, fill: 'none', stroke: ink, strokeWidth: 2 }));
    k.push(E('path', { key: 'f3', d: 'M49 55 h2', stroke: ink, strokeWidth: 2 }));
    k.push(E('path', { key: 'f4', d: 'M58 12 l10 -12', stroke: ink, strokeWidth: 2.4, strokeLinecap: 'round' }));
    k.push(E('path', { key: 'f5', d: 'M68 0 q9 1 8 9 q-9 1 -8 -9 Z', fill: '#C5EBDD', stroke: '#4A8B6F', strokeWidth: 2, strokeLinejoin: 'round' }));
  }
  if (form === 'tinker') {
    k.push(E('rect', { key: 'f1', x: 29, y: 22, width: 42, height: 8, rx: 4, fill: '#C5EBDD', stroke: ink, strokeWidth: 2 }));
    k.push(E('circle', { key: 'f2', cx: 41, cy: 26, r: 8, fill: '#FFF0B3', stroke: ink, strokeWidth: 2 }));
    k.push(E('circle', { key: 'f3', cx: 59, cy: 26, r: 8, fill: '#FFF0B3', stroke: ink, strokeWidth: 2 }));
  }
  if (form === 'warm') {
    k.push(E('path', { key: 'f1', d: 'M27 69 q23 13 46 0 l-2 11 q-21 12 -42 0 Z', fill: '#FFB3C6', stroke: ink, strokeWidth: 2.2, strokeLinejoin: 'round' }));
    k.push(E('path', { key: 'f2', d: 'M66 79 q7 6 5 15 q-6 2 -9 -3', fill: '#FFB3C6', stroke: ink, strokeWidth: 2.2, strokeLinejoin: 'round' }));
  }
  if (form === 'sprout') {
    k.push(E('ellipse', { key: 'f1', cx: 50, cy: 16, rx: 23, ry: 6.5, fill: '#FFF0B3', stroke: ink, strokeWidth: 2 }));
    k.push(E('path', { key: 'f2', d: 'M37 15 q0 -13 13 -13 q13 0 13 13', fill: '#FFF0B3', stroke: ink, strokeWidth: 2 }));
  }

  return E('svg', { width: size, height: Math.round(size * 1.1), viewBox: '0 0 100 110', style, className, 'aria-hidden': true }, k);
}
