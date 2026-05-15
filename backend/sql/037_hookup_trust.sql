create table if not exists public.hookup_trust_scores (

  id uuid primary key default gen_random_uuid(),

  user_id uuid not null unique,

  trust_score integer default 50,

  verification_level text default 'UNVERIFIED',

  fake_profile_risk integer default 50,

  behavior_risk integer default 50,

  report_count integer default 0,

  last_updated timestamptz default now()
);

create table if not exists public.hookup_identity_signals (

  id uuid primary key default gen_random_uuid(),

  user_id uuid not null,

  signal_type text,

  signal_value jsonb,

  weight integer default 1,

  created_at timestamptz default now()
);

create index if not exists idx_hookup_trust_user
on public.hookup_trust_scores(user_id);
