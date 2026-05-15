create table if not exists public.hookup_tokens (

  id uuid primary key default gen_random_uuid(),

  user_id uuid not null,

  balance numeric default 0,

  updated_at timestamptz default now()
);

create table if not exists public.hookup_boost_purchases (

  id uuid primary key default gen_random_uuid(),

  user_id uuid not null,

  boost_type text,
  -- BOOST_PROFILE | BOOST_MATCH | BOOST_ROOM

  duration_minutes integer default 60,

  cost numeric default 0,

  created_at timestamptz default now()
);

create table if not exists public.hookup_ads_impressions (

  id uuid primary key default gen_random_uuid(),

  user_id uuid,

  ad_type text,

  revenue numeric default 0,

  created_at timestamptz default now()
);
