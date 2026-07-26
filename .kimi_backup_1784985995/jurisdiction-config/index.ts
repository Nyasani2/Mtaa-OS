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

    if (action === 'list') {
      const { data, error } = await supabaseClient
        .from('jurisdiction_configs')
        .select('*')
        .eq('active', true)
        .order('name');

      if (error) throw error;

      return new Response(JSON.stringify({ jurisdictions: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'get') {
      const code = url.searchParams.get('code');
      const { data, error } = await supabaseClient
        .from('jurisdiction_configs')
        .select('*')
        .eq('code', code)
        .single();

      if (error) throw error;

      return new Response(JSON.stringify({ jurisdiction: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'calculate') {
      const body = await req.json();
      const { jurisdiction_code, annual_income } = body;

      const { data: jurisdiction } = await supabaseClient
        .from('jurisdiction_configs')
        .select('income_tax_brackets')
        .eq('code', jurisdiction_code)
        .single();

      if (!jurisdiction) {
        return new Response(JSON.stringify({ error: 'Jurisdiction not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const brackets = jurisdiction.income_tax_brackets || [];
      let tax = 0;
      for (const bracket of brackets) {
        if (annual_income > bracket.min) {
          const taxable = Math.min(annual_income, bracket.max) - bracket.min;
          tax += taxable * bracket.rate;
        }
      }

      return new Response(JSON.stringify({ tax: Math.round(tax * 100) / 100 }), {
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
