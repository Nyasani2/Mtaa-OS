create index if not exists idx_event_host
on public.hookup_events(host_id);

create index if not exists idx_event_participant
on public.hookup_event_participants(event_id, user_id);
