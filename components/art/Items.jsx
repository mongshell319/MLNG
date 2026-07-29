'use client';
import React from 'react';
import { W, sh, lt } from '@/lib/art/tokens';
import { PALETTES } from '@/lib/art/tokens';

const D = PALETTES.day;

function Frame({ size, children }) {
  return <svg width={size} height={size} viewBox="0 0 100 100" style={{ display: 'block' }}>{children}</svg>;
}

/* ---------------- 발견물 6종 ---------------- */
export const DISCOVERIES = {
  '낡은 지도 조각': (P) => (
    <>
      <path d="M18 24 q16 -8 32 0 q16 8 32 -2 v52 q-16 10 -32 2 q-16 -8 -32 0 Z" fill={P.cream} stroke={P.ink} strokeWidth={W.mid} strokeLinejoin="round" />
      <path d="M50 24 v54 M18 50 q16 -8 32 0 q16 8 32 -2" stroke={P.ink} strokeWidth={1.4} opacity={0.3} fill="none" />
      <path d="M30 40 q10 12 22 6 q10 -4 16 8" stroke={P.peach} strokeWidth={3} fill="none" strokeLinecap="round" strokeDasharray="5 5" />
      <path d="M66 56 l-5 -5 l10 0 l-5 5 Z M66 52 v-5" stroke={P.ink} strokeWidth={2} fill={P.peach} strokeLinejoin="round" />
    </>
  ),
  '이상한 씨앗': (P) => (
    <>
      <ellipse cx="50" cy="60" rx="20" ry="26" fill={P.peach} stroke={P.ink} strokeWidth={W.mid} />
      <path d="M50 60 q-9 -12 -3 -22" stroke={P.ink} strokeWidth={1.6} fill="none" opacity={0.4} />
      <path d="M50 36 q-3 -14 -18 -16 q3 15 18 16 Z" fill={P.mint} stroke={P.ink} strokeWidth={W.mid} strokeLinejoin="round" />
      <path d="M50 36 q3 -18 20 -18 q-3 17 -20 18 Z" fill={P.mint} stroke={P.ink} strokeWidth={W.mid} strokeLinejoin="round" />
      <circle cx="42" cy="58" r="3" fill={lt(P.peach, 0.55)} />
    </>
  ),
  '낡은 나침반': (P) => (
    <>
      <circle cx="50" cy="52" r="30" fill={P.lemon} stroke={P.ink} strokeWidth={W.hi} />
      <circle cx="50" cy="52" r="23" fill={P.cream} stroke={P.ink} strokeWidth={W.mid} />
      <path d="M50 34 l7 18 l-7 18 l-7 -18 Z" fill={P.peach} stroke={P.ink} strokeWidth={1.8} strokeLinejoin="round" />
      <circle cx="50" cy="52" r="3" fill={P.ink} />
      <path d="M50 22 v-6 M50 88 v-6 M20 52 h-6 M86 52 h-6" stroke={P.ink} strokeWidth={2.4} strokeLinecap="round" />
    </>
  ),
  '오두막 열쇠': (P) => (
    <>
      <circle cx="34" cy="40" r="16" fill="none" stroke={P.ink} strokeWidth={W.hi} />
      <circle cx="34" cy="40" r="7" fill={P.lemon} stroke={P.ink} strokeWidth={W.mid} />
      <path d="M44 50 l26 26" stroke={P.ink} strokeWidth={W.hi} strokeLinecap="round" />
      <path d="M62 68 l10 -10 M70 76 l9 -9" stroke={P.ink} strokeWidth={W.hi} strokeLinecap="round" />
    </>
  ),
  '비석 탁본': (P) => (
    <>
      <rect x="24" y="20" width="52" height="62" rx="8" fill={P.cream} stroke={P.ink} strokeWidth={W.mid} />
      <path d="M24 30 q13 -8 26 0 q13 8 26 0" stroke={P.ink} strokeWidth={1.4} fill="none" opacity={0.3} />
      <rect x="34" y="34" width="32" height="12" rx="4" fill={P.lavender} stroke={P.ink} strokeWidth={1.8} />
      <rect x="34" y="52" width="20" height="12" rx="4" fill={P.lavender} stroke={P.ink} strokeWidth={1.8} />
      <rect x="58" y="52" width="8" height="12" rx="4" fill={P.lavender} stroke={P.ink} strokeWidth={1.8} />
      <path d="M34 72 h32" stroke={P.ink} strokeWidth={1.6} opacity={0.4} />
    </>
  ),
  '젖은 편지': (P) => (
    <>
      <path d="M18 34 h64 v40 q-32 8 -64 0 Z" fill={P.cream} stroke={P.ink} strokeWidth={W.mid} strokeLinejoin="round" />
      <path d="M18 34 l32 24 32 -24" fill="none" stroke={P.ink} strokeWidth={W.mid} strokeLinejoin="round" />
      <path d="M26 74 q10 8 20 0 q10 -8 20 0" stroke={lt(P.water,0.1)} strokeWidth={3} fill="none" strokeLinecap="round" />
      <circle cx="72" cy="30" r="6" fill={lt(P.water,0.2)} stroke={P.ink} strokeWidth={1.6} />
    </>
  ),
  '유리 부표': (P) => (
    <>
      <circle cx="50" cy="56" r="26" fill={lt(P.water,0.3)} stroke={P.ink} strokeWidth={W.hi} />
      <path d="M34 44 q8 -8 16 -6" stroke="#fff" strokeWidth={4} fill="none" opacity={0.7} strokeLinecap="round" />
      <path d="M24 56 h52 M50 30 v52" stroke={P.mint} strokeWidth={3} opacity={0.7} />
      <path d="M50 30 q-8 -12 4 -18" stroke={P.ink} strokeWidth={2.4} fill="none" strokeLinecap="round" />
    </>
  ),
  '호수의 조각': (P) => (
    <>
      <path d="M50 20 L74 44 L62 78 H38 L26 44 Z" fill={lt(P.water,0.25)} stroke={P.ink} strokeWidth={W.hi} strokeLinejoin="round" />
      <path d="M50 20 L74 44 L62 78 Z" fill={sh(lt(P.water,0.25),0.9)} />
      <path d="M50 20 v58 M26 44 h48" stroke={P.ink} strokeWidth={1.6} opacity={0.35} />
      <circle className="f-twinkle" cx="70" cy="28" r="5" fill={P.lemon} stroke={P.ink} strokeWidth={1.6} />
    </>
  ),
  '반짝이는 돌': (P) => (
    <>
      <path d="M50 18 L76 40 L66 78 H34 L24 40 Z" fill={P.lavender} stroke={P.ink} strokeWidth={W.hi} strokeLinejoin="round" />
      <path d="M50 18 L76 40 L66 78 Z" fill={sh(P.lavender,0.88)} />
      <path d="M50 18 L50 78 M24 40 L76 40" stroke={P.ink} strokeWidth={1.6} opacity={0.3} />
      <path className="f-twinkle" d="M36 32 l3 -8 l3 8 l8 3 l-8 3 l-3 8 l-3 -8 l-8 -3 Z" fill={P.lemon} />
    </>
  ),
  '광부의 등불': (P) => (
    <>
      <path d="M50 16 v10" stroke={P.ink} strokeWidth={2.6} strokeLinecap="round" />
      <path d="M34 28 h32 l-4 12 h-24 Z" fill={P.wood} stroke={P.ink} strokeWidth={W.mid} strokeLinejoin="round" />
      <path d="M32 40 h36 l-5 36 h-26 Z" fill={lt(P.lemon,0.2)} stroke={P.ink} strokeWidth={W.hi} strokeLinejoin="round" />
      <circle className="f-twinkle" cx="50" cy="58" r="10" fill={P.lemon} stroke={P.ink} strokeWidth={1.8} />
      <path d="M38 76 h24" stroke={P.ink} strokeWidth={W.mid} strokeLinecap="round" />
    </>
  ),
  '심장 광석': (P) => (
    <>
      <path d="M50 80 C26 62 22 46 32 38 c8 -6 15 -2 18 6 c3 -8 10 -12 18 -6 c10 8 6 24 -18 42 Z" fill={P.peach} stroke={P.ink} strokeWidth={W.hi} strokeLinejoin="round" />
      <path d="M50 44 c3 -8 10 -12 18 -6 c10 8 6 24 -18 42 Z" fill={sh(P.peach,0.9)} />
      <path className="f-twinkle" d="M40 40 l2 -7 l2 7 l7 2 l-7 2 l-2 7 l-2 -7 l-7 -2 Z" fill={P.lemon} />
    </>
  ),
  '옛 등불': (P) => (
    <>
      <path d="M50 14 q-10 6 0 12 q10 -6 0 -12 Z" fill={P.lemon} stroke={P.ink} strokeWidth={1.8} />
      <path d="M36 30 h28 l6 12 h-40 Z" fill={P.wood} stroke={P.ink} strokeWidth={W.mid} strokeLinejoin="round" />
      <path d="M30 42 h40 l-6 34 h-28 Z" fill={lt(P.lemon,0.3)} stroke={P.ink} strokeWidth={W.hi} strokeLinejoin="round" />
      <path d="M42 42 v34 M58 42 v34" stroke={P.ink} strokeWidth={1.6} opacity={0.4} />
      <circle className="f-twinkle" cx="50" cy="58" r="9" fill={P.lemon} />
    </>
  ),
  '첫 불씨': (P) => (
    <>
      <path d="M50 78 q-24 -6 -24 -26 q0 -18 16 -30 q-2 14 8 16 q6 -14 -2 -24 q22 12 26 38 q2 20 -24 26 Z" fill={P.peach} stroke={P.ink} strokeWidth={W.hi} strokeLinejoin="round" />
      <path d="M50 76 q-12 -5 -12 -16 q0 -10 8 -17 q0 9 6 10 q4 -8 0 -14 q12 8 12 22 q0 11 -14 15 Z" fill={P.lemon} stroke={P.ink} strokeWidth={1.8} strokeLinejoin="round" />
    </>
  ),
  '항해 일지': (P) => (
    <>
      <path d="M22 24 q14 -6 28 0 v52 q-14 -6 -28 0 Z" fill={P.cream} stroke={P.ink} strokeWidth={W.mid} strokeLinejoin="round" />
      <path d="M78 24 q-14 -6 -28 0 v52 q14 -6 28 0 Z" fill={sh(P.cream,0.95)} stroke={P.ink} strokeWidth={W.mid} strokeLinejoin="round" />
      <path d="M50 24 v52" stroke={P.ink} strokeWidth={W.mid} />
      <path d="M30 40 h14 M30 50 h12 M58 40 h14 M58 50 h10" stroke={P.ink} strokeWidth={1.6} opacity={0.35} strokeLinecap="round" />
      <path d="M60 62 q6 -8 12 -2" stroke={lt(P.water,0.1)} strokeWidth={3} fill="none" strokeLinecap="round" />
    </>
  ),
  '큰 나무의 잎': (P) => (
    <>
      <path d="M50 84 q-4 -26 0 -46" stroke={P.ink} strokeWidth={2.4} fill="none" strokeLinecap="round" />
      <path d="M50 38 q-30 2 -30 24 q0 20 30 20 q30 0 30 -20 q0 -22 -30 -24 Z" fill={P.mint} stroke={P.ink} strokeWidth={W.hi} strokeLinejoin="round" />
      <path d="M50 42 v38 M50 54 l-16 -6 M50 54 l16 -6 M50 66 l-14 -5 M50 66 l14 -5" stroke={P.ink} strokeWidth={1.5} opacity={0.35} />
      <circle className="f-twinkle" cx="72" cy="34" r="5" fill={P.lemon} stroke={P.ink} strokeWidth={1.6} />
    </>
  ),
};

