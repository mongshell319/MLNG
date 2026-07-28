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
