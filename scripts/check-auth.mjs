#!/usr/bin/env node
/**
 * 권한 체커.
 *
 * 절대 규칙(check-rules)이 화면의 말을 본다면, 이건 서버의 경계를 본다.
 * 학생 쿠키로 정산을 시작할 수 있는가, 남의 말랑이로 전달할 수 있는가,
 * 옆 마을 사진이 보이는가 — 한 번이라도 통과하면 그건 서비스를 열면 안 되는 상태다.
 *
 * 개발 서버(npm run dev)를 띄운 상태에서 돌린다. 시연용 교실(MLNG24 / demo)이
 * 필요하기 때문이고, 그 교실은 프로덕션에서는 아예 만들어지지 않는다.
 *
 *   npm run dev
 *   npm run check:auth
 */

const B = process.env.MLNG_BASE ?? 'http://localhost:3000'
const jars = new Map()
async function call(who, path, opts = {}) {
  const headers = { ...(opts.headers || {}) }
  const cookie = jars.get(who)
  if (cookie) headers.cookie = cookie
  const res = await fetch(B + path, { ...opts, headers, redirect: 'manual' })
  const setC = res.headers.get('set-cookie')
  if (setC) jars.set(who, setC.split(';')[0])
  let body = null
  try { body = await res.json() } catch {}
  return { status: res.status, body, res }
}
const json = (o) => ({ headers: { 'content-type': 'application/json' }, body: JSON.stringify(o), method: 'POST' })
let failed = 0
const ok = (c, m) => {
  if (!c) failed++
  console.log(`${c ? '  PASS' : '  FAIL'}  ${m}`)
}

console.log('\n[1] 신원 없이 접근')
let r = await call('anon', '/api/world')
ok(r.status === 401, `GET /api/world → ${r.status} (401이어야 함)`)
r = await call('anon', '/api/world', json({ type: 'session.settle', fast: false, at: new Date().toISOString() }))
ok(r.status === 401, `정산 시작 시도 → ${r.status} (401이어야 함)`)
r = await call('anon', '/api/photo?p=v-1/m-1/x.jpg')
ok(r.status === 401, `남의 사진 조회 → ${r.status} (401이어야 함)`)

console.log('\n[2] 교사 입장')
r = await call('gm', '/api/enter/gm', json({ classCode: 'MLNG24', pin: 'wrong' }))
ok(r.status === 401, `틀린 PIN → ${r.status} (401이어야 함)`)
r = await call('gm', '/api/enter/gm', json({ classCode: 'MLNG24', pin: 'demo' }))
ok(r.status === 200, `맞는 PIN → ${r.status}`)
r = await call('gm', '/api/world')
ok(r.status === 200 && r.body.identity.kind === 'gm', `GM 세계 읽기 → ${r.body?.identity?.kind}`)
const world = r.body.snapshot
console.log(`  마을: ${world.village.name} / 코드 ${world.village.classCode} / 말랑이 ${world.mallangs.length}명`)

console.log('\n[3] 학생 입장')
r = await call('stu', '/api/enter/student', json({ classCode: 'BADCOD', name: '테스트' }))
ok(r.status === 404, `없는 클래스 코드 → ${r.status} (404여야 함)`)
r = await call('stu', '/api/enter/student', json({ classCode: 'MLNG24', name: '시험말랑', bodyColor: '#C5EBDD' }))
ok(r.status === 200 && !!r.body.code, `새 말랑이 → ${r.status}, 코드 ${r.body?.code}`)
const myCode = r.body.code

console.log('\n[4] 학생이 GM 권한을 넘볼 때')
const at = () => new Date().toISOString()
r = await call('stu', '/api/world', json({ type: 'session.settle', fast: false, at: at() }))
ok(r.status === 403, `정산 시작 → ${r.status} (403이어야 함) "${r.body?.error ?? ''}"`)
r = await call('stu', '/api/world', json({ type: 'verify.approveAll', at: at() }))
ok(r.status === 403, `일괄 승인 → ${r.status} (403이어야 함)`)
r = await call('stu', '/api/world', json({ type: 'gm.award', id: 'x', mallangId: 'm-1', field: 'steady', text: 'x', at: at() }))
ok(r.status === 403, `자기 뱃지 수여 → ${r.status} (403이어야 함)`)