/* ---------------- 간식 3종 ---------------- */
export const SNACK_ART = {
  macaron: (P) => (
    <>
      <ellipse cx="50" cy="38" rx="30" ry="13" fill={P.peach} stroke={P.ink} strokeWidth={W.mid} />
      <path d="M20 38 q30 12 60 0 v6 q-30 12 -60 0 Z" fill={sh(P.peach, 0.92)} stroke={P.ink} strokeWidth={W.mid} strokeLinejoin="round" />
      <ellipse cx="50" cy="52" rx="27" ry="8" fill={P.cream} stroke={P.ink} strokeWidth={W.mid} />
      <ellipse cx="50" cy="66" rx="30" ry="13" fill={P.peach} stroke={P.ink} strokeWidth={W.mid} />
      <path d="M32 34 q6 -5 14 -4" stroke="#fff" strokeWidth={3.4} opacity={0.65} strokeLinecap="round" fill="none" />
    </>
  ),
  pudding: (P) => (
    <>
      <path d="M26 40 q24 -12 48 0 l-6 34 q-4 10 -18 10 q-14 0 -18 -10 Z" fill={P.lemon} stroke={P.ink} strokeWidth={W.hi} strokeLinejoin="round" />
      <path d="M26 40 q24 12 48 0 q-3 -12 -24 -12 q-21 0 -24 12 Z" fill={sh(P.lemon, 0.86)} stroke={P.ink} strokeWidth={W.mid} strokeLinejoin="round" />
      <path d="M36 52 q4 -4 9 -3" stroke="#fff" strokeWidth={3.4} opacity={0.6} strokeLinecap="round" fill="none" />
      <circle cx="50" cy="24" r="6" fill={P.pink} stroke={P.ink} strokeWidth={W.mid} />
    </>
  ),
  cotton: (P) => (
    <>
      <path d="M50 84 v-26" stroke={P.wood} strokeWidth={5} strokeLinecap="round" />
      <circle cx="36" cy="46" r="17" fill={P.lavender} />
      <circle cx="64" cy="46" r="16" fill={P.lavender} />
      <circle cx="50" cy="34" r="18" fill={P.pink} />
      <circle cx="50" cy="52" r="16" fill={P.lavender} />
      <path d="M20 50 q-2 -18 15 -22 q6 -14 21 -10 q17 -3 18 16 q10 8 4 18 q-8 12 -29 12 q-24 0 -29 -14 Z" fill="none" stroke={P.ink} strokeWidth={W.hi} strokeLinejoin="round" />
    </>
  ),
};

