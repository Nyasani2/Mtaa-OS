create index if not exists idx_presence_location
on public.hookup_live_presence(latitude, longitude);

create index if not exists idx_heat_grid
on public.hookup_activity_heatmap(grid_lat, grid_lng);
