create table if not exists public.os_installed_apps (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null,

  app_id text not null,

  name text not null,

  route text not null,

  icon text,

  version text default '0.0.1',

  installed boolean default true,

  system boolean default false,

  description text,

  updated_at timestamptz default now(),

  created_at timestamptz default now()
);

create index if not exists idx_os_apps_user
on public.os_installed_apps(user_id);

alter table public.os_installed_apps
enable row level security;

create policy "users_manage_own_os_apps"
on public.os_installed_apps
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
