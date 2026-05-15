create table if not exists public.hookup_ecosystem_events (

  id uuid primary key default gen_random_uuid(),

  user_id uuid not null,

  source_app text,
  -- HOOKUP | MTAxi | MTRUCK | WALLET

  event_type text,
  -- MATCH | RIDE | DELIVERY | PAYMENT | MEETUP

  linked_entity_id uuid,

  amount numeric,

  metadata jsonb default '{}',

  created_at timestamptz default now()
);

create index if not exists idx_ecosystem_user
on public.hookup_ecosystem_events(user_id);
