create table if not exists public.hookup_rooms (

  id uuid primary key default gen_random_uuid(),

  host_id uuid not null,

  room_type text check (room_type in ('VOICE','VIDEO','PRIVATE','GROUP')),

  title text,

  description text,

  is_private boolean default false,

  access_code text,

  max_participants integer default 50,

  current_participants integer default 0,

  status text default 'ACTIVE',

  created_at timestamptz default now()
);

create table if not exists public.hookup_room_participants (

  id uuid primary key default gen_random_uuid(),

  room_id uuid not null,

  user_id uuid not null,

  role text default 'LISTENER',

  joined_at timestamptz default now()
);

create index if not exists idx_hookup_rooms_host
on public.hookup_rooms(host_id);
