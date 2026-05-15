create table if not exists public.hookup_room_signals (

  id uuid primary key default gen_random_uuid(),

  room_id uuid not null,

  user_id uuid not null,

  type text not null,

  payload jsonb default '{}',

  created_at timestamptz default now()
);

create index if not exists idx_hookup_signals_room
on public.hookup_room_signals(room_id);
