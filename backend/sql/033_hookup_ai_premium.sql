create table if not exists public.hookup_subscriptions (

  id uuid primary key default gen_random_uuid(),

  user_id uuid not null,

  tier text not null,

  active boolean default true,

  expires_at timestamptz,

  created_at timestamptz default now()
);

create table if not exists public.hookup_wallet_transactions (

  id uuid primary key default gen_random_uuid(),

  sender_id uuid,

  receiver_id uuid,

  transaction_type text,

  amount numeric(12,2),

  currency text default 'USD',

  metadata jsonb default '{}',

  created_at timestamptz default now()
);

create table if not exists public.hookup_boosts (

  id uuid primary key default gen_random_uuid(),

  user_id uuid not null,

  boost_type text,

  starts_at timestamptz default now(),

  ends_at timestamptz
);

alter table public.hookup_profiles
add column if not exists latitude double precision;

alter table public.hookup_profiles
add column if not exists longitude double precision;

alter table public.hookup_profiles
add column if not exists trust_score integer default 50;

alter table public.hookup_profiles
add column if not exists premium_tier text default 'FREE';

alter table public.hookup_profiles
add column if not exists travel_mode boolean default false;

alter table public.hookup_profiles
add column if not exists travel_city text;

alter table public.hookup_profiles
add column if not exists last_active_at timestamptz default now();
