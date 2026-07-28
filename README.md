# 말랑스쿨 (MallangSchool)

중학교 수업 한 차시를 **원정**으로 바꾸는 웹 서비스.
학생은 이세계 분신 **말랑이**의 플레이어이고, 반은 **마을**이라는 거점을 이루며, 수업마다 마을 밖 **원정지**로 떠난다.

`design_handoff_mallangschool` 핸드오프(디자인 스펙 v3.0 · 통합 기획서 v0.7)를 실제 서비스로 구현한 것이다.
프로토타입의 런타임(`support.js`)은 옮겨오지 않았고, 화면 구조·상태 머신·비주얼만 Next.js에서 다시 구현했다.

```bash
npm install
npm run dev          # http://localhost:3000
```

Supabase 없이 바로 돈다. 개발 모드에는 시연용 교실이 하나 들어 있다 —
**클래스 코드 `MLNG24`, 교사 PIN `demo`** (프로덕션에서는 만들어지지 않는다).

| 열 곳 | 무엇 |
|---|---|
| `/screen` | **클래스 스크린 (C1)** · 교실 TV. 1920×1080 무대를 화면에 맞춰 스케일 |
| `/student` | **학생** · 태블릿 가로 / 폰 세로 |
| `/teacher` | **교사 GM** · 발행 · 검증 · 리모컨 · 시즌 |
| `/print` | **인쇄물 (P1–P3)** · 브라우저 인쇄로 A3 PDF |

**한 바퀴 돌려보기**

1. `/teacher` → `MLNG24` / `demo` 로 입장 (또는 **새 마을 세우기**로 직접 만들기)
2. **클래스 스크린 열기** → QR을 교실 TV로 찍으면 `/screen`이 그 마을에 붙는다
3. `/student?class=MLNG24` → 게이트가 열리고 말랑이를 만든다
4. 교사 화면에서 **▶ 수업 시작** → TV에 오프닝 40초 → 학생은 마을을 건너뛰고 오늘의 장소에 도착
5. 학생이 사진·체크 3개를 채우고 **전달** → 교사 **검증함**에서 탭으로 승인 → 그 순간 TV의 안개가 물러난다
6. **정산 시작**

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

## 인증과 권한

**학생에게는 계정도 이메일도 실명도 없다** (§3-5). 그래서 인증의 주체가 사람이 아니라
"말랑 코드를 쥔 브라우저"다. 교사도 같은 원칙을 따른다 — 클래스 코드와 PIN 한 쌍이 그 마을의 GM 자격이고,
학교 계정 연동 없이 첫 수업을 열 수 있다.

신원은 세 종류다.

| | 얻는 법 | 할 수 있는 것 |
|---|---|---|
| `student` | 클래스 코드로 입장 → 말랑 코드 발급 | 자기 말랑이에 관한 것만 |
| `gm` | 클래스 코드 + PIN | 세션 · 검증 · 리모컨 · 시즌 |
| `screen` | GM이 만든 10분짜리 링크를 TV가 한 번 교환 | 보기 + 자기 연출 진행 |

코드는 입장할 때 한 번만 오가고, 이후에는 HttpOnly 서명 쿠키(HMAC-SHA256)만 쓴다.
PIN은 scrypt로 해시해 저장하고 원문은 어디에도 남지 않는다.

권한은 **리듀서 밖**에서 본다(`lib/domain/authz.ts`). 리듀서는 "무슨 일이 일어나는가"만 알고,
"누가 그걸 할 수 있는가"는 액션 하나하나에 대해 따로 정해진다. 기본은 거부이므로
새 액션을 추가하면 등록하기 전까지 아무도 부를 수 없다.

```bash
npm run dev        # 다른 터미널에서
npm run check:auth
```

`scripts/check-auth.mjs`가 실제로 서버를 두드려 본다 — 학생 쿠키로 정산을 시작할 수 있는지,
남의 말랑이로 전달·구매가 되는지, 옆 마을 사진이 보이는지, 위조 쿠키가 통과하는지.
한 줄이라도 PASS가 아니면 열면 안 되는 상태다.

### 제출 사진

중학생의 제출물이라 공개 버킷에 두지 않는다.

- 업로드와 상태 반영을 **서버가 한 번에** 한다(`/api/upload`). 클라이언트는 경로를 정하지 못한다 —
  `quest.photo` 액션이 학생 권한 목록에서 일부러 빠져 있고, 그래서 임의의 외부 주소가
  교실 TV나 교사 검증함에 렌더될 길이 없다
- 상태에는 스토리지 경로만 실린다. 보기는 `/api/photo`가 **같은 마을인지 확인한 뒤**
  60초짜리 서명 URL로 넘긴다
- 경계는 마을 단위다. 완성된 작품은 복구형 원정의 구조물 파츠로 교실 TV에 함께 걸리기 때문이다

---

## 구조

