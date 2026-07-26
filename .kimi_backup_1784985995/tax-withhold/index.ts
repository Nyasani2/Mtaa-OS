import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WithholdPayload {
  transaction_id: string;
  transaction_type: string;
  taxpayer_id: string;
  base_amount: number;
  jurisdiction_code: string;
  currency?: string;
}

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

    const body: WithholdPayload = await req.json();
    const { transaction_id, transaction_type, taxpayer_id, base_amount, jurisdiction_code, currency } = body;

    // Validate jurisdiction
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

    const taxRate = jurisdiction.tax_rate;
    const useCurrency = currency || jurisdiction.currency;
    const amount = Math.round(base_amount * taxRate * 100) / 100;

    // Insert withholding record
    const { data: withholding, error: whError } = await supabaseClient
      .from('tax_withholdings')
      .insert({
        transaction_id,
        transaction_type,
        taxpayer_id,
        base_amount,
        amount,
        tax_rate: taxRate,
        currency: useCurrency,
        jurisdiction_code,
        authority_wallet_id: jurisdiction.authority_wallet_id,
        status: 'pending',
      })
      .select()
      .single();

    if (whError) throw whError;

    // Call RPC to deduct from wallet
    const { error: rpcError } = await supabaseClient.rpc('deduct_tax_from_wallet', {
      p_user_id: taxpayer_id,
      p_amount: amount,
      p_currency: useCurrency,
      p_reference_id: withholding.id,
      p_description: `${jurisdiction.authority_name} withholding tax on ${transaction_type}`,
    });

    if (rpcError) {
      // Rollback
      await supabaseClient.from('tax_withholdings').delete().eq('id', withholding.id);
      throw rpcError;
    }

    return new Response(JSON.stringify({
      success: true,
      withholding_id: withholding.id,
      amount,
      tax_rate: taxRate,
      currency: useCurrency,
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