/* ---------------- 라인 아이콘 12종 ---------------- */
const ICON = {
  quest: 'M28 16 v68 M28 22 h44 l-13 15 13 15 h-44',
  shop: 'M22 40 h56 l-6 40 h-44 Z M36 40 v-10 a14 14 0 0 1 28 0 v10',
  room: 'M18 48 L50 22 L82 48 M28 44 v34 h44 v-34',
  map: 'M20 28 l20 -8 l20 8 l20 -8 v52 l-20 8 l-20 -8 l-20 8 Z M40 20 v52 M60 28 v52',
  badge: 'M50 18 l10 20 22 3 -16 16 4 22 -20 -10 -20 10 4 -22 -16 -16 22 -3 Z',
  coin: 'M50 22 a28 28 0 1 1 0 56 a28 28 0 1 1 0 -56 M50 34 v32 M42 42 h16 M42 58 h16',
  snack: 'M30 44 q20 -12 40 0 l-5 30 q-3 8 -15 8 q-12 0 -15 -8 Z M30 44 q20 10 40 0',
  fish: 'M22 50 q18 -20 40 0 q-18 20 -40 0 Z M62 50 l16 -12 v24 Z M34 46 h.1',
  letter: 'M20 32 h60 v36 h-60 Z M20 32 l30 22 30 -22',
  heart: 'M50 76 C24 58 20 42 30 34 c8 -6 16 -2 20 6 c4 -8 12 -12 20 -6 c10 8 6 24 -20 42 Z',
  lantern: 'M50 18 v8 M34 26 h32 l-6 40 h-20 Z M42 74 h16',
  gate: 'M28 80 v-34 a22 22 0 0 1 44 0 v34 M40 80 v-30 a10 10 0 0 1 20 0 v30',
};

export function Icon({ name, size = 24, color, strokeWidth = 5 }) {
  const d = ICON[name] || ICON.quest;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none"
      stroke={color || D.ink} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

/* ---------------- 공개 컴포넌트 ---------------- */
export function Discovery({ name, size = 64, P = D }) {
  const draw = DISCOVERIES[name];
  return <Frame size={size}>{draw ? draw(P) : <circle cx="50" cy="50" r="26" fill={P.lemon} stroke={P.ink} strokeWidth={W.mid} />}</Frame>;
}

export function Snack({ id, size = 64, P = D }) {
  const draw = SNACK_ART[id];
  return <Frame size={size}>{draw ? draw(P) : null}</Frame>;
}

export const DISCOVERY_NAMES = Object.keys(DISCOVERIES);
export const ICON_NAMES = Object.keys(ICON);
