create table if not exists public.hookup_marriage_proposals (

  id uuid primary key default gen_random_uuid(),

  proposer_id uuid not null,

  receiver_id uuid not null,

  status text default 'PENDING',

  created_at timestamptz default now(),

  accepted_at timestamptz
);

create table if not exists public.hookup_family_links (

  id uuid primary key default gen_random_uuid(),

  user_a uuid not null,

  user_b uuid not null,

  link_type text,

  created_at timestamptz default now()
);
