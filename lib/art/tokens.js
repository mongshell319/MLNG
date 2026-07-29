// 말랑스쿨 아트 시스템 — 토큰
// 규칙 3가지가 이 파일의 전부다.
//   1) 빛은 항상 왼쪽 위에서 온다 → 오른쪽 면에만 sh() 톤을 깐다
//   2) 선 굵기 3단 위계 → W.hi(실루엣) / W.mid(파츠) / W.lo(내부 디테일, 저투명도)
//   3) 텍스처는 저투명도 얇은 선으로만 → 3m 거리에서는 사라지고 가까이서만 밀도로 느껴진다

export const W = { hi: 3, mid: 2.2, lo: 1.5 };

const hx = (h) => {
  const s = h.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(s.slice(i, i + 2), 16));
};
const to = (r, g, b) =>
  '#' + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('').toUpperCase();

/** 같은 색조의 어두운 플랫 톤. 그라디언트가 아니라 별개의 색면이다. */
export const sh = (c, f = 0.9) => { const [r, g, b] = hx(c); return to(r * f, g * f * 0.99, b * f * 0.97); };
/** 밝은 쪽으로 섞기 */
export const lt = (c, f = 0.5) => { const [r, g, b] = hx(c); return to(r + (255 - r) * f, g + (255 - g) * f, b + (255 - b) * f); };
/** 채도를 낮춰 원경으로 물리기 (대기 원근) */
export const far = (c, f = 0.45) => {
  const [r, g, b] = hx(c); const m = (r + g + b) / 3;
  return to(r + (m - r) * f, g + (m - g) * f, b + (m - b) * f);
};

const BASE = {
  cream: '#FFF6EC', pink: '#FFD6E5', peach: '#FFC9B5', mint: '#C5EBDD',
  lavender: '#D9D2F5', lemon: '#FFF0B3', ink: '#6E5A54', blush: '#FFB3C6',
  beak: '#FFD34D', wood: '#EAD9C2', leaf: '#8FBF9E', grass: '#D9EBBF',
  water: '#BFE3EF', fog: '#D8D2CC',
};

const FIELD_TINT = { ask: BASE.peach, make: BASE.mint, care: BASE.pink, dare: BASE.lavender, keep: BASE.grass };

/** 팔레트 스왑 — 이 객체 하나만 갈아끼우면 세계 전체의 색이 바뀐다 */
export const PALETTES = {
  day: {
    id: 'day', ...BASE,
    sky: '#FFFDF8', skyLow: BASE.cream,
    hillFar: far(BASE.lavender, 0.35), hillNear: far(BASE.mint, 0.4),
    wall: BASE.cream, field: FIELD_TINT, dim: 1,
  },
  fog: {
    id: 'fog', ...BASE,
    sky: '#F4F1EC', skyLow: '#EDE9E3',
    hillFar: far(BASE.lavender, 0.7), hillNear: far(BASE.mint, 0.75),
    wall: '#FBF6EE', leaf: far(BASE.leaf, 0.35), grass: far(BASE.grass, 0.3),
    field: Object.fromEntries(Object.entries(FIELD_TINT).map(([k, v]) => [k, far(v, 0.3)])), dim: 0.9,
  },
  night: {
    id: 'night', ...BASE,
    sky: '#3A3350', skyLow: '#5A4B62',
    hillFar: '#4A4262', hillNear: '#574B6B',
    ink: '#4A3F45', wall: '#E8DCE8', wood: '#C7B6A8',
    leaf: '#6E9C86', grass: '#9FB894', water: '#8FB6CC',
    field: Object.fromEntries(Object.entries(FIELD_TINT).map(([k, v]) => [k, sh(v, 0.86)])), dim: 0.82,
  },
  exam: {
    id: 'exam', ...BASE,
    sky: '#FBF8F3', skyLow: '#F5F0E8',
    hillFar: far(BASE.lavender, 0.6), hillNear: far(BASE.mint, 0.62),
    wall: '#FDF9F2',
    leaf: far(BASE.leaf, 0.3), grass: far(BASE.grass, 0.28),
    field: Object.fromEntries(Object.entries(FIELD_TINT).map(([k, v]) => [k, far(v, 0.32)])), dim: 0.92,
  },
  festival: {
    id: 'festival', ...BASE,
    sky: '#FFF9F0', skyLow: '#FFF1E2',
    hillFar: far(BASE.pink, 0.3), hillNear: far(BASE.lemon, 0.35),
    wall: BASE.cream, field: FIELD_TINT, dim: 1, festive: true,
  },
};

/** 세션 상태 → 팔레트 선택 */
export function pickPalette({ phase, weather, examMode }) {
  if (phase === 'night') return PALETTES.night;
  if (phase === 'finale') return PALETTES.festival;
  if (examMode) return PALETTES.exam;
  if (weather === 'fog') return PALETTES.fog;
  return PALETTES.day;
}

export const FIELD_ORDER = ['ask', 'make', 'care', 'dare', 'keep'];
