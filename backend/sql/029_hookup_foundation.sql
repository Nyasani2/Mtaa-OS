create table if not exists public.hookup_profiles (

  id uuid primary key default gen_random_uuid(),

  user_id uuid not null,

  display_name text,

  username text unique,

  bio text,

  age integer,

  gender text,

  country text,

  city text,

  languages text[] default '{}',

  religion text,

  relationship_goal text,

  relationship_structure text,

  verified boolean default false,

  created_at timestamptz default now()
);

create table if not exists public.hookup_swipes (

  id uuid primary key default gen_random_uuid(),

  swiper_id uuid,

  target_id uuid,

  direction text,

  created_at timestamptz default now()
);

create table if not exists public.hookup_matches (

  id uuid primary key default gen_random_uuid(),

  user_a uuid,

  user_b uuid,

  compatibility_score integer default 0,

  active boolean default true,

  matched_at timestamptz default now()
);

create table if not exists public.hookup_messages (

  id uuid primary key default gen_random_uuid(),

  conversation_id uuid,

  sender_id uuid,

  content text,

  message_type text default 'TEXT',

  created_at timestamptz default now()
);

create index if not exists idx_hookup_profiles_user
on public.hookup_profiles(user_id);

create index if not exists idx_hookup_matches_users
on public.hookup_matches(user_a, user_b);
