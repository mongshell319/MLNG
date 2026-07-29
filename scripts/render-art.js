/**
 * 아트 미리보기 렌더러 (아트팩 독립 버전)
 *   node scripts/render-art.js
 * art-preview/*.svg 로 저장된다. 브라우저로 열어 확인할 것.
 */
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const fs = require('fs');
const path = require('path');
const Module = require('module');
require('@babel/register').default({
  presets: [['@babel/preset-react', { runtime: 'classic' }], ['@babel/preset-env', { targets: { node: 'current' } }]],
  extensions: ['.js', '.jsx'],
});
const orig = Module._resolveFilename;
Module._resolveFilename = function (r, ...a) { if (r.startsWith('@/')) r = path.join(process.cwd(), r.slice(2)); return orig.call(this, r, ...a); };

const VillageScene = require('../components/art/VillageScene').default;
const FieldScene = require('../components/art/FieldScene').default;
const Malang = require('../components/Malang').default;
const { Discovery, Snack, Icon, DISCOVERY_NAMES, ICON_NAMES } = require('../components/art/Items');

const OUT = path.join(process.cwd(), 'art-preview');
fs.mkdirSync(OUT, { recursive: true });
const TINTS = ['#FFD6E5', '#FFC9B5', '#C5EBDD', '#D9D2F5', '#FFF0B3', '#FFF6EC'];
const FORMS = ['', 'book', 'tinker', 'warm', 'fire', 'sprout'];
const crowd = Array.from({ length: 9 }, (_, i) => ({ id: 's' + i, color: TINTS[i % 6], form: FORMS[i % 6], wearing: i % 3 === 0 ? 'ribbon' : null }));
const write = (n, svg) => { fs.writeFileSync(path.join(OUT, n + '.svg'), svg.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ')); console.log('  ✓', n); };
const room = (o) => Object.assign({
  code: 'B8TVQL', phase: 'before', weather: 'clear', examMode: false,
  expType: 'explore', prog: 7, target: 12,
  village: { ask: 4, make: 4, care: 4, dare: 4, keep: 4 },
  amenities: ['bench', 'lamp', 'fountain'], monuments: ['속삭이는 숲의 큰 나무'],
  submissions: [],
}, o);

// 원정지 구조 (아트 확인용 최소 정의 — 프로젝트의 실제 데이터와 무관)
const SITES = [
  { id: 'forest', segs: [['s1','explore'],['s2','search'],['s3','breach'],['s4','repair'],['sx','decode'],['s5','raid']] },
  { id: 'lake',   segs: [['l1','explore'],['l2','search'],['l3','repair'],['l4','carry'],['lx','decode'],['l5','raid']] },
  { id: 'mine',   segs: [['m1','breach'],['m2','explore'],['m3','carry'],['m4','repair'],['mx','decode'],['m5','raid']] },
  { id: 'tower',  segs: [['t1','carry'],['t2','explore'],['t3','repair'],['t4','search'],['tx','decode'],['t5','raid']] },
];

console.log('\n마을 (팔레트 5종 + 변주)');
[['village-day', {}], ['village-night', { phase: 'night' }], ['village-fog', { weather: 'fog' }],
 ['village-exam', { examMode: true }], ['village-festival', { phase: 'finale' }],
 ['village-growing', { village: { ask: 4, make: 3, care: 2, dare: 1, keep: 2 }, amenities: [], monuments: [] }],
 ['village-otherclass', { code: 'ZQ7M4X' }],
].forEach(([n, o]) => write(n, renderToStaticMarkup(React.createElement(VillageScene, { room: room(o), width: 1600, height: 760 }))));

console.log('\n원정 필드 (원정지 4 × 구간 6)');
SITES.forEach((site) => site.segs.forEach(([sid, type]) => {
  const r = room({ phase: 'live', expType: type, prog: 7, target: 12 });
  write(`field-${site.id}-${sid}-${type}`, renderToStaticMarkup(
    React.createElement(FieldScene, { room: r, site: { id: site.id }, segment: { id: sid }, width: 1600, height: 760, crowd })));
}));

console.log('\n레이드 완료');
SITES.forEach((site) => {
  const [sid] = site.segs.find(([, t]) => t === 'raid');
  const r = room({ phase: 'live', expType: 'raid', prog: 12, target: 12 });
  write(`raid-done-${site.id}`, renderToStaticMarkup(
    React.createElement(FieldScene, { room: r, site: { id: site.id }, segment: { id: sid }, width: 1600, height: 760, crowd })));
});

console.log('\n말랑이 시트');
{
  const faces = ['base','glad','full','focus','surprise','star','sleepy','sleep'];
  const accs = ['ribbon','starpin','sprout','glasses','strawhat','goggle','scarf','crown'];
  let s = '<svg width="1200" height="560" viewBox="0 0 1200 560"><rect width="1200" height="560" fill="#FFF6EC"/>';
  const row = (arr, y, mk) => arr.forEach((v, i) => {
    s += `<g transform="translate(${40 + i * 145},${y})">` + renderToStaticMarkup(mk(v, i)) + '</g>';
    s += `<text x="${95 + i * 145}" y="${y + 150}" text-anchor="middle" font-family="sans-serif" font-size="15" fill="#6E5A54">${v}</text>`;
  });
  row(faces, 30, (f) => React.createElement(Malang, { color: '#FFD6E5', face: f, size: 110 }));
  row(FORMS.filter(Boolean), 210, (f, i) => React.createElement(Malang, { color: TINTS[i], face: 'glad', size: 110, form: f }));
  row(accs, 390, (a) => React.createElement(Malang, { color: '#FFF6EC', face: 'base', size: 110, acc: a }));
  write('malang-sheet', s + '</svg>');
}

console.log('\n아이템 시트');
{
  const cols = 8, rows = Math.ceil(DISCOVERY_NAMES.length / cols), H = rows * 160 + 320;
  let s = `<svg width="1280" height="${H}" viewBox="0 0 1280 ${H}"><rect width="1280" height="${H}" fill="#FFF6EC"/>`;
  DISCOVERY_NAMES.forEach((n, i) => {
    const x = 40 + (i % cols) * 155, y = 30 + Math.floor(i / cols) * 160;
    s += `<g transform="translate(${x},${y})">` + renderToStaticMarkup(React.createElement(Discovery, { name: n, size: 100 })) + '</g>';
    s += `<text x="${x + 50}" y="${y + 122}" text-anchor="middle" font-family="sans-serif" font-size="13" fill="#6E5A54">${n}</text>`;
  });
  const yb = rows * 160 + 50;
  ['macaron','pudding','cotton'].forEach((n, i) => { s += `<g transform="translate(${40 + i * 155},${yb})">` + renderToStaticMarkup(React.createElement(Snack, { id: n, size: 100 })) + '</g>'; });
  ICON_NAMES.forEach((n, i) => { s += `<g transform="translate(${560 + (i % 6) * 100},${yb + Math.floor(i / 6) * 100})">` + renderToStaticMarkup(React.createElement(Icon, { name: n, size: 60 })) + '</g>'; });
  write('items-sheet', s + '</svg>');
}
console.log('\n완료 — art-preview/ 를 브라우저로 열어 확인하세요.\n');
