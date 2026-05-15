create table if not exists public.hookup_live_rooms (

  id uuid primary key default gen_random_uuid(),

  host_id uuid not null,

  room_type text not null,
  -- VOICE | VIDEO

  is_private boolean default false,

  max_participants integer default 10,

  current_participants integer default 0,

  status text default 'ACTIVE',
  -- ACTIVE | ENDED | LOCKED

  created_at timestamptz default now()
);

create table if not exists public.hookup_live_participants (

  id uuid primary key default gen_random_uuid(),

  room_id uuid not null,

  user_id uuid not null,

  role text default 'LISTENER',
  -- HOST | SPEAKER | LISTENER

  joined_at timestamptz default now()
);

create index if not exists idx_live_rooms_host
on public.hookup_live_rooms(host_id);
