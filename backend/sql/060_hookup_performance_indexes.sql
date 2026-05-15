-- PERFORMANCE INDEXES FOR SCALE

create index if not exists idx_presence_last_seen
on public.hookup_live_presence(last_seen);

create index if not exists idx_events_time
on public.hookup_events(start_time);

create index if not exists idx_match_score
on public.hookup_match_scores(final_score);
