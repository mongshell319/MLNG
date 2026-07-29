# 말랑스쿨 아트팩 — 통합 가이드

이 폴더는 **말랑스쿨의 아트 레이어 전부**다. 그림 파일(png/jpg/svg)은 하나도 없다.
모든 그림이 React 컴포넌트로 그려진다.

**이 아트팩은 자립적이다.** 프로젝트의 상태 관리·API·상수 파일을 일절 참조하지 않는다.
그래서 어떤 코드베이스에든 그대로 복사해 넣고, 데이터만 맞춰주면 된다.

---

## 1. 파일 (7개)

```
lib/art/tokens.js            팔레트 5종 · 선 굵기 위계 · 톤 함수 (모든 아트의 뿌리)
lib/art/seed.js              마을 코드 → 결정적 난수 (반마다 다른 마을)
components/Malang.jsx        말랑이 — 표정 8 · 진화 5형태 · 악세서리 8
components/art/Primitives.jsx  재사용 파츠 (잎·벽돌·문·창·꽃·등불·기념비·지붕결)
components/art/Buildings.jsx   건물 5종 × 성장 4단계
components/art/VillageScene.jsx 마을 파노라마 (시드 변주 + 팔레트 스왑)
components/art/FieldScene.jsx  원정 필드 5레이어 + 진행 시각화 7종 + 랜드마크 12종
components/art/Items.jsx       발견물 24종 · 간식 3 · 라인 아이콘 12
```

의존성: `react`만. 그 외 라이브러리 없음.

---

## 2. 넣는 방법

1. `lib/art/`와 `components/art/`, `components/Malang.jsx`를 프로젝트에 그대로 복사
2. `@/` 별칭이 프로젝트 루트를 가리키는지 확인 (Next.js면 `jsconfig.json`/`tsconfig.json`의 `paths`)
   - 별칭을 안 쓰면 각 파일 상단의 `@/lib/art/tokens` → 상대경로로 바꾸면 된다. 그게 전부다
3. TypeScript 프로젝트면 `.jsx`를 `.tsx`로 바꾸고 props에 타입만 붙이면 된다. 로직은 손댈 것 없음

---

## 3. 데이터 계약 ★ 여기만 맞추면 끝

아트 컴포넌트가 요구하는 데이터 모양이다. 프로젝트의 상태 구조가 다르면 **어댑터를 하나 만들어서 변환**한다. 아트 파일 내부를 고치지 말 것.

### VillageScene (마을 파노라마)

```jsx
<VillageScene room={room} width={1600} height={760} />
```

```js
room = {
  code: 'B8TVQL',        // 문자열이면 뭐든 됨. 이 값으로 마을 생김새가 결정된다
  phase: 'before',       // 'night' | 'finale' 이면 팔레트가 바뀜, 나머지는 낮
  weather: 'clear',      // 'fog' 이면 안개 팔레트
  examMode: false,       // true면 차분한 팔레트
  village: { ask: 4, make: 3, care: 4, dare: 2, keep: 3 },  // 각 1~4 (건물 성장 단계)
  amenities: ['bench', 'lamp', 'fountain'],                 // 없으면 []
  monuments: ['속삭이는 숲의 큰 나무'],                       // 없으면 []
}
```

**분야 키 5개는 고정이다**: `ask`(도서관) `make`(공방) `care`(광장) `dare`(등대) `keep`(정원).
프로젝트에서 다른 이름을 쓴다면 어댑터에서 매핑할 것.

### FieldScene (원정 필드)

```jsx
<FieldScene room={room} site={site} segment={segment} width={1600} height={760} crowd={crowd} />
```

```js
room = {
  code, phase, weather, examMode,     // 위와 동일
  expType: 'breach',                  // 아래 7종 중 하나 — 진행 시각화가 이걸로 결정됨
  prog: 7, target: 10,                // 진행도 (안개가 걷히는 정도, 게이지)
  submissions: [{ status: 'approved', photo: 'data:image/...' }],  // repair 유형에서만 사용
}

site = { id: 'forest' }               // forest | lake | mine | tower — 지역 색조 결정
segment = { id: 's3' }                // 랜드마크 결정 (아래 표)

crowd = [{ id, color: '#FFD6E5', form: 'tinker', wearing: 'ribbon' }]  // 필드에 서는 말랑이들. 없으면 []
```

**expType 7종**: `explore`(안개 걷힘) `search`(오브젝트 점등) `breach`(다리 판자) `repair`(제출 사진 9칸) `carry`(수레 이동) `decode`(문양 12칸) `raid`(실타래 풀림)

