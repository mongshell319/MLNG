#!/usr/bin/env node
/**
 * Supabase 경로 검증.
 *
 * 이 저장소에서 실제 Supabase 인스턴스에 대고 확인하지 못한 세 가지가 있다.
 *   1. RLS 가 마을 경계를 실제로 자르는가
 *   2. 브라우저가 우리 JWT 로 Realtime 을 구독하고 변경을 받는가
 *   3. 비공개 버킷의 제출 사진이 서명 URL 로만 열리는가
 *
 * 이 스크립트는 그 셋을 앱을 통해 끝까지 눌러 본다. 앱이 실제로 하는 것과 같은 경로를
 * 타므로, 통과하면 그 세 가지는 확인된 것이다.
 *
 *   # .env.local 에 Supabase 값 넣고
 *   npm run build && npm run start        # 한 터미널
 *   npm run check:supabase                # 다른 터미널
 */

import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const BASE = process.env.MLNG_BASE ?? 'http://localhost:3000'

// .env.local 을 읽어 온다 (dotenv 를 의존성으로 들이지 않기 위해)
for (const file of ['.env.local', '.env']) {
  try {
    for (const line of readFileSync(file, 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
    }
  } catch {
    /* 없으면 넘어간다 */
  }
}

const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
if (!URL_ || !ANON) {
  console.error('NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY 가 필요합니다.')
  process.exit(2)
}

let failed = 0
const ok = (cond, msg) => {
  if (!cond) failed++
  console.log(`  ${cond ? 'PASS' : 'FAIL'}  ${msg}`)
}

const jars = new Map()
async function call(who, path, opts = {}) {
  const headers = { ...(opts.headers ?? {}) }
  const c = jars.get(who)
  if (c) headers.cookie = c
  const res = await fetch(BASE + path, { ...opts, headers, redirect: 'manual' })
  const sc = res.headers.get('set-cookie')
  if (sc) jars.set(who, sc.split(';')[0])
  let body = null
  try {
    body = await res.json()
  } catch {
    /* 본문이 없을 수 있다 */
  }
  return { status: res.status, body, res }
}
const post = (o) => ({ method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(o) })
const at = () => new Date().toISOString()

// ── 0. 앱이 Supabase 로 붙어 있는지 ─────────────────────
console.log('\n[0] 저장소 확인')
let r = await call('a', '/api/village', post({ villageName: '검증 마을 A', hallName: '공작소', pin: 'check1234' }))
if (r.status !== 200) {
  console.error(`  마을을 만들지 못했습니다 (${r.status}). 앱이 떠 있고 Supabase 설정이 맞는지 확인해 주세요.`)
  console.error(`  ${JSON.stringify(r.body)}`)
  process.exit(2)
}
const A = r.body.classCode
let meA = await call('a', '/api/world')
ok(meA.body.transport === 'supabase', `저장소 = ${meA.body.transport} (supabase 여야 함)`)
if (meA.body.transport !== 'supabase') {
  console.error('  Supabase 로 붙어 있지 않습니다. 이 검증은 여기서 의미가 없습니다.')
  process.exit(2)
}
const villageA = meA.body.identity.villageId
const tokenA = meA.body.realtimeToken
ok(!!tokenA, `Realtime 토큰 발급됨`)
if (!tokenA) {
  console.error('  SUPABASE_JWT_SECRET 이 설정되지 않았습니다.')
  process.exit(2)
}

r = await call('b', '/api/village', post({ villageName: '검증 마을 B', hallName: '글방', pin: 'check5678' }))
ok(r.status === 200, `옆 마을 개설 → ${r.status}`)
const villageB = (await call('b', '/api/world')).body.identity.villageId

// ── 1. RLS 가 마을 경계를 자르는가 ──────────────────────
console.log('\n[1] RLS — 우리 토큰으로 남의 마을이 보이는가')
const asA = createClient(URL_, ANON, {
  auth: { persistSession: false, autoRefreshToken: false },
  global: { headers: { Authorization: `Bearer ${tokenA}` } },
})
const mine = await asA.from('worlds').select('village_id').eq('village_id', villageA)
ok(!mine.error && mine.data?.length === 1, `내 마을 읽기 → ${mine.error ? mine.error.message : `${mine.data.length}행`}`)

const theirs = await asA.from('worlds').select('village_id').eq('village_id', villageB)
ok(!theirs.error && (theirs.data?.length ?? 0) === 0, `옆 마을 읽기 → ${theirs.data?.length ?? 0}행 (0이어야 함)`)

const all = await asA.from('worlds').select('village_id')
ok((all.data?.length ?? 0) === 1, `전체 조회 → ${all.data?.length ?? 0}행 (내 마을 하나뿐이어야 함)`)

const anon = createClient(URL_, ANON, { auth: { persistSession: false } })
const anonRead = await anon.from('worlds').select('village_id')
ok((anonRead.data?.length ?? 0) === 0, `anon 키만으로 조회 → ${anonRead.data?.length ?? 0}행 (0이어야 함)`)

const classesPeek = await asA.from('classes').select('class_code')
ok((classesPeek.data?.length ?? 0) === 0, `클래스 장부 훔쳐보기 → ${classesPeek.data?.length ?? 0}행 (0이어야 함)`)

// ── 2. Realtime 이 변경을 밀어 주는가 ───────────────────
console.log('\n[2] Realtime — 전달이 교실 TV에 닿는가')
await asA.realtime.setAuth(tokenA)
const received = []
const channel = asA
  .channel(`check:${villageA}`)
  .on(
    'postgres_changes',
    { event: 'UPDATE', schema: 'public', table: 'worlds', filter: `village_id=eq.${villageA}` },
    (payload) => received.push(payload.new.snapshot),
  )
  .subscribe()

const subscribed = await new Promise((resolve) => {
  const started = Date.now()
  const t = setInterval(() => {
    if (channel.state === 'joined') {
      clearInterval(t)
      resolve(true)
    } else if (Date.now() - started > 15000) {
      clearInterval(t)
      resolve(false)
    }
  }, 200)
})
ok(subscribed, `구독 상태 = ${channel.state}`)

const t0 = Date.now()
await call('a', '/api/world', post({ type: 'season.weather', weather: '별똥별 소나기' }))
const delivered = await new Promise((resolve) => {
  const started = Date.now()
  const t = setInterval(() => {
    if (received.length > 0) {
      clearInterval(t)
      resolve(Date.now() - t0)
    } else if (Date.now() - started > 10000) {
      clearInterval(t)
      resolve(null)
    }
  }, 50)
})
ok(delivered !== null, `변경이 도착하기까지 ${delivered ?? '>10000'}ms`)
ok(delivered !== null && delivered < 1000, `1초 이내 (요구: 학생 전달 → C1 반영 1초 이내)`)
ok(received.at(-1)?.village?.weather === '별똥별 소나기', `받은 스냅샷의 값이 맞는가`)

// ── 3. 제출 사진이 잠겨 있는가 ──────────────────────────
console.log('\n[3] 제출 사진 — 비공개 버킷과 서명 URL')
r = await call('stu', '/api/enter/student', post({ classCode: A, name: '검증말랑', bodyColor: '#C5EBDD' }))
ok(r.status === 200, `학생 입장 → ${r.status}`)
const stu = (await call('stu', '/api/world')).body
const mid = stu.snapshot.mallangs.find((m) => m.code === stu.identity.code).id
const quest = stu.snapshot.quests.find((q) => q.kind === 'main')

const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
)
const fd = new FormData()
fd.append('file', new Blob([png], { type: 'image/png' }), 'a.png')
fd.append('questId', quest.id)
const up = await fetch(BASE + '/api/upload', { method: 'POST', body: fd, headers: { cookie: jars.get('stu') } })
const upBody = await up.json()
ok(up.status === 200, `업로드 → ${up.status} ${upBody.error ?? ''}`)
const key = upBody.snapshot?.progress?.find((p) => p.mallangId === mid)?.photoUrl
ok(!!key && key.startsWith(`${villageA}/`), `상태에 실린 값: ${key}`)

