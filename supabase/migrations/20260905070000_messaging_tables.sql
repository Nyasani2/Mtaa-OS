create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  title text,
  is_group boolean default false,
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);
create table if not exists public.conversation_participants (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.conversations(id) on delete cascade,
  user_id uuid references auth.users(id),
  last_read_at timestamptz default now(),
  unique(conversation_id, user_id)
);
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.conversations(id) on delete cascade,
  sender_id uuid references auth.users(id),
  body text not null,
  created_at timestamptz default now()
);

alter table public.conversations enable row level security;
alter table public.conversation_participants enable row level security;
alter table public.chat_messages enable row level security;

drop policy if exists conv_sel on public.conversations;
create policy conv_sel on public.conversations for select to authenticated
  using (exists (select 1 from public.conversation_participants cp where cp.conversation_id = id and cp.user_id = auth.uid()));
drop policy if exists conv_ins on public.conversations;
create policy conv_ins on public.conversations for insert to authenticated with check (auth.uid() = created_by);

drop policy if exists cp_sel on public.conversation_participants;
create policy cp_sel on public.conversation_participants for select to authenticated using (true);
drop policy if exists cp_ins on public.conversation_participants;
create policy cp_ins on public.conversation_participants for insert to authenticated with check (true);
drop policy if exists cp_upd on public.conversation_participants;
create policy cp_upd on public.conversation_participants for update to authenticated using (auth.uid() = user_id);

drop policy if exists cm_sel on public.chat_messages;
create policy cm_sel on public.chat_messages for select to authenticated
  using (exists (select 1 from public.conversation_participants cp where cp.conversation_id = chat_messages.conversation_id and cp.user_id = auth.uid()));
drop policy if exists cm_ins on public.chat_messages;
create policy cm_ins on public.chat_messages for insert to authenticated with check (auth.uid() = sender_id);

-- realtime for chat
do $$ begin
  alter publication supabase_realtime add table public.chat_messages;
exception when others then null; end $$;