**segment.id → 랜드마크** (해당 id가 아니면 랜드마크 없이 배경만 나옴):

| site | segment.id | 랜드마크 |
|---|---|---|
| forest | s1 / s2 / s3 / s4 / sx | 이정표 / 갈림길 / 계곡 / 오두막 / 비석 |
| lake | l1 / l3 / l4 | 나루터 / 가라앉은 배 / 물 위 정자 |
| mine | m1 / m3 / m4 | 갱도 입구 / 수레길 / 광부의 방 |
| tower | t1 / t3 / t5 | 잔교 / 등대 / 등대(불 켜짐) |

### Malang (캐릭터)

```jsx
<Malang color="#FFD6E5" face="glad" size={110} form="tinker" acc="ribbon" />
```

- `face`: base | glad | full | focus | surprise | star | sleepy | sleep
- `form`: '' | book | tinker | warm | fire | sprout  (진화 형태)
- `acc`: ribbon | starpin | sprout | glasses | strawhat | goggle | scarf | crown

### Items

```jsx
<Discovery name="낡은 지도 조각" size={64} />   // 24종, 이름은 Items.jsx의 DISCOVERIES 키
<Snack id="macaron" size={54} />                // macaron | pudding | cotton
<Icon name="quest" size={24} />                 // 12종, ICON_NAMES 참조
```

### 어댑터 예시

프로젝트의 상태 이름이 다를 때:

```jsx
// components/art/adapter.js
export const toArtRoom = (session) => ({
  code: session.classCode,
  phase: session.currentPhase,
  weather: session.weatherId ?? 'clear',
  examMode: !!session.isExamPeriod,
  village: {
    ask: session.buildings.library ?? 1,
    make: session.buildings.workshop ?? 1,
    care: session.buildings.plaza ?? 1,
    dare: session.buildings.lighthouse ?? 1,
    keep: session.buildings.garden ?? 1,
  },
  amenities: session.amenities ?? [],
  monuments: session.monuments ?? [],
});
```

---

## 4. 절대 지킬 것

1. **색은 반드시 palette 객체(P)에서 가져온다.** 헥스값을 하드코딩하면 팔레트 스왑(밤·안개·시험기간·축제)이 깨진다
2. **빛은 항상 왼쪽 위에서 온다** → 오른쪽 면에만 `sh(color)` 톤을 깐다. 그라디언트가 아니라 별개의 색면이다
3. **선 굵기는 3단만** → `W.hi`(3, 실루엣) / `W.mid`(2.2, 파츠) / `W.lo`(1.5, 내부 디테일은 opacity 0.2~0.4)
4. **순수 검정(#000) 금지.** 모든 선과 글자는 `P.ink`(#6E5A54)
5. **그림자 금지, 직각 모서리 금지, 이미지 파일 추가 금지**
6. **부정 상태를 그리지 않는다.** 실패의 빨강, 슬픈 표정, 굶주림 연출은 이 세계에 존재하지 않는다

---

## 5. 결과를 눈으로 확인하는 법

SVG를 코드로 쓰면 결과가 보이지 않는다. 그래서 렌더 스크립트를 같이 넣었다.

```bash
npm i -D @babel/register @babel/preset-react @babel/preset-env
node scripts/render-art.js
```

`art-preview/`에 SVG가 떨어진다. 브라우저로 열어 확인한다.

**아트를 고쳤으면 반드시 이 루프를 돌 것:**
수정 → `node scripts/render-art.js` → `art-preview/` 확인 → 어긋나면 좌표 조정 → 반복.
눈으로 확인하지 않은 아트 수정은 커밋하지 않는다.

새 파츠를 추가했다면 `scripts/render-art.js`에 렌더 케이스도 추가할 것.

---

## 6. 자주 나오는 실수

- **팔레트를 안 넘김** → 컴포넌트 대부분이 `P` prop을 받는다. `pickPalette({phase, weather, examMode})`로 만들어 넘긴다
- **분야 키 불일치** → `ask/make/care/dare/keep` 다섯 개가 아니면 건물이 안 그려진다
- **segment.id 불일치** → 랜드마크가 안 나온다. 배경만 나오면 이걸 의심할 것
- **`'use client'` 누락** → Next.js App Router에서 아트 컴포넌트는 전부 클라이언트 컴포넌트다. 파일 상단에 이미 붙어 있으니 지우지 말 것
- **viewBox 무시하고 CSS로 크기 조절** → `width`/`height` prop으로 넘길 것. SVG는 `preserveAspectRatio="xMidYMax slice"`로 하단 정렬돼 있다
