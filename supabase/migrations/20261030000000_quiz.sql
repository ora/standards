-- The ax.guide quiz (/play): signed-in players, the expert deck, runs and the
-- leaderboard. Open runs never reach the database; they are played in the
-- browser from content/quiz/open.json.
--
-- Every table has row level security on and no policies: only the site's
-- server, with the service role key, reads or writes them. The browser only
-- ever talks to Supabase Auth.

-- A player's public name. Filled when they first sign in: a GitHub handle,
-- or a first name and an initial ("Ada L."), or "player-1a2b3c". Never an
-- email address.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 40),
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

create or replace function public.quiz_handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  full_name text := nullif(trim(coalesce(meta ->> 'full_name', meta ->> 'name', '')), '');
  first_name text := split_part(full_name, ' ', 1);
  last_name text := nullif(split_part(full_name, ' ', 2), '');
begin
  insert into public.profiles (id, name)
  values (
    new.id,
    left(coalesce(
      nullif(meta ->> 'user_name', ''),
      nullif(first_name || coalesce(' ' || left(last_name, 1) || '.', ''), ''),
      'player-' || left(replace(new.id::text, '-', ''), 6)
    ), 40)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger quiz_on_auth_user_created
  after insert on auth.users
  for each row execute function public.quiz_handle_new_user();

-- The expert deck. `data` is one card in the shape of lib/quiz-schema.ts;
-- load it with the SQL that `npm run quiz:sql` writes. Kept here, not in the
-- public repository, so ranked players can't look the answers up.
create table public.quiz_questions (
  id text primary key,
  data jsonb not null,
  active boolean not null default true,
  updated_at timestamptz not null default now()
);
alter table public.quiz_questions enable row level security;

-- One expert run. `cards` holds each card's id and the order its options were
-- shown in. While a card is open, `served_at` says when it was dealt; it is
-- null between an answer and the next card, so reading an explanation never
-- counts against the clock. `results` is a 1 or 0 per answered card.
create table public.quiz_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  cards jsonb not null,
  position int not null default 0,
  served_at timestamptz,
  score int not null default 0,
  correct int not null default 0,
  streak int not null default 0,
  results text not null default '',
  started_at timestamptz not null default now(),
  finished_at timestamptz
);
alter table public.quiz_runs enable row level security;
create index quiz_runs_user_started on public.quiz_runs (user_id, started_at desc);
create index quiz_runs_finished_score on public.quiz_runs (finished_at, score desc) where finished_at is not null;

-- Each player's best finished run since a moment, ranked. Equal scores share
-- a rank; the earlier run is listed first.
create or replace function public.quiz_leaderboard(since timestamptz default '-infinity', max_rows int default 50)
returns table (
  rank bigint,
  name text,
  score int,
  correct int,
  total int,
  run_id uuid,
  finished_at timestamptz
)
language sql
stable
set search_path = ''
as $$
  with best as (
    select distinct on (r.user_id) r.user_id, r.id, r.score, r.correct, length(r.results) as total, r.finished_at
    from public.quiz_runs r
    where r.finished_at is not null and r.finished_at >= since
    order by r.user_id, r.score desc, r.finished_at asc
  )
  select rank() over (order by b.score desc), p.name, b.score, b.correct, b.total, b.id, b.finished_at
  from best b
  join public.profiles p on p.id = b.user_id
  order by b.score desc, b.finished_at asc
  limit max_rows;
$$;

-- Where a score would place among players' best scores since a moment, and
-- how many players there are.
create or replace function public.quiz_rank(for_score int, since timestamptz default '-infinity')
returns table (rank bigint, players bigint)
language sql
stable
set search_path = ''
as $$
  with best as (
    select max(r.score) as score
    from public.quiz_runs r
    where r.finished_at is not null and r.finished_at >= since
    group by r.user_id
  )
  select count(*) filter (where best.score > for_score) + 1, count(*)
  from best;
$$;

revoke all on function public.quiz_leaderboard(timestamptz, int) from public, anon, authenticated;
revoke all on function public.quiz_rank(int, timestamptz) from public, anon, authenticated;
revoke all on function public.quiz_handle_new_user() from public, anon, authenticated;
