import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '')

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return new Response(JSON.stringify({ error: 'No authorization header', code: 'UNAUTHORIZED' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) return new Response(JSON.stringify({ error: 'Invalid token', code: 'UNAUTHORIZED' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    
    const user_id = user.id
    const { country_code = 'KE', phone_number } = await req.json()

    const { data: countryConfig } = await supabaseAdmin.from('country_configs').select('*').eq('country_code', country_code).single()
    const currency = countryConfig?.currency_code ?? 'KES'

    const { data: wallet, error: walletError } = await supabaseAdmin.from("wallet_accounts").insert({ user_id, wallet_type: 'main', country_code, currency_code: currency, available_balance: 0, pending_balance: 0 }).select().single()
    if (walletError) throw walletError

    await supabaseAdmin.from("wallet_accounts").insert({ user_id, wallet_type: 'escrow', country_code, currency_code: currency, available_balance: 0, pending_balance: 0 })
    await supabaseAdmin.from("wallet_accounts").insert({ user_id, wallet_type: 'savings', country_code, currency_code: currency, available_balance: 0, pending_balance: 0 })
    await supabaseAdmin.from("wallet_accounts").insert({ user_id, wallet_type: 'rewards', country_code, currency_code: currency, available_balance: 0, pending_balance: 0 })

    await supabaseAdmin.from('wallet_onboarding').update({ wallet_created: true, wallet_created_at: new Date().toISOString(), current_step: 'complete', onboarding_complete: true, completed_at: new Date().toISOString() }).eq('user_id', user_id)
    await supabaseAdmin.from('wallet_credit_scores').insert({ user_id, wallet_id: wallet.id, credit_score: 0, risk_score: 0, eligibility_score: 0 })
    await supabaseAdmin.from('wallet_notifications').insert({ user_id, wallet_id: wallet.id, notification_type: 'system', title: 'Welcome to MTAA Wallet!', message: `Your ${currency} wallet is ready. Start sending and receiving money securely.`, priority: 'high' })

    return new Response(JSON.stringify({ success: true, wallet_id: wallet.id, message: 'Wallet created successfully' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