const viaApp = await fetch(`${BASE}/api/photo?p=${encodeURIComponent(key)}`, {
  headers: { cookie: jars.get('stu') },
  redirect: 'follow',
})
ok(viaApp.status === 200, `앱을 통한 조회 → ${viaApp.status}`)

const noCookie = await fetch(`${BASE}/api/photo?p=${encodeURIComponent(key)}`, { redirect: 'manual' })
ok(noCookie.status === 401, `쿠키 없이 → ${noCookie.status} (401이어야 함)`)

// 버킷이 정말 비공개인지 — 서명 없는 공개 URL 은 열리면 안 된다
const publicUrl = `${URL_}/storage/v1/object/public/submissions/${key}`
const rawGet = await fetch(publicUrl)
ok(rawGet.status !== 200, `서명 없는 공개 URL → ${rawGet.status} (200이면 버킷이 공개 상태)`)

// 옆 마을 GM 이 이 사진을 열 수 있으면 안 된다
const cross = await fetch(`${BASE}/api/photo?p=${encodeURIComponent(key)}`, {
  headers: { cookie: jars.get('b') },
  redirect: 'manual',
})
ok(cross.status === 404, `옆 마을 GM 조회 → ${cross.status} (404여야 함)`)

// ── 4. 액션 로그 ────────────────────────────────────────
console.log('\n[4] world_events — 감사 로그가 쌓이는가')
const events = await asA.from('world_events').select('id')
ok((events.data?.length ?? 0) === 0, `브라우저 토큰으로 조회 → ${events.data?.length ?? 0}행 (0이어야 함)`)

await asA.removeChannel(channel)

console.log(
  failed
    ? `\nSupabase 검증 ${failed}건 실패 — 이 상태로는 열면 안 됩니다.`
    : '\nSupabase 검증 통과. RLS · Realtime · 비공개 사진 모두 확인했습니다.',
)
console.log(`\n검증용으로 마을 두 개(${A}, 옆 마을)를 만들었습니다. 지우려면:`)
console.log(`  delete from public.worlds where village_id in ('${villageA}', '${villageB}');`)
process.exit(failed ? 1 : 0)
