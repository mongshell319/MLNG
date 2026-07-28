# 말랑스쿨 (MallangSchool)

중학교 수업 한 차시를 **원정**으로 바꾸는 웹 서비스.
학생은 이세계 분신 **말랑이**의 플레이어이고, 반은 **마을**이라는 거점을 이루며, 수업마다 마을 밖 **원정지**로 떠난다.

`design_handoff_mallangschool` 핸드오프(디자인 스펙 v3.0 · 통합 기획서 v0.7)를 실제 서비스로 구현한 것이다.
프로토타입의 런타임(`support.js`)은 옮겨오지 않았고, 화면 구조·상태 머신·비주얼만 Next.js에서 다시 구현했다.

```bash
npm install
npm run dev          # http://localhost:3000
```

Supabase 없이 바로 돈다. 창을 세 개 띄워 두면 함께 움직이는 걸 확인할 수 있다.

| 열 곳 | 무엇 |
|---|---|
| `/screen` | **클래스 스크린 (C1)** · 교실 TV. 1920×1080 무대를 화면에 맞춰 스케일 |
| `/student` | **학생** · 태블릿 가로 / 폰 세로 |
| `/teacher` | **교사 GM** · 발행 · 검증 · 리모컨 · 시즌 |
| `/print` | **인쇄물 (P1–P3)** · 브라우저 인쇄로 A3 PDF |

**한 바퀴 돌려보기**: `/teacher`에서 **▶ 수업 시작** → `/screen`에 오프닝 40초가 뜬다 →
`/student`는 마을을 건너뛰고 오늘의 장소에 도착한다 → 학생이 사진·체크 3개를 채우고 **전달** →
교사 **검증함**에서 탭으로 승인 → 그 순간 C1의 안개가 물러난다 → **정산 시작**.

---

## 왜 이렇게 만들었나

핸드오프의 요구 중 구조를 결정한 세 가지가 있다.

**1. 세 클라이언트가 하나의 상태를 본다.**
그래서 상태를 화면별로 쪼개지 않고 마을 하나 = 스냅샷 하나로 두고, 모든 변경을 순수 리듀서 하나에 모았다.

```
lib/domain/actions.ts   applyAction(snapshot, action) → snapshot   ← 세계에 일어나는 일의 전부
lib/server/store.ts     저장 + 브로드캐스트 (Supabase | 로컬)
lib/client/world.tsx    구독 + dispatch                            ← 세 클라이언트가 공유
```

학생의 `quest.deliver`도, 교사의 `verify.approve`도, C1의 `session.nightStep`도 전부 같은 문을 지난다.
리듀서가 순수 함수라 저장소를 갈아 끼워도 결과가 같고, 액션 로그만 있으면 세계를 되짚을 수 있다.

**2. 정산 시퀀스는 프레임 동기여야 한다.**
서버 티커로 phase를 밀면 클라이언트마다 도착 시각이 어긋난다.
그래서 **시간에 관한 값은 전부 종료 시각으로 저장하고 남은 초는 각자 계산한다**.

```ts
// lib/domain/phase.ts
derivePhase(session, now)   // 저장된 phase는 GM이 누른 굵은 단계뿐.
                            // 오프닝 40초와 정산 125초의 세부 구간은 시작 시각에서 파생된다.
```

세 클라이언트가 같은 함수에 같은 입력을 넣으므로 같은 순간에 같은 화면이 된다. 폴링도, 서버 타이머도 없다.
스포트라이트 후보가 0명이면 그 구간이 통째로 빠지고 나머지가 앞당겨지는 것도 이 함수 안에서 처리된다.
빠른 정산 60초는 같은 계획을 비율로 압축한 것이다.

**3. 절대 규칙 아홉 개는 리뷰가 아니라 CI가 본다.**

```bash
npm run check:rules
```

`scripts/check-rules.mjs`가 학생·교실 표면(`app/student`, `app/screen`, `app/print`, `components/{student,screen,mallang}`)을 훑어
**학교의 언어**(과제·제출·마감·미제출·선생님·우리 반·학교·시간표·출석·로그인·완료율),
**우수의 언어**(최고·베스트·1등·뛰어난·완벽한), **순수 검정**, **실패의 빨강**, **직각 모서리**, **그림자**를 잡는다.
주석은 벗겨내고 보므로 규칙을 설명하는 주석에는 걸리지 않는다.

정적으로 못 잡는 것(숫자 비노출·홈의 조용함·등불 크기·말투)은 여전히 UI 리뷰의 몫이고, 체커가 통과하면서 그렇게 말한다.

---

## 구조

```
app/
  screen/      C1 — 8상태 상태 머신
  student/     S1–S10 라우터. 원정 중이면 place를 무시하고 필드로 고정
  teacher/     T1–T5 탭 + GM 리모컨 바
  print/       P1–P3
  api/world/   GET 스냅샷 · POST 액션 · /stream SSE

components/
  mallang/     Mallang(M 함수 포팅) · Keeper(터줏말랑 5종)
  screen/      Panorama · Opening · Field(유형 7종) · Overlays · Settle · Season · Buildings
  student/     Entry · Plaza · Board · HallDesk · Shop · Room · StudentField · Lake · ContinentMap · Spring
  teacher/     SessionRemote · Publish · Verify · Dashboard · SeasonPanel · Onboarding
  ui/          Icons(계열·클래스·유형) · primitives

lib/
  domain/      types · master(5분야 마스터 표) · actions · phase · spotlight · seed
  server/      store (Supabase | 로컬 어댑터)
  client/      world (구독 + dispatch)

supabase/migrations/0001_world.sql
scripts/check-rules.mjs
```

### 5분야 마스터 분류표가 단일 축이다