```
app/
  screen/      C1 — 8상태 상태 머신
  student/     S1–S10 라우터. 원정 중이면 place를 무시하고 필드로 고정
  teacher/     T1–T5 탭 + GM 리모컨 바
  print/       P1–P3 (GM 전용)
  api/
    world/     GET 스냅샷 · POST 액션(권한 검사) · /stream SSE
    enter/     student · gm · screen 입장
    village/   새 마을 세우기
    upload/    제출 사진 (업로드 + 상태 반영)
    photo/     제출 사진 보기 (서명 URL)

components/
  mallang/     Mallang(M 함수 포팅) · Keeper(터줏말랑 5종)
  screen/      Panorama · Opening · Field(유형 7종) · Overlays · Settle · Season · Buildings
  student/     Entry · Plaza · Board · HallDesk · Shop · Room · StudentField · Lake · ContinentMap · Spring
  teacher/     SessionRemote · Publish · Verify · Dashboard · SeasonPanel · Onboarding
  ui/          Icons(계열·클래스·유형) · primitives

lib/
  domain/      types · master(5분야 마스터 표) · actions · phase · spotlight · seed · authz
  server/      store(Supabase | 로컬) · auth · registry · realtimeToken · ratelimit
  client/      world(구독 + dispatch) · photo

Dockerfile · render.yaml   컨테이너 하나로 띄우는 경로
supabase/migrations/
  0001_world.sql
  0002_classes_and_private_photos.sql
scripts/
  check-rules.mjs   절대 규칙 (정적)
  check-auth.mjs    권한 경계 (실제 서버를 두드림)
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

## 웹에 올리기

두 갈래가 있다. **한 학교 규모라면 A가 훨씬 단순하다.**

### A. 컨테이너 하나 (외부 서비스 없음)

세계 상태를 마운트한 디스크에 두고 실시간은 SSE로 한다. Supabase도, 데이터베이스도 필요 없다.
**인스턴스를 늘리면 안 된다** — 세계가 갈라진다. 그래서 `MLNG_SINGLE_INSTANCE=1` 로 명시해야만 켜진다.

**Render** — 저장소를 연결하면 `render.yaml` 하나로 뜬다. `SESSION_SECRET`은 Render가 만들어 넣는다.
디스크가 필요하므로 유료 플랜(starter)이어야 한다.

**직접 / Fly / Railway**

```bash
docker build -t mallangschool .
docker run -p 3000:3000 \
  -e SESSION_SECRET="$(openssl rand -base64 48)" \
  -e MLNG_SINGLE_INSTANCE=1 \
  -v mallang-data:/data \
  mallangschool
```

`/data`에 세계 상태와 제출 사진이 쌓인다. 볼륨을 붙이지 않으면 컨테이너와 함께 사라진다.

첫 접속에서 `/teacher` → **새 마을 세우기**로 마을을 만들면 클래스 코드가 나온다.
시연용 교실(`MLNG24`)은 프로덕션에서 만들어지지 않으니, 그 코드로는 들어갈 수 없다.

### B. Vercel + Supabase

여러 학교로 커지거나 서버를 직접 두고 싶지 않을 때. 서버리스라 인스턴스가 여럿이므로 A는 쓸 수 없다.

```bash
psql "$DATABASE_URL" -f supabase/migrations/0001_world.sql
psql "$DATABASE_URL" -f supabase/migrations/0002_classes_and_private_photos.sql
```

Vercel 환경변수 다섯 개: `SESSION_SECRET`(32자 이상), `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`.

`worlds` 테이블의 jsonb 한 행이 마을 하나다. 쓰기는 낙관적 잠금(`version`)으로 직렬화되므로
스물여덟 명이 동시에 전달해도 덮어쓰기가 없고, 충돌하면 최신 상태 위에서 다시 적용한다.
모든 액션은 `world_events`에 남아 감사와 복구에 쓴다.

**한 행에 몰아넣은 이유**: 세 클라이언트가 봐야 하는 건 "한 순간의 세계 전체"다.
테이블 여덟 개를 각각 구독하면 정산 시퀀스에서 도착 순서가 어긋난다. 한 반 28명·한 차시 규모에서
스냅샷은 수십 KB다. 학년 단위 통계가 필요해지면 `world_events`에서 읽기 전용 정규화 테이블을
파생시키면 된다.

**실시간 구독의 범위** — 브라우저가 `worlds` 행을 구독하려면 Supabase 쪽에서도 신원이 있어야 한다.
anon 키로 열어 두면 RLS가 걸 것이 없어서 **다른 학교의 세계까지 전부 구독된다**. 그래서 우리 서버가
쿠키를 확인한 뒤 `village_id` 클레임 하나만 담은 JWT를 발급하고, 정책은 그것만 본다.

```sql
using (village_id = (auth.jwt() ->> 'village_id'))
```

토큰에는 마을 말고 아무것도 담지 않는다 — 말랑 코드도 이름도 들어가지 않는다.
수명은 한 시간이고 클라이언트가 만료 5분 전에 갈아 끼우므로 수업 중에 끊기지 않는다.

### 어느 쪽이든

- `SESSION_SECRET` 없이는 프로덕션 빌드가 아예 뜨지 않는다. 쿠키 위조를 막는 유일한 값이다
- 두 설정이 모두 없으면 `getStore()`가 명시적으로 실패한다. 조용히 잘못 도는 것보다 낫다
- **레이트 리밋이 인스턴스 단위다**(`lib/server/ratelimit.ts`). 보안 경계로 삼지 않았고(경계는 권한 검사다)
  폭주 완충으로만 쓴다. 더 엄한 한도가 필요하면 공유 카운터로 바꾸면 된다
- **에러 로깅·모니터링이 없다**. Sentry 같은 것을 붙일 자리가 아직 비어 있다

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
제출 사진은 더 이상 플레이스홀더가 아니다 — 실제 업로드가 `submissions` 버킷(비공개)으로 가고,
복구형 원정이 그 경로를 구조물 파츠로 직접 렌더한다.

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
npm run check:rules  # 절대 규칙 체커 (정적)
npm run check        # typecheck + check:rules
npm run check:auth   # 권한 체커 (개발 서버를 띄운 상태에서)
```
