-- 말랑스쿨 전체 스키마.
-- Supabase 대시보드 → SQL Editor 에 그대로 붙여넣고 실행하면 됩니다.
-- (마이그레이션을 따로 관리한다면 supabase/migrations/ 의 두 파일을 순서대로 쓰세요.)

-- 말랑스쿨 · 세계 상태
--
-- 마을 하나가 행 하나다. 세션·의뢰·말랑이·칭찬이 전부 snapshot(jsonb) 안에 들어 있고,
-- 모든 변경은 서버의 순수 리듀서(applyAction)를 거쳐 이 행을 통째로 갈아 끼운다.
--
-- 이렇게 잡은 이유:
--   · 세 클라이언트가 봐야 하는 것은 "한 순간의 세계 전체"다. 정산 시퀀스가 프레임 단위로
--     맞아야 하는데, 테이블 여덟 개의 변경을 각각 구독하면 도착 순서가 어긋난다.
--   · 한 행이므로 구독이 하나고, 낙관적 잠금(version)만으로 동시 전달이 안전하다.
--   · 한 반 28명 · 한 차시 규모에서 스냅샷은 수십 KB다.
--
-- 학년 단위 통계나 대륙 전체 조회가 필요해지면 그때 읽기 전용 정규화 테이블을
-- 이 행에서 파생시켜 쌓으면 된다 (아래 world_events 가 그 출발점).

create extension if not exists "pgcrypto";

create table if not exists public.worlds (
  village_id text primary key,
  snapshot   jsonb       not null,
  version    integer     not null default 1,
  updated_at timestamptz not null default now()
);

comment on table public.worlds is '마을 하나의 세계 상태 전체. 클라이언트는 이 행을 구독한다.';
comment on column public.worlds.version is '낙관적 잠금용. 쓰기는 반드시 version 일치를 조건으로 한다.';

create or replace function public.touch_world()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists worlds_touch on public.worlds;
create trigger worlds_touch
  before update on public.worlds
  for each row execute function public.touch_world();

-- 감사·복구용 액션 로그. 리듀서가 순수하므로 이 로그만 있으면 세계를 되짚을 수 있다.
create table if not exists public.world_events (
  id         bigserial primary key,
  village_id text        not null references public.worlds (village_id) on delete cascade,
  action     jsonb       not null,
  version    integer     not null,
  created_at timestamptz not null default now()
);

create index if not exists world_events_village_idx on public.world_events (village_id, id desc);

-- ── 실시간 ──────────────────────────────────────────────
-- 클래스 스크린의 실시간감이 서비스의 본체다. 폴링하지 않는다.
alter table public.worlds replica identity full;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'worlds'
  ) then
    alter publication supabase_realtime add table public.worlds;
  end if;
end
$$;

-- ── RLS ─────────────────────────────────────────────────
-- 학생은 실명도 이메일도 없다. 인증 주체는 말랑 코드를 쥔 브라우저이고,
-- 쓰기는 전부 서버(서비스 롤)를 거친다. 그래서 클라이언트에는 읽기만 연다.
alter table public.worlds       enable row level security;
alter table public.world_events enable row level security;

drop policy if exists worlds_read on public.worlds;
create policy worlds_read
  on public.worlds for select
  to anon, authenticated
  using (true);

-- 쓰기 정책은 만들지 않는다. service_role 은 RLS를 우회하므로 서버만 쓸 수 있다.

drop policy if exists world_events_read on public.world_events;
create policy world_events_read
  on public.world_events for select
  to authenticated
  using (true);

-- ── 제출 사진 ───────────────────────────────────────────
-- 사진은 Storage에 올리고 상태에는 URL만 싣는다.
-- 복구형 원정은 이 URL을 구조물 파츠로 직접 렌더한다.
insert into storage.buckets (id, name, public)
values ('submissions', 'submissions', true)
on conflict (id) do nothing;

-- 클래스 코드 장부와 제출 사진 비공개화
--
-- 0001 은 마을이 하나뿐이고 아무나 들어올 수 있다는 전제였다. 이 마이그레이션이
-- 그 두 가지를 함께 고친다: 코드로 마을을 가르고, 사진을 잠근다.

-- ── 클래스 코드 ─────────────────────────────────────────
-- 교사에게 이메일도 비밀번호도 받지 않는다. 클래스 코드와 PIN 한 쌍이 GM 자격이고,
-- 학생은 같은 코드로 들어와 말랑 코드를 받는다. 학교 계정 연동 없이 첫 수업이 열린다.
create table if not exists public.classes (
  class_code       text primary key,
  village_id       text        not null unique,
  hall_id          text        not null,
  village_name     text        not null,
  hall_name        text        not null,
  -- scrypt(salt.key). PIN 원문은 어디에도 남지 않는다.
  teacher_pin_hash text        not null,
  created_at       timestamptz not null default now()
);

comment on table public.classes is '클래스 코드 → 마을. 아직 신원이 없는 요청이 보는 유일한 표.';

alter table public.classes enable row level security;
-- 정책을 만들지 않는다. 조회는 전부 서버(service_role)를 거친다 —
-- 코드 대입을 클라이언트에서 무제한으로 시도할 수 없게 하기 위해서다.

-- worlds 와 수명을 맞춘다.
do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints
    where constraint_name = 'classes_village_fk'
  ) then
    alter table public.classes
      add constraint classes_village_fk
      foreign key (village_id) references public.worlds (village_id) on delete cascade;
  end if;
end
$$;

-- ── worlds 읽기 범위 좁히기 ─────────────────────────────
-- 0001 은 anon 에게 전 마을 읽기를 열어 두었다. 다른 반의 세계가 그대로 보인다.
--
-- 브라우저는 Realtime 구독을 위해 Supabase 쪽 신원이 필요하다. 그래서 우리 서버가
-- 쿠키를 확인한 뒤 village_id 클레임 하나만 담은 JWT를 발급하고(lib/server/realtimeToken.ts),
-- 정책은 그 클레임만 본다. 토큰에는 말랑 코드도 이름도 들어가지 않는다.
drop policy if exists worlds_read on public.worlds;

create policy worlds_read_own_village
  on public.worlds for select
  to authenticated
  using (village_id = (auth.jwt() ->> 'village_id'));

-- world_events 는 브라우저가 볼 일이 없다. 감사·복구용이므로 서버만 읽는다.
drop policy if exists world_events_read on public.world_events;

-- ── 제출 사진 ───────────────────────────────────────────
-- 중학생의 제출물이다. 공개 버킷에 두지 않는다.
-- 보기는 /api/photo 가 같은 마을인지 확인한 뒤 60초짜리 서명 URL로 넘긴다.
update storage.buckets set public = false where id = 'submissions';

-- 클라이언트에는 스토리지 정책을 열지 않는다. 업로드도 조회도 서버만 한다.
drop policy if exists "submissions read" on storage.objects;
drop policy if exists "submissions write" on storage.objects;
