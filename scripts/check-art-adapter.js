/**
 * 어댑터 검증 — 이 프로젝트의 진짜 상태를 아트에 먹여 본다.
 *   node scripts/check-art-adapter.js
 *
 * render-art.js 는 아트팩 자체 더미 데이터로 그림을 뽑는다. 그건 아트가 멀쩡한지 보는 것이고,
 * 이 스크립트는 lib/art/adapter.ts 가 우리 도메인 상태를 아트가 읽는 모양으로
 * 제대로 옮기는지를 본다. 계약이 어긋나면 여기서 먼저 걸린다.
 *
 * art-preview/adapter-*.svg 로 떨어진다.
 */
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const fs = require('fs');
const path = require('path');
const Module = require('module');

require('@babel/register').default({
  presets: [
    ['@babel/preset-react', { runtime: 'classic' }],
    ['@babel/preset-env', { targets: { node: 'current' } }],
    '@babel/preset-typescript',
  ],
  extensions: ['.js', '.jsx', '.ts', '.tsx'],
});
const orig = Module._resolveFilename;
Module._resolveFilename = function (r, ...a) {
  if (r.startsWith('@/')) r = path.join(process.cwd(), r.slice(2));
  return orig.call(this, r, ...a);
};

const VillageScene = require('../components/art/VillageScene').default;
const FieldScene = require('../components/art/FieldScene').default;
const { seedWorld } = require('../lib/domain/seed');
const { toArtProps, artVillageSlots, artLabelY } = require('../lib/art/adapter');
const { FIELD_ORDER } = require('../lib/art/tokens');