뱃지·자원·건물·클래스·터줏말랑·칭찬 문구·진화 형태·GM 리모컨이 전부 `lib/domain/master.ts`의 `FIELDS` 하나를 참조한다.
분야를 하나 고치면 다섯 시스템이 같이 움직인다. 축을 늘리지 말 것.

### 말랑이는 파츠 레이어다

`components/mallang/Mallang.tsx`는 프로토타입의 `M(color, face, size, accessory, form)`을 좌표까지 그대로 옮겼다.
몸 무늬 1장 + 머리 파츠 1장 + 색조로 나뉘어 있어 진화 5형태와 악세서리 한 슬롯이 서로 간섭하지 않는다.
디자이너 SVG 세트로 교체할 때도 이 레이어 계약만 지키면 된다.

### 스포트라이트 후보 산정

"이번 주 제출 최다"로 뽑으면 잘하고 빠른 학생이 독식한다(§11). 그래서 절대량이 아니라

```
score = (오늘 전달 − 본인의 최근 평균) + 무대에 못 오른 주 수 × 0.35
```

로 정렬한다(`lib/domain/spotlight.ts`). 같은 지표가 교사 화면의 **소외 감지**와 **분포 거울**을 만든다.
이 값들은 어느 학생 화면에도, 어떤 비교 형태로도 나오지 않는다.

---

## Supabase 붙이기

세 값을 채우면 저장소가 자동으로 바뀐다. 코드 수정은 없다.

```bash
cp .env.example .env.local
# NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY
psql "$DATABASE_URL" -f supabase/migrations/0001_world.sql
```

`worlds` 테이블의 jsonb 한 행이 마을 하나이고, 클라이언트는 그 행의 `postgres_changes`를 구독한다.
쓰기는 낙관적 잠금(`version`)으로 직렬화되므로 스물여덟 명이 동시에 전달해도 덮어쓰기가 없다.
RLS는 읽기만 열려 있고 쓰기는 서비스 롤(서버)만 한다 — 학생에게는 계정도 이메일도 없기 때문이다.

**한 행에 몰아넣은 이유**: 세 클라이언트가 봐야 하는 건 "한 순간의 세계 전체"다.
테이블 여덟 개를 각각 구독하면 정산 시퀀스에서 도착 순서가 어긋난다. 한 반 28명·한 차시 규모에서 스냅샷은 수십 KB다.
학년 단위 통계가 필요해지면 `world_events` 로그에서 읽기 전용 정규화 테이블을 파생시키면 된다.

Supabase 설정이 없으면 로컬 어댑터로 돈다 — 파일에 얹힌 인메모리 상태 + SSE(`/api/world/stream`).
계약이 같아서 개발·시연에서도 세 화면이 실제로 함께 움직인다.

---

## 구현 범위

핸드오프 §0.1 우선순위(`C1 → S2 → S3 → S7 → S6 → S9 → S8 → T2 → T3 → S1 → S5 → T4 → S10 → T1 → T5 → P1~P3`)를 전부 구현했다.

- **C1** 8상태 — 상시 파노라마(건물 5×성장 4단계) · 오프닝 40초 · 원정 필드 **유형 7종** · 난관/레이드 · 정산 7구간 · 잔도구(타이머·뽑기·모둠) · 물드는 밤 · 완공식
- **학생** S1–S10 — 게이트 입장부터 주민등록증, 광장 · 게시판(카드 4상태) · 상회 · 가게 · 내 방 · 원정 필드 · 채집 · 대륙 4단 줌 · 되돌림의 샘
- **교사** T1–T5 — 온보딩 5스텝 · 발행 3단계(예상 검증 부담 배지 · 자동 인증 제안) · 검증함(탭 승인 / 길게 눌러 반려) · 주 20분 미터 · 분포 거울 · 소외 감지 · 리모컨 · 시즌 운영
- **인쇄물** P1–P3 — 증표 90×54mm(QR · 말랑 코드) · A3 게이트 · 시즌 엽서
- **빈 상태** — 첫 사용(빈 터+캠프) · 의뢰 없는 날 · 스포트라이트 0명 · 검증함 0건 · 채집 상한 · 시험기간 모드 · 로딩

### 플레이스홀더로 남긴 것

핸드오프가 플레이스홀더라고 명시한 두 가지를 그대로 뒀다.

- **마을 건물 · 원정 필드 아트** — CSS/SVG 도형. `components/screen/Buildings.tsx`의 성장 4단계 계약만 지키면 일러스트로 교체된다
- **학생 제출 사진** — 지금은 더미 이미지 URL이 상태에 실린다. Storage 업로드로 바꾸면 `submissions` 버킷 URL이 그대로 들어오고, 복구형 원정은 이 URL을 구조물 파츠로 직접 렌더한다

### 확정이 필요한 것 (핸드오프 §확정 필요)

1. **Pretendard Rounded** 실물 — 현재 Pretendard + Jua. 폰트는 CDN이며 프로덕션에서는 self-host 권장
2. **파생 컬러 8종** — `app/globals.css`에 토큰으로 넣어 뒀으나 정식 토큰 승격 여부는 미정
3. **건물 성장 4단계** — 4단계까지 그렸지만 3·4단계의 시각적 도약은 일러스트가 들어와야 확정된다
4. **AI 기능**(터줏말랑 답장 · 마을 뉴스 · 나의 원정기) — 지금은 `master.ts`의 고정 문구다. 기획서 §17.3의 API 호출로 바꿀 자리이며, 안전 프롬프트를 잠그는 것이 전제다

---

## 스크립트

```bash
npm run dev          # 개발 서버
npm run build        # 프로덕션 빌드
npm run typecheck    # tsc --noEmit
npm run check:rules  # 절대 규칙 체커
npm run check        # 위 둘
```
