#!/usr/bin/env node
/**
 * 절대 규칙 체커 (handoff §3 · 위반 시 반려).
 *
 * 아홉 개 규칙 중 정적으로 잡을 수 있는 것을 잡는다.
 * 사람이 매번 눈으로 훑는 대신 CI가 훑게 하는 것이 목적이고,
 * 통과했다고 규칙을 다 지킨 것은 아니다 — 나머지는 UI 리뷰의 몫이다.
 *
 *   npm run check:rules
 */

import { readFileSync, readdirSync, statSync } from 'node:fs'
import { extname, join, relative } from 'node:path'

const ROOT = process.cwd()

/** 학생과 교실에 노출되는 표면. 교사 화면(components/teacher, app/teacher)은 제외한다. */
const PUBLIC_SURFACES = ['app/student', 'app/screen', 'app/print', 'components/student', 'components/screen', 'components/mallang']
/** 전 화면 공통으로 걸리는 표면 */
const ALL_SURFACES = ['app', 'components', 'lib']

const VOCAB = [
  // §3-4 학생 화면의 어휘 — 왼쪽을 쓰지 않고 오른쪽으로 부른다
  ['과제', '의뢰'],
  ['제출', '전달'],
  ['마감', '의뢰 만료'],
  ['미제출', '아직 안 깬 의뢰'],
  ['선생님', 'GM'],
  ['우리 반', '우리 마을'],
  ['학교', '영지'],
  ['시간표', '원정 일정'],
  ['출석', '도착'],
  ['로그인', '입장'],
  ['완료율', '(교사 화면에만)'],
]

const EXCELLENCE = ['최우수', '최고', '베스트', '1등', '일등', '뛰어난', '완벽한', '우수한']

function walk(dir, out = []) {
  let entries
  try {
    entries = readdirSync(dir)
  } catch {
    return out
  }
  for (const name of entries) {
    if (name === 'node_modules' || name === '.next' || name === '.data') continue
    const full = join(dir, name)
    if (statSync(full).isDirectory()) walk(full, out)
    else if (['.ts', '.tsx', '.css'].includes(extname(full))) out.push(full)
  }
  return out
}

/**
 * 주석과 import 경로를 지운다.
 * 규칙은 화면에 나오는 글자에 걸리는 것이지, 규칙을 설명하는 주석에 걸리는 게 아니다.
 */
function strip(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[^:])\/\/.*$/gm, '$1 ')
    .replace(/^\s*import[\s\S]*?from\s+['"][^'"]+['"]\s*$/gm, ' ')
}

function lineOf(source, index) {
  return source.slice(0, index).split('\n').length
}

const findings = []

function scan(files, checks) {
  for (const file of files) {
    const raw = readFileSync(file, 'utf8')
    const code = strip(raw)
    for (const check of checks) {
      let m
      const re = new RegExp(check.pattern, 'g')
      while ((m = re.exec(code))) {
        findings.push({
          file: relative(ROOT, file),
          line: lineOf(code, m.index),
          rule: check.rule,
          found: m[0].trim(),
          fix: check.fix,
        })
      }
    }
  }
}

const publicFiles = PUBLIC_SURFACES.flatMap((d) => walk(join(ROOT, d)))
const allFiles = [...new Set(ALL_SURFACES.flatMap((d) => walk(join(ROOT, d))))]

// §3-4 학생 화면의 어휘 — 한글 문자열 안에서만 본다
scan(
  publicFiles,
  VOCAB.map(([bad, good]) => ({
    rule: '§3-4 학생 화면의 어휘',
    pattern: `['"\`][^'"\`\\n]*${bad}[^'"\`\\n]*['"\`]|>[^<>{}\\n]*${bad}[^<>{}\\n]*<`,
    fix: `'${bad}' 대신 '${good}'`,
  })),
)

// §3-2 우수의 언어 금지 — 전 화면
scan(
  allFiles,
  EXCELLENCE.map((word) => ({
    rule: '§3-2 우수의 언어 금지',
    pattern: `['"\`][^'"\`\\n]*${word}[^'"\`\\n]*['"\`]`,
    fix: '도전한 · 해낸 · 꾸준한 · 새로 시도한 · 끝까지 간',
  })),
)

// §3 추가 제약 — 순수 검정 금지
scan(allFiles, [
  { rule: '§3 순수 검정 금지', pattern: '#000\\b|#000000\\b|\\bblack\\b', fix: 'ink-cocoa(#6E5A54)' },
])

// §3-3 부정 상태 없음 — 실패·경고의 빨강 금지
scan(allFiles, [
  {
    rule: '§3-3 실패·경고의 빨강 금지',
    pattern: '#[Ff][0-9A-Fa-f]{2}0000\\b|#[Ee][0-9A-Fa-f]0[0-3][0-9A-Fa-f]{2}\\b|\\bred\\b|\\bcrimson\\b',
    fix: '차분한 톤으로. 미완료는 평상 톤을 유지한다',
  },
])

// §3 추가 제약 — 직각 모서리 금지 / 그림자 금지
scan(allFiles, [
  { rule: '§3 직각 모서리 금지', pattern: 'rounded-none|border-radius:\\s*0(px)?\\b|borderRadius:\\s*0\\b', fix: '최소 라운드를 준다' },
  { rule: '§3 그림자 금지', pattern: 'box-shadow:(?!\\s*none)|boxShadow:\\s*[\'"`](?!none)|\\bshadow-(sm|md|lg|xl|2xl)\\b', fix: '깊이는 1.5px 외곽선이나 톤 차이로' },
])

if (findings.length === 0) {
  console.log('절대 규칙 체크 통과 — 정적으로 잡히는 위반 없음.')
  console.log('나머지 규칙(숫자 비노출 · 홈의 조용함 · 등불 크기 · 말투)은 UI 리뷰에서 봐 주세요.')
  process.exit(0)
}

console.error(`절대 규칙 위반 ${findings.length}건\n`)
for (const f of findings) {
  console.error(`  ${f.file}:${f.line}`)
  console.error(`    ${f.rule} — ${f.found}`)
  console.error(`    → ${f.fix}\n`)
}
process.exit(1)
