create table if not exists public.hookup_profile_media (

  id uuid primary key default gen_random_uuid(),

  user_id uuid not null,

  media_url text not null,

  media_type text not null,

  is_primary boolean default false,

  moderation_status text default 'PENDING',

  created_at timestamptz default now()
);

create table if not exists public.hookup_reports (

  id uuid primary key default gen_random_uuid(),

  reporter_id uuid not null,

  target_user_id uuid not null,

  reason text,

  details text,

  status text default 'OPEN',

  created_at timestamptz default now()
);

create table if not exists public.hookup_blocks (

  id uuid primary key default gen_random_uuid(),

  blocker_id uuid not null,

  blocked_id uuid not null,

  created_at timestamptz default now()
);

create table if not exists public.hookup_verifications (

  id uuid primary key default gen_random_uuid(),

  user_id uuid not null,

  verification_type text,

  verification_status text default 'PENDING',

  media_url text,

  reviewed_by uuid,

  reviewed_at timestamptz,

  created_at timestamptz default now()
);

create index if not exists idx_hookup_media_user
on public.hookup_profile_media(user_id);

create index if not exists idx_hookup_reports_target
on public.hookup_reports(target_user_id);
