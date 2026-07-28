import type {
  Accessory,
  BuildingKey,
  ClassRole,
  EvolutionForm,
  ExpeditionType,
  FieldKey,
  Phase,
  QuestKind,
} from './types'

/**
 * 5분야 마스터 분류표 (handoff §5분야 마스터 분류표).
 * 뱃지·자원·건물·클래스·터줏말랑·칭찬 문구·진화 형태·GM 리모컨이
 * 전부 이 표 하나를 참조한다. 축을 늘리지 말 것.
 */
export interface FieldDef {
  key: FieldKey
  label: string
  building: BuildingKey
  buildingLabel: string
  classRole: ClassRole
  classLabel: string
  keeper: string
  keeperAccessory: Accessory
  form: EvolutionForm
  formLabel: string
  praise: string
  /** 계열색 — 파스텔은 면에 */
  tint: string
  /** deep 계열 — 텍스트·외곽선·강조에 */
  deep: string
}

export const FIELDS: FieldDef[] = [
  {
    key: 'inquiry',
    label: '질문·탐구',
    building: 'library',
    buildingLabel: '도서관',
    classRole: 'scout',
    classLabel: '탐색가',
    keeper: '책장말랑',
    keeperAccessory: 'glasses',
    form: 'book',
    formLabel: '책벌레말랑',
    praise: '질문이 정말 좋았어',
    tint: '#C5EBDD',
    deep: '#4A8B6F',
  },
  {
    key: 'making',
    label: '창의·제작',
    building: 'workshop',
    buildingLabel: '공방',
    classRole: 'maker',
    classLabel: '발명가',
    keeper: '뚝딱말랑',
    keeperAccessory: 'goggle',
    form: 'tinker',
    formLabel: '뚝딱형말랑',
    praise: '아이디어가 새로웠어',
    tint: '#FFC9B5',
    deep: '#C96B4A',
  },
  {
    key: 'care',
    label: '협력·배려',
    building: 'plaza',
    buildingLabel: '광장',
    classRole: 'herald',
    classLabel: '전령',
    keeper: '다리말랑',
    keeperAccessory: 'scarf',
    form: 'warm',
    formLabel: '온기말랑',
    praise: '같이 해서 든든했어',
    tint: '#FFD6E5',
    deep: '#C96B4A',
  },
  {
    key: 'challenge',
    label: '도전·발표',
    building: 'lighthouse',
    buildingLabel: '등대',
    classRole: 'vanguard',
    classLabel: '선봉',
    keeper: '불꽃말랑',
    keeperAccessory: '',
    form: 'fire',
    formLabel: '불씨말랑',
    praise: '도전하는 모습이 멋졌어',
    tint: '#D9D2F5',
    deep: '#7A6BB5',
  },
  {
    key: 'steady',
    label: '꾸준함·완수',
    building: 'garden',
    buildingLabel: '정원',
    classRole: 'warden',
    classLabel: '파수꾼',
    keeper: '새싹말랑',
    keeperAccessory: 'strawhat',
    form: 'sprout',
    formLabel: '새싹형말랑',
    praise: '끝까지 해낸 게 대단해',
    tint: '#FFF0B3',
    deep: '#B8933A',
  },
]

export const FIELD_BY_KEY = Object.fromEntries(FIELDS.map((f) => [f.key, f])) as Record<FieldKey, FieldDef>
export const FIELD_BY_FORM = Object.fromEntries(FIELDS.map((f) => [f.form, f])) as Record<string, FieldDef>
export const FIELD_BY_ROLE = Object.fromEntries(FIELDS.map((f) => [f.classRole, f])) as Record<ClassRole, FieldDef>

/** 클래스 5직 필드 능력 — 한 클래스가 빠지면 못 하는 일이 생긴다. */
export const CLASS_ABILITY: Record<ClassRole, { label: string; ability: string; action: string; result: string }> = {
  scout: {
    label: '탐색가',
    ability: '숨겨진 것을 발견. 이 클래스가 있어야 갈림길·비밀 구간이 보인다',
    action: '숨은 것 찾아보기',
    result: '갈림길 하나가 드러났어요 — 지선 구간이 열렸어요',
  },
  maker: {
    label: '발명가',
    ability: '핵심 조각 제작. 복구형 원정에서 가산',
    action: '핵심 조각 만들기',
    result: '핵심 조각을 만들었어요 — 복구가 빨라져요',
  },
  herald: {
    label: '전령',
    ability: '흩어진 파티를 모은다. 모둠 합류·공동 목표 개시',
    action: '흩어진 파티 모으기',
    result: '흩어진 동료들을 모았어요 — 공동 목표가 열렸어요',
  },
  vanguard: {
    label: '선봉',
    ability: '앞장서 구간 개방. 첫 진입 담당',
    action: '첫 진입 하기',
    result: '첫 진입 완료 — 구간이 열렸어요',
  },
  warden: {
    label: '파수꾼',
    ability: '안전 확보·귀환로 표시. 재도전 시 진행 유지',
    action: '귀환로 표시하기',
    result: '귀환로를 표시했어요 — 다음에 여기서 다시 시작해요',
  },
}

