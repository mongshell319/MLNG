// 마을 코드 → 결정적 난수. 같은 반은 언제나 같은 마을, 다른 반은 다른 마을.
export function hashCode(str) {
  let h = 2166136261;
  for (let i = 0; i < String(str).length; i++) {
    h ^= String(str).charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function rng(seed) {
  let a = typeof seed === 'number' ? seed : hashCode(seed);
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 마을 코드로 마을의 개성을 뽑는다 */
export function villageTraits(code) {
  const r = rng(code || 'MALLANG');
  const pick = (arr) => arr[Math.floor(r() * arr.length)];
  return {
    order: shuffle(['ask', 'make', 'care', 'dare', 'keep'], r),
    gap: 66 + Math.round(r() * 26),
    roofPitch: 0.86 + r() * 0.3,
    treeSide: r() > 0.5 ? -1 : 1,
    hillSeed: Math.floor(r() * 1000),
    flowerHue: pick(['pink', 'lemon', 'lavender']),
    lanternStyle: pick(['round', 'square']),
    banner: r() > 0.4,
    r,
  };
}

function shuffle(arr, r) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
