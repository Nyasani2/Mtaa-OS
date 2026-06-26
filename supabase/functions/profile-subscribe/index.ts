import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { subscriber_profile_id, creator_profile_id, tier, price, interval } = await req.json();

  // Deduct subscription fee
  const { data: wallet } = await supabase.from('wallets').select('balance').eq('profile_id', subscriber_profile_id).single();
  if (!wallet || wallet.balance < price) {
    return new Response(JSON.stringify({ error: 'Insufficient balance' }), { status: 400 });
  }

  await supabase.rpc('wallet_deduct', { p_profile_id: subscriber_profile_id, p_amount: price });
  await supabase.rpc('wallet_credit', { p_profile_id: creator_profile_id, p_amount: price * 0.9 }); // 10% platform fee

  await supabase.from('profile_subscriptions').upsert({
    subscriber_profile_id, creator_profile_id, tier, price, interval,
    status: 'active', expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  }, { onConflict: 'subscriber_profile_id,creator_profile_id' });

  return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
});