/** 원정 유형 7종. 유형마다 진행 시각화가 다르다. */
export interface ExpeditionDef {
  key: ExpeditionType
  label: string
  /** 진행 시각화 한 줄 */
  visual: string
  /** 어울리는 활동 */
  suits: string
  /** 학생 화면 중앙의 지금 할 일 */
  todo: string
}

export const EXPEDITIONS: ExpeditionDef[] = [
  { key: 'explore', label: '탐사', visual: '안개가 물러나며 오솔길이 드러남', suits: '자료 조사, 관찰 기록, 인터뷰', todo: '오늘의 기록 전달하기' },
  { key: 'search', label: '수색', visual: '숨은 오브젝트에 하나씩 불이 켜짐', suits: '근거 찾기, 오류 찾기', todo: '찾아낸 것 전달하기' },
  { key: 'breach', label: '돌파', visual: '끊긴 다리에 판자가 이어짐', suits: '문제 해결, 설계, 토론 결론', todo: '해결한 것 전달하기' },
  { key: 'repair', label: '복구', visual: '부서진 구조물 9칸에 사진이 파츠로 부착', suits: '제작 실습, 조리, 작품 완성', todo: '만든 것 전달하기' },
  { key: 'carry', label: '운반', visual: '커다란 물건이 참여자 수만큼 이동', suits: '협동 과제, 릴레이', todo: '내 몫 옮기기' },
  { key: 'decode', label: '해독', visual: '고대 문양 12칸이 하나씩 채워짐', suits: '추리, 분석, 개념 정리', todo: '풀어낸 것 전달하기' },
  { key: 'raid', label: '레이드', visual: '잠든 큰 나무의 실타래가 한 가닥씩 풀림', suits: '단원 마무리, 학년 공동 프로젝트', todo: '한 가닥 풀기' },
]

export const EXPEDITION_BY_KEY = Object.fromEntries(EXPEDITIONS.map((e) => [e.key, e])) as Record<
  ExpeditionType,
  ExpeditionDef
>

/** 의뢰 계열 — 색과 의미는 고정 결합, 교차 사용 금지. */
export const QUEST_KIND: Record<QuestKind, { label: string; tint: string; deep: string; icon: 'flag' | 'note' | 'house' | 'bolt' }> = {
  main: { label: '메인 의뢰', tint: '#FFC9B5', deep: '#C96B4A', icon: 'flag' },
  side: { label: '사이드 의뢰', tint: '#C5EBDD', deep: '#4A8B6F', icon: 'note' },
  guild: { label: '길드 의뢰', tint: '#D9D2F5', deep: '#7A6BB5', icon: 'house' },
  flash: { label: '돌발 의뢰', tint: '#FFF0B3', deep: '#B8933A', icon: 'bolt' },
}

/** 말랑이 몸색 6틴트. */
export const BODY_TINTS = ['#FFD6E5', '#FFC9B5', '#C5EBDD', '#D9D2F5', '#FFF0B3', '#FFF6EC']

export const WEATHER_DESC: Record<string, string> = {
  맑음: '모든 의뢰 기분 좋게 진행!',
  '구름 조금': '느긋하게 가도 좋은 날',
  '별똥별 소나기': '돌발 의뢰가 찾아올지도!',
}

/** 정산 시퀀스 타임라인 (기본 125초 / 빠른 정산 60초). */
export const SETTLE_TIMELINE: { phase: Phase; from: number; to: number; label: string }[] = [
  { phase: 'settling', from: 0, to: 5, label: '카운트다운' },
  { phase: 'total', from: 5, to: 20, label: '반 전체 총량' },
  { phase: 'return', from: 20, to: 35, label: '귀환 보고' },
  { phase: 'spotlight', from: 35, to: 95, label: '스포트라이트' },
  { phase: 'badgesum', from: 95, to: 105, label: '뱃지 집계' },
  { phase: 'growth', from: 105, to: 113, label: '마을 성장' },
  { phase: 'finale', from: 113, to: 125, label: '마무리' },
]

