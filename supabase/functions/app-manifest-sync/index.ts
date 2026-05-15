import { createClient } from '@supabase/supabase-js';

(globalThis as any).Deno?.serve(async (req) => {
  const supabase = createClient(
    (globalThis as any).Deno?.env?.get('SUPABASE_URL')!,
    (globalThis as any).Deno?.env?.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const { method } = req;

  if (method === 'POST') {
    const body = await req.json();
    const { data, error } = await supabase.from('app_manifests').upsert({
      id: body.id,
      name: body.name,
      version: body.version,
      description: body.description,
      domain: body.domain,
      icon: body.icon,
      color: body.color,
      permissions: body.permissions,
      routes: body.routes,
      dependencies: body.dependencies,
      entry_point: body.entry_point,
      enabled: body.enabled ?? true,
      installable: body.installable ?? true,
      system_app: body.system_app ?? false,
      min_kernel_version: body.min_kernel_version,
      config_schema: body.config_schema,
    }, { onConflict: 'id' });

    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    return new Response(JSON.stringify({ success: true, data }), { status: 200 });
  }

  if (method === 'GET') {
    const { domain, enabled } = Object.fromEntries(new URL(req.url).searchParams);
    let query = supabase.from('app_manifests').select('*');
    if (domain) query = query.eq('domain', domain);
    if (enabled !== undefined) query = query.eq('enabled', enabled === 'true');
    const { data, error } = await query;
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    return new Response(JSON.stringify({ data }), { status: 200 });
  }

  return new Response('Method not allowed', { status: 405 });
});
