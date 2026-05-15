create index if not exists idx_ecosystem_source
on public.hookup_ecosystem_events(source_app);

create index if not exists idx_ecosystem_event_type
on public.hookup_ecosystem_events(event_type);
