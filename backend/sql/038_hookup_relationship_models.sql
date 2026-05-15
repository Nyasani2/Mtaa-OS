create table if not exists public.hookup_relationship_models (

  id uuid primary key default gen_random_uuid(),

  user_id uuid not null,

  model_type text not null,
  -- MONOGAMY | POLYGAMY | POLYAMORY | OPEN | CUSTOM

  is_religious boolean default false,

  religion text,

  cultural_context text,

  openness_level integer default 50,
  -- 0 = strict monogamy, 100 = fully open

  marriage_intent boolean default false,

  family_integration_ready boolean default false,

  created_at timestamptz default now()
);

create index if not exists idx_hookup_relationship_user
on public.hookup_relationship_models(user_id);
