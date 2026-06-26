import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { sender_profile_id, recipient_profile_id, amount, currency, message } = await req.json();

  // Validate sender has sufficient balance (wallet integration)
  const { data: wallet } = await supabase.from('wallets').select('balance').eq('profile_id', sender_profile_id).single();
  if (!wallet || wallet.balance < amount) {
    return new Response(JSON.stringify({ error: 'Insufficient balance' }), { status: 400 });
  }

  // Deduct from sender
  await supabase.rpc('wallet_deduct', { p_profile_id: sender_profile_id, p_amount: amount });
  // Add to recipient
  await supabase.rpc('wallet_credit', { p_profile_id: recipient_profile_id, p_amount: amount });
  // Log tip
  await supabase.from('profile_tips').insert({ sender_profile_id, recipient_profile_id, amount, currency, message });

  return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
});