/** 원정 중으로 간주하는 phase 집합 (§4 두 개의 모드). */
export const EXPEDITION_PHASES: Phase[] = [
  'opening',
  'live',
  'settling',
  'total',
  'return',
  'spotlight',
  'badgesum',
  'growth',
]

export const SETTLE_PHASES: Phase[] = ['settling', 'total', 'return', 'spotlight', 'badgesum', 'growth']

export function isExpedition(phase: Phase): boolean {
  return EXPEDITION_PHASES.includes(phase)
}

export function isSettling(phase: Phase): boolean {
  return SETTLE_PHASES.includes(phase)
}

export const PHASE_LABEL: Record<Phase, string> = {
  before: '원정 전',
  opening: '오프닝 상영 중',
  live: '원정 중',
  settling: '정산 카운트다운',
  total: '정산 · 반 전체',
  return: '귀환 보고',
  spotlight: '스포트라이트',
  badgesum: '뱃지 집계',
  growth: '마을 성장',
  after: '원정 종료 · 자유 시간',
  night: '물드는 밤',
  finale: '시즌 완공식',
}

/** 반려 사유 프리셋 — 전부 조건 미충족형. 품질을 지적하는 문구는 만들지 않는다 (§T3). */
export const REJECT_REASONS = [
  '사진이 잘 안 보여요',
  '체크 항목이 하나 남았어요',
  '다른 의뢰 사진 같아요',
  '이름표(말랑 코드)가 필요해요',
]

/** 터줏말랑 답장 문구 — 전달 승인 시 카드에 도착. */
export const KEEPER_REPLIES: Record<FieldKey, string> = {
  inquiry: '보내준 기록 잘 봤어. 다음에도 그 질문 들고 와 줘.',
  making: '이거 딱 필요했던 거야. 공방 한쪽에 올려 뒀어.',
  care: '덕분에 오늘 광장이 한결 수월했어. 고마워.',
  challenge: '먼저 나서 준 거, 등대에서 다 봤어.',
  steady: '끝까지 온 게 제일 어려운 건데. 정원에 심어 뒀어.',
}

/** 마을 뉴스 벽보 — 폰으로 들어왔을 때 가장 먼저 읽히는 것 (§S2). */
export const VILLAGE_NEWS = [
  '광장 벤치를 하나 더 놓기로 했습니다. 앉는 자리가 늘어요.',
  '호숫가에 물고기가 많아졌다고 합니다. 느긋하게 가 보세요.',
  '가게 앞에 새 물건이 들어왔대요. 구경만 해도 재밌어요.',
  '정원 쪽 길이 조금 넓어졌습니다. 지나다니기 편해졌어요.',
]

/** 터줏말랑 잡담 — 탭하면 뜨는 오늘의 말풍선. 말투는 담백하게 (§3-8). */
export const KEEPER_CHATS = [
  '오늘 낮에 숲 어귀로 간다더라. 준비는 천천히 해도 돼.',
  '광장 벤치, 저기 자리 비었어. 앉아 있어도 아무도 안 뭐라 해.',
  '가게 앞에 새 물건 들어왔대. 구경만 해도 재밌어.',
  '아직 안 깬 의뢰 하나 남았지? 언제 해도 보상은 똑같아.',
]

/** 무보상 산책 행동 (§S2). 보상 없음이 핵심. */
export const STROLL_ACTIONS = [
  { key: 'bench', label: '벤치에 앉기', line: '앉았다. 아무 일도 일어나지 않는다. 좋다.' },
  { key: 'water', label: '물가에 발 담그기', line: '발끝이 시원하다. 물결이 천천히 지나간다.' },
  { key: 'well', label: '우물 들여다보기', line: '어? 개구리말랑이 이쪽을 본다. 눈이 마주쳤다.' },
  { key: 'garden', label: '정원에 쪼그려 앉기', line: '흙 냄새가 난다. 새싹 하나가 조금 자랐다.' },
]

export const PLACE_LABEL: Record<string, { name: string; sub: string }> = {
  plaza: { name: '마을 광장', sub: '우리 마을의 한가운데' },
  board: { name: '마을 게시판', sub: '오늘의 의뢰와 원정 일정' },
  hall: { name: '기가 공작소', sub: '의뢰 접수처 · 뚝딱말랑의 일터' },
  shop: { name: '말랑 가게', sub: '간식과 꾸미기' },
  room: { name: '내 방', sub: '내 물건들이 있는 곳' },
  lake: { name: '호숫가', sub: '이세계 생활 · 느긋하게 낚시' },
  map: { name: '대륙 지도', sub: '대륙 · 나라 · 영지 · 우리 마을' },
  spring: { name: '되돌림의 샘', sub: '다른 형태를 비춰 보는 곳' },
  field: { name: '원정 필드', sub: '오늘의 구간' },
}

