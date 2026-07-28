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
