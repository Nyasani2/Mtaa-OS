create table if not exists public.hookup_moderators (

  id uuid primary key default gen_random_uuid(),

  user_id uuid not null,

  role text default 'MODERATOR',
  -- MODERATOR | SUPER_MOD | AI_MOD

  region text,

  trust_level integer default 50,

  assigned_at timestamptz default now()
);

create table if not exists public.hookup_reports (

  id uuid primary key default gen_random_uuid(),

  reporter_id uuid not null,

  target_user_id uuid,

  room_id uuid,

  report_type text,
  -- SCAM | HARASSMENT | FAKE_ID | INAPPROPRIATE | FRAUD

  severity integer default 0,

  status text default 'OPEN',
  -- OPEN | REVIEWED | ACTIONED | DISMISSED

  created_at timestamptz default now()
);

create table if not exists public.hookup_moderation_actions (

  id uuid primary key default gen_random_uuid(),

  moderator_id uuid,

  target_user_id uuid,

  action text,
  -- WARN | MUTE | BAN | LIMIT | SHADOWBAN

  reason text,

  created_at timestamptz default now()
);
