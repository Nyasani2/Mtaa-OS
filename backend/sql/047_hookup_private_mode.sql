create table if not exists public.hookup_private_rooms (

  id uuid primary key default gen_random_uuid(),

  user_a uuid not null,
  user_b uuid not null,

  encryption_key_hash text not null,

  is_active boolean default true,

  last_message_at timestamptz,

  created_at timestamptz default now()
);

create table if not exists public.hookup_private_messages (

  id uuid primary key default gen_random_uuid(),

  room_id uuid not null,

  sender_id uuid not null,

  encrypted_content text not null,

  message_type text default 'TEXT',
  -- TEXT | VOICE | IMAGE

  created_at timestamptz default now()
);

create index if not exists idx_private_room_users
on public.hookup_private_rooms(user_a, user_b);