const OUT = path.join(process.cwd(), 'art-preview');
fs.mkdirSync(OUT, { recursive: true });
const write = (n, svg) => {
  fs.writeFileSync(path.join(OUT, n + '.svg'), svg.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" '));
  console.log('  ✓', n);
};

const fail = [];
const expect = (ok, msg) => { if (!ok) fail.push(msg); };

// 데모 세계 = 학생 28명 + 지난 기록이 들어 있는 진짜 스냅샷
const snap = seedWorld({
  villageId: 'v-check', villageName: '검증 마을', classCode: 'B8TVQL',
  hallId: 'h-check', hallName: '검증 상회', demo: true,
});

console.log('\n계약 점검');
{
  const { room, site, segment, crowd } = toArtProps(snap);

  expect(room.code === snap.village.classCode, 'code 가 classCode 로 넘어오지 않음');
  expect(room.weather === 'clear' || room.weather === 'fog', `weather 가 아트 값이 아님: ${room.weather}`);
  expect(FIELD_ORDER.every((k) => typeof room.village[k] === 'number'), '분야 키 5개(ask/make/care/dare/keep) 불일치');
  expect(FIELD_ORDER.every((k) => room.village[k] >= 1 && room.village[k] <= 4), '건물 성장 단계가 1~4 밖');
  expect(room.target > 0, 'target 이 0 — 진행률 분모가 없음');
  expect(['forest', 'lake', 'mine', 'tower'].includes(site.id), `site.id 가 아트 원정지가 아님: ${site.id}`);
  expect(/^[slmt][0-9x]$/.test(segment.id), `segment.id 가 랜드마크 표에 없음: ${segment.id}`);
  expect(crowd.length > 0 && crowd.every((c) => c.id && c.color), 'crowd 가 비었거나 색이 없음');
  expect(crowd.every((c) => c.form !== 'base'), "form 'base' 는 아트에서 빈 문자열이어야 함");
  expect(room.submissions.every((s) => s.status === 'approved' && s.photo), 'submissions 모양 불일치');

  console.log(`  code=${room.code} weather=${room.weather} exp=${room.expType} prog=${room.prog}/${room.target}`);
  console.log(`  village=${FIELD_ORDER.map((k) => `${k}${room.village[k]}`).join(' ')}`);
  console.log(`  site=${site.id} segment=${segment.id} crowd=${crowd.length}명 submissions=${room.submissions.length}건`);

  console.log('\n어댑터로 그린 그림');
  write('adapter-village', renderToStaticMarkup(React.createElement(VillageScene, { room, width: 1600, height: 760 })));
  write('adapter-field', renderToStaticMarkup(React.createElement(FieldScene, { room, site, segment, width: 1600, height: 760, crowd })));

  // 원정지 4곳이 전부 아트 쪽 id 로 옮겨지는지 — 하나라도 빠지면 배경만 나온다
  for (const s of snap.sites) {
    for (let i = 0; i < s.segments.length; i++) {
      const p = toArtProps({ ...snap, session: { ...snap.session, siteId: s.id, segmentIndex: i } });
      expect(/^[slmt][0-9x]$/.test(p.segment.id), `${s.id}[${i}] → 랜드마크 없는 구간 id (${p.segment.id})`);
    }
    const p = toArtProps({ ...snap, session: { ...snap.session, siteId: s.id, segmentIndex: 0 } });
    console.log(`  ${s.id} → ${p.site.id}/${p.segment.id}`);
  }

  // 건물 이름표 자리 — 아트가 실제로 세운 곳과 어댑터가 계산한 곳이 같아야 한다.
  // VillageScene 에 showLabels 를 켜면 아트가 <text> 를 직접 찍으므로, 그 좌표를 정답으로 삼는다.
  // 새 아트팩이 배치를 바꾸면 여기서 바로 걸린다.
  console.log('\n이름표 자리');
  {
    const W = 1600, H = 760;
    const svg = renderToStaticMarkup(React.createElement(VillageScene, { room, width: W, height: H, showLabels: true }));
    const drawn = [...svg.matchAll(/<text[^>]*x="([\d.]+)"[^>]*y="([\d.]+)"[^>]*>([^<]+)</g)]
      .map((m) => ({ x: +m[1], y: +m[2], name: m[3] }));
    const mine = artVillageSlots(room.code, W);

    expect(drawn.length === 5, `아트가 그린 이름표가 5개가 아님: ${drawn.length}개`);
    expect(drawn.every((d) => Math.abs(d.y - artLabelY(H)) < 0.5), 'artLabelY 가 아트의 이름표 높이와 다름');
    drawn.forEach((d, i) => {
      const gap = mine[i] ? Math.abs(mine[i].cx - d.x) : Infinity;
      expect(gap < 0.5, `${d.name} 이름표 x 가 ${gap.toFixed(1)}px 어긋남 (아트 ${d.x} / 어댑터 ${mine[i] && mine[i].cx})`);
    });
    console.log(`  ${drawn.map((d, i) => `${d.name}@${d.x}`).join('  ')}`);
    console.log(`  높이 ${artLabelY(H)} · 최대 오차 ${Math.max(...drawn.map((d, i) => Math.abs((mine[i] || {}).cx - d.x))).toFixed(2)}px`);
  }

  // 팔레트 스왑이 어댑터를 통해서도 도는지
  console.log('\n팔레트 스왑');
  for (const [name, patch] of [
    ['night', { session: { ...snap.session, phase: 'night' } }],
    ['fog', { village: { ...snap.village, weather: '구름 조금' } }],
    ['exam', { village: { ...snap.village, examMode: true } }],
    ['finale', { session: { ...snap.session, phase: 'finale' } }],
  ]) {
    const r = toArtProps({ ...snap, ...patch }).room;
    write(`adapter-village-${name}`, renderToStaticMarkup(React.createElement(VillageScene, { room: r, width: 1600, height: 760 })));
  }
}

if (fail.length) {
  console.error('\n어긋남 ' + fail.length + '건');
  fail.forEach((m) => console.error('  ✗ ' + m));
  process.exit(1);
}
console.log('\n계약 일치. art-preview/adapter-*.svg 확인.\n');
