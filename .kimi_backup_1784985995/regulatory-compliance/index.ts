import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    if (action === 'check') {
      const body = await req.json();
      const { business_id, check_type, checklist } = body;

      const result = Object.values(checklist).every((v: any) => v === true)
        ? 'pass'
        : Object.values(checklist).some((v: any) => v === true)
        ? 'partial'
        : 'fail';

      const { data, error } = await supabaseClient
        .from('compliance_checks')
        .insert({
          business_id,
          check_type,
          checklist,
          result,
          checked_by: user.id,
          checked_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // Update regulatory_compliance status
      await supabaseClient
        .from('regulatory_compliance')
        .upsert({
          business_id,
          compliance_type: check_type,
          status: result === 'pass' ? 'compliant' : result === 'partial' ? 'under_review' : 'non_compliant',
          last_assessed: new Date().toISOString(),
          next_assessment: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'business_id,compliance_type' });

      return new Response(JSON.stringify({ success: true, data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'score') {
      const body = await req.json();
      const { business_id } = body;

      const { data: checks } = await supabaseClient
        .from('compliance_checks')
        .select('result')
        .eq('business_id', business_id);

      const total = checks?.length || 0;
      const passed = checks?.filter((c: any) => c.result === 'pass').length || 0;
      const score = total > 0 ? Math.round((passed / total) * 100) : 0;

      return new Response(JSON.stringify({ score, total, passed }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'flag') {
      const body = await req.json();
      const { entity_type, entity_id, flag_type, reason, severity } = body;

      const { data, error } = await supabaseClient
        .from('regulatory_flags')
        .insert({
          entity_type,
          entity_id,
          flag_type,
          reason,
          severity,
          status: 'open',
          created_by: user.id,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      return new Response(JSON.stringify({ success: true, data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