/** 채집 일일 상한. 도달하면 만족 낮잠 — 에너지 게이지·경고·카운트다운 금지. */
export const GATHER_DAILY_CAP = 4

export const FISH_POOL = [
  { name: '동글붕어', tint: '#BFE3EF' },
  { name: '말랑송어', tint: '#FFD6E5' },
  { name: '별무늬치', tint: '#D9D2F5' },
  { name: '풀잎피라미', tint: '#C5EBDD' },
  { name: '노을잉어', tint: '#FFC9B5' },
  { name: '달빛조개', tint: '#FFF0B3' },
]

/** 상점 (§S5). 간식 3종 · 악세서리 상시 8종 · 주간 한정 1슬롯. */
export const SNACKS = [
  { key: 'pudding', name: '말랑 푸딩', price: 15, tint: '#FFF0B3' },
  { key: 'macaron', name: '구름 마카롱', price: 25, tint: '#FFD6E5' },
  { key: 'cake', name: '숲속 조각 케이크', price: 40, tint: '#C5EBDD' },
]

export const SHOP_ACCESSORIES: { key: Accessory; name: string; price: number }[] = [
  { key: 'ribbon', name: '분홍 리본', price: 30 },
  { key: 'starpin', name: '별 핀', price: 35 },
  { key: 'strawhat', name: '밀짚모자', price: 45 },
  { key: 'sprout', name: '새싹 머리핀', price: 40 },
  { key: 'goggle', name: '작업 고글', price: 50 },
  { key: 'glasses', name: '동그란 안경', price: 40 },
  { key: 'scarf', name: '포근한 목도리', price: 55 },
  { key: 'crown', name: '작은 왕관', price: 70 },
]

export const WEEKLY_ITEM = { key: 'crown' as Accessory, name: '이번 주 · 별빛 왕관', price: 80, dday: 4 }

/** 업적 액자 — 공개 7종 + 숨김 3종 (§S6). */
export const ACHIEVEMENTS_OPEN = [
  '첫 의뢰 해결',
  '사이드 개척자',
  '길드의 기둥',
  '3주 연속 원정',
  '간식 소믈리에',
  '첫 하트 배달',
  '설계 장인',
]
export const ACHIEVEMENTS_HIDDEN = 3

/** 의뢰 템플릿 (§T2 1단계). */
export const QUEST_TEMPLATES: {
  key: string
  subject: string
  type: ExpeditionType
  title: string
  field: FieldKey
  checklist: [string, string, string]
}[] = [
  { key: 't1', subject: '기술·가정', type: 'repair', title: '3분 안전 점검', field: 'making', checklist: ['점검표 3칸을 채웠어요', '사진에 결과가 보여요', '정리까지 마쳤어요'] },
  { key: 't2', subject: '기술·가정', type: 'breach', title: '작은 다리 설계하기', field: 'making', checklist: ['설계도를 그렸어요', '재료를 정했어요', '사진을 찍었어요'] },
  { key: 't3', subject: '국어', type: 'decode', title: '문장의 뼈대 찾기', field: 'inquiry', checklist: ['문장 3개를 골랐어요', '뼈대를 표시했어요', '사진을 찍었어요'] },
  { key: 't4', subject: '국어', type: 'explore', title: '우리 동네 말 모으기', field: 'inquiry', checklist: ['말 5개를 모았어요', '쓴 사람을 적었어요', '사진을 찍었어요'] },
  { key: 't5', subject: '과학', type: 'search', title: '실험 오류 찾아내기', field: 'inquiry', checklist: ['오류 2개를 찾았어요', '이유를 적었어요', '사진을 찍었어요'] },
  { key: 't6', subject: '과학', type: 'carry', title: '관찰 기록 릴레이', field: 'care', checklist: ['내 차례를 적었어요', '앞사람 것을 확인했어요', '사진을 찍었어요'] },
  { key: 't7', subject: '공통', type: 'raid', title: '단원 마무리 원정', field: 'steady', checklist: ['정리 노트를 썼어요', '질문 하나를 남겼어요', '사진을 찍었어요'] },
  { key: 't8', subject: '공통', type: 'explore', title: '오늘의 관찰 한 컷', field: 'challenge', checklist: ['한 컷을 골랐어요', '한 줄을 적었어요', '사진을 찍었어요'] },
]
