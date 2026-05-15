create index if not exists idx_fraud_user
on public.hookup_fraud_scores(user_id);

create index if not exists idx_graph_interaction_type
on public.hookup_interaction_graph(interaction_type);