console.log('\n[5] 학생이 남의 말랑이를 조작할 때')
const me = (await call('stu', '/api/world')).body.snapshot.mallangs.find(m => m.code === myCode)
const other = world.mallangs[0]
const q = world.quests.find(x => x.kind === 'main')
r = await call('stu', '/api/world', json({ type: 'quest.accept', questId: q.id, mallangId: other.id, at: at() }))
ok(r.status === 403, `남의 이름으로 수락 → ${r.status} (403이어야 함) "${r.body?.error ?? ''}"`)
r = await call('stu', '/api/world', json({ type: 'shop.buyAccessory', mallangId: other.id, key: 'crown', at: at() }))
ok(r.status === 403, `남의 지갑으로 구매 → ${r.status} (403이어야 함)`)
r = await call('stu', '/api/world', json({ type: 'quest.accept', questId: q.id, mallangId: me.id, at: at() }))
ok(r.status === 200, `내 이름으로 수락 → ${r.status}`)

console.log('\n[6] 사진 경로를 직접 넣으려 할 때')
r = await call('stu', '/api/world', json({ type: 'quest.photo', questId: q.id, mallangId: me.id, photoUrl: 'https://evil.example/x.png', at: at() }))
ok(r.status === 403, `임의 URL 주입 → ${r.status} (403이어야 함) "${r.body?.error ?? ''}"`)

console.log('\n[7] 실제 업로드 경로')
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64')
const fd = new FormData()
fd.append('file', new Blob([png], { type: 'image/png' }), 'a.png')
fd.append('questId', q.id)
const up = await fetch(B + '/api/upload', { method: 'POST', body: fd, headers: { cookie: jars.get('stu') } })
const upJson = await up.json()
ok(up.status === 200, `업로드 → ${up.status} ${upJson.error ?? ''}`)
const stored = upJson.snapshot?.progress?.find(p => p.mallangId === me.id)?.photoUrl
ok(!!stored && stored.startsWith('v-1/'), `상태에 실린 값: ${stored}`)

console.log('\n[8] 사진 조회 권한')
r = await call('stu', `/api/photo?p=${encodeURIComponent(stored)}`)
ok(r.res.status === 200, `본인 조회 → ${r.res.status}`)
r = await call('stu', '/api/photo?p=../../etc/passwd')
ok(r.res.status === 404, `경로 조작 → ${r.res.status} (404여야 함)`)
r = await call('stu', '/api/photo?p=v-other/m-1/x.jpg')
ok(r.res.status === 404, `다른 마을 → ${r.res.status} (404여야 함)`)

console.log('\n[9] 다른 마을 만들고 넘겨다보기')
r = await call('gm2', '/api/village', json({ villageName: '옆 마을', hallName: '국어 글방', subject: '국어', pin: '9999' }))
ok(r.status === 200, `새 마을 → ${r.status}, 코드 ${r.body?.classCode}`)
const w2 = (await call('gm2', '/api/world')).body.snapshot
ok(w2.village.id !== world.village.id, `다른 세계인가: ${w2.village.id} ≠ ${world.village.id}`)
ok(w2.mallangs.length === 0 && !w2.village.founded, `새 마을은 빈 터 (말랑이 ${w2.mallangs.length}명, founded=${w2.village.founded})`)
r = await call('gm2', '/api/world', json({ type: 'quest.accept', questId: q.id, mallangId: me.id, at: at() }))
ok(r.status !== 200, `옆 마을 GM이 이 마을 학생을 건드림 → ${r.status} (막혀야 함)`)

console.log('\n[10] PIN 짧게 만들기')
r = await call('gm3', '/api/village', json({ villageName: 'x', hallName: 'y', pin: '12' }))
ok(r.status === 400, `PIN 두 자 → ${r.status} (400이어야 함)`)

console.log('\n[11] 나가기')
await call('stu', '/api/leave', { method: 'POST' })
jars.set('stu', 'mlng_id=')
r = await call('stu', '/api/world')
ok(r.status === 401, `퇴장 후 → ${r.status} (401이어야 함)`)

console.log('\n[12] 쿠키 위조')
jars.set('forge', 'mlng_id=' + Buffer.from(JSON.stringify({v:1,kind:'gm',villageId:'v-1',hallId:'hall-1',iat:Date.now()})).toString('base64url') + '.deadbeef')
r = await call('forge', '/api/world')
ok(r.status === 401, `서명 없는 위조 쿠키 → ${r.status} (401이어야 함)`)

if (failed > 0) {
  console.error(`\n권한 검사 ${failed}건 실패 — 이 상태로는 열면 안 됩니다.`)
  process.exit(1)
}
console.log('\n권한 검사 통과.')
