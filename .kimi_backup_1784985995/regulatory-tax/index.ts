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

    if (action === 'calculate') {
      const body = await req.json();
      const { taxpayer_id, tax_type, declared_income, deductions = 0 } = body;

      // Simple tax calculation - can be replaced with complex rules
      const taxRate = tax_type === 'income' ? 0.3 : tax_type === 'vat' ? 0.16 : 0.1;
      const assessedTax = Math.max(0, (declared_income - deductions) * taxRate);

      const { data, error } = await supabaseClient
        .from('tax_records')
        .insert({
          taxpayer_id,
          tax_type,
          tax_year: new Date().getFullYear(),
          declared_income,
          assessed_tax: assessedTax,
          paid_amount: 0,
          balance: assessedTax,
          status: 'assessed',
          filed_at: new Date().toISOString(),
          assessed_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // Create liability
      await supabaseClient
        .from('tax_liabilities')
        .insert({
          taxpayer_id,
          tax_type,
          amount: assessedTax,
          currency: 'KES',
          period: `${new Date().getFullYear()}-Q${Math.ceil((new Date().getMonth() + 1) / 3)}`,
          due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'active',
        });

      return new Response(JSON.stringify({ success: true, data, assessedTax }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'reconcile') {
      const body = await req.json();
      const { taxpayer_id } = body;

      const { data: records } = await supabaseClient
        .from('tax_records')
        .select('*')
        .eq('taxpayer_id', taxpayer_id);

      const { data: payments } = await supabaseClient
        .from('regulatory_tax_payments')
        .select('*')
        .eq('taxpayer_id', taxpayer_id);

      const totalAssessed = records?.reduce((sum: number, r: any) => sum + (r.assessed_tax || 0), 0) || 0;
      const totalPaid = payments?.reduce((sum: number, p: any) => sum + (p.amount || 0), 0) || 0;
      const balance = totalAssessed - totalPaid;

      return new Response(JSON.stringify({
        taxpayer_id,
        totalAssessed,
        totalPaid,
        balance,
        status: balance <= 0 ? 'paid' : balance > 0 && balance < totalAssessed ? 'partial' : 'pending',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'generate_statement') {
      const body = await req.json();
      const { taxpayer_id, period } = body;

      const { data: records } = await supabaseClient
        .from('tax_records')
        .select('*')
        .eq('taxpayer_id', taxpayer_id)
        .eq('tax_year', parseInt(period.split('-')[0]));

      const { data: payments } = await supabaseClient
        .from('regulatory_tax_payments')
        .select('*')
        .eq('taxpayer_id', taxpayer_id)
        .ilike('period', `${period.split('-')[0]}%`);

      const statement = {
        taxpayer_id,
        period,
        records: records || [],
        payments: payments || [],
        generated_at: new Date().toISOString(),
      };

      await supabaseClient
        .from('tax_statements')
        .insert({
          taxpayer_id,
          period,
          data: statement,
          created_at: new Date().toISOString(),
        });

      return new Response(JSON.stringify({ success: true, statement }), {
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
