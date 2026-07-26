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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const { jurisdiction_code } = await req.json();

    // Get jurisdiction config
    const { data: jurisdiction } = await supabaseClient
      .from('jurisdiction_configs')
      .select('*')
      .eq('code', jurisdiction_code)
      .single();

    if (!jurisdiction) {
      return new Response(JSON.stringify({ error: 'Invalid jurisdiction' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get all pending withholdings for this jurisdiction
    const { data: pending, error: fetchError } = await supabaseClient
      .from('tax_withholdings')
      .select('*')
      .eq('jurisdiction_code', jurisdiction_code)
      .eq('status', 'pending');

    if (fetchError) throw fetchError;
    if (!pending || pending.length === 0) {
      return new Response(JSON.stringify({ remitted: 0, total: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Group by currency
    const byCurrency: Record<string, { total: number; ids: string[] }> = {};
    for (const w of pending) {
      if (!byCurrency[w.currency]) byCurrency[w.currency] = { total: 0, ids: [] };
      byCurrency[w.currency].total += w.amount;
      byCurrency[w.currency].ids.push(w.id);
    }

    // Transfer each currency batch
    for (const [curr, batch] of Object.entries(byCurrency)) {
      const { error: rpcError } = await supabaseClient.rpc('transfer_to_authority_wallet', {
        p_authority_wallet_id: jurisdiction.authority_wallet_id,
        p_amount: batch.total,
        p_currency: curr,
        p_description: `Tax remittance ${jurisdiction_code} — ${batch.ids.length} transactions`,
      });

      if (rpcError) throw rpcError;

      // Mark as remitted
      await supabaseClient
        .from('tax_withholdings')
        .update({ status: 'remitted', remitted_at: new Date().toISOString() })
        .in('id', batch.ids);
    }

    return new Response(JSON.stringify({
      remitted: pending.length,
      total: pending.reduce((s, w) => s + w.amount, 0),
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
