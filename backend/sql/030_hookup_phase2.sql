create table if not exists public.hookup_conversations (

  id uuid primary key default gen_random_uuid(),

  participant_a uuid,

  participant_b uuid,

  created_at timestamptz default now()
);

create index if not exists idx_hookup_conversations
on public.hookup_conversations(
  participant_a,
  participant_b
);
