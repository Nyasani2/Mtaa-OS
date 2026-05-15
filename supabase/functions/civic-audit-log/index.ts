import { createClient } from '@supabase/supabase-js';

(globalThis as any).Deno?.serve(async (req) => {
  const supabase = createClient(
    (globalThis as any).Deno?.env?.get('SUPABASE_URL')!,
    (globalThis as any).Deno?.env?.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const body = await req.json().catch(() => ({}));

  const { data, error } = await supabase.from('civic_audit_log').insert({
    id: body.id,
    module: body.module,
    action: body.action,
    actor_id: body.actor_id,
    actor_role: body.actor_role,
    resource_id: body.resource_id,
    resource_type: body.resource_type,
    before_state: body.before_state,
    after_state: body.after_state,
    delta: body.delta,
    timestamp: body.timestamp,
    ip_address: body.ip_address,
    user_agent: body.user_agent,
    immutable_hash: body.immutable_hash,
  });

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  return new Response(JSON.stringify({ success: true, auditId: body.id }), { status: 200 });
});
