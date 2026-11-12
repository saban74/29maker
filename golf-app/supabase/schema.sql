-- 4명 공유용 서버(Supabase) 표 만들기
-- Supabase 대시보드 → SQL Editor 에 이 내용을 붙여넣고 Run 하면 됩니다.

-- 라운드: 참여 코드 + 설정(골프장, 사람, 내기 규칙)
create table if not exists rounds (
  code text primary key,
  setup jsonb not null,
  created_at timestamptz default now()
);

-- 타수: 한 칸 = 한 사람의 한 홀
create table if not exists scores (
  round_code text references rounds(code) on delete cascade,
  hole int not null,
  player int not null,
  strokes int not null check (strokes between 1 and 20),
  updated_at timestamptz default now(),
  primary key (round_code, hole, player)
);

-- 골프장 정보 (관리 프로그램에서 올림)
create table if not exists courses (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz default now()
);

-- 보안 규칙
-- 라운드·타수: 참여 코드를 아는 사람은 보고 입력할 수 있음 (친구끼리 쓰는 수준)
alter table rounds enable row level security;
alter table scores enable row level security;
alter table courses enable row level security;

create policy "rounds read"   on rounds for select using (true);
create policy "rounds insert" on rounds for insert with check (true);
create policy "scores read"   on scores for select using (true);
create policy "scores write"  on scores for insert with check (true);
create policy "scores update" on scores for update using (true);
create policy "scores delete" on scores for delete using (true);

-- 골프장: 누구나 읽기만. 쓰기는 로그인한 관리자만
create policy "courses read"  on courses for select using (true);
create policy "courses admin" on courses for all to authenticated using (true) with check (true);

-- 실시간 전달 켜기
alter publication supabase_realtime add table scores;
