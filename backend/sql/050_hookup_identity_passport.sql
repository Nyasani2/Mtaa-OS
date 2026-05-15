create table if not exists public.hookup_identity_passports (

  id uuid primary key default gen_random_uuid(),

  user_id uuid not null unique,

  passport_id text unique,

  verification_level text default 'BASIC',
  -- BASIC | VERIFIED | HIGH_TRUST | GOVERNMENT_LINKED

  global_reputation_score integer default 50,

  linked_apps text[] default '{}',

  biometric_hash text,

  created_at timestamptz default now()
);

create table if not exists public.hookup_cross_app_activity (

  id uuid primary key default gen_random_uuid(),

  passport_id text not null,

  app_source text,

  action_type text,

  risk_score integer default 0,

  created_at timestamptz default now()
);

create index if not exists idx_passport_user
on public.hookup_identity_passports(user_id);
