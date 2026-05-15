create table if not exists public.hookup_match_scores (

  id uuid primary key default gen_random_uuid(),

  user_a uuid not null,
  user_b uuid not null,

  compatibility_score integer default 0,
  behavior_score integer default 0,
  cultural_score integer default 0,
  trust_score integer default 0,
  chemistry_score integer default 0,

  final_score integer default 0,

  last_calculated timestamptz default now()
);

create index if not exists idx_match_user_a
on public.hookup_match_scores(user_a);

create index if not exists idx_match_user_b
on public.hookup_match_scores(user_b);
