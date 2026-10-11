import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';



serve(async (req) => {
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  
  // FIXED: Add authentication check
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  const { data: { user } } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
  if (!user) return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401 });

  const { subscriber_profile_id, creator_profile_id, tier, price, interval } = await req.json();

  const platformFee = price * 0.10;
  const creatorPayout = price * 0.90;

  // FIXED: Use correct RPC names and params
  const { error: debitErr } = await supabase.rpc('mtaa_wallet_debit', { 
    p_user_id: subscriber_profile_id, 
    p_amount: price, 
    p_currency: 'KES',
    p_description: 'Subscription payment', 
    p_transaction_type: 'subscription' 
  });
  
  if (debitErr) return new Response(JSON.stringify({ error: debitErr.message }), { status: 400 });

  // Credit creator
  await supabase.rpc('mtaa_wallet_credit', { 
    p_user_id: creator_profile_id, 
    p_amount: creatorPayout, 
    p_currency: 'KES',
    p_description: 'Subscription earnings', 
    p_transaction_type: 'subscription_earning' 
  });

  // FIXED: Credit MTAA Treasury with the 10% platform fee
  await supabase.rpc('mtaa_wallet_credit', { 
    p_user_id: TREASURY_USER_ID, 
    p_amount: platformFee, 
    p_currency: 'KES',
    p_description: 'Platform fee for subscription', 
    p_transaction_type: 'platform_revenue' 
  });

  await supabase.from('profile_subscriptions').upsert({
    subscriber_profile_id, creator_profile_id, tier, price, interval,
    status: 'active', expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  }, { onConflict: 'subscriber_profile_id,creator_profile_id' });

  return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
});
