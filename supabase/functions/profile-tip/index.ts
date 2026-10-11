import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  
  // FIXED: Add authentication check
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  const { data: { user } } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
  if (!user) return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401 });

  const { sender_profile_id, recipient_profile_id, amount, currency, message } = await req.json();

  // FIXED: Use correct RPC names (mtaa_wallet_debit/credit) and correct params (p_user_id)
  const { error: debitErr } = await supabase.rpc('mtaa_wallet_debit', { 
    p_user_id: sender_profile_id, 
    p_amount: amount, 
    p_currency: currency || 'KES',
    p_description: 'Tip sent', 
    p_transaction_type: 'tip' 
  });
  
  if (debitErr) return new Response(JSON.stringify({ error: debitErr.message }), { status: 400 });

  const { error: creditErr } = await supabase.rpc('mtaa_wallet_credit', { 
    p_user_id: recipient_profile_id, 
    p_amount: amount, 
    p_currency: currency || 'KES',
    p_description: 'Tip received', 
    p_transaction_type: 'tip' 
  });

  if (creditErr) return new Response(JSON.stringify({ error: creditErr.message }), { status: 400 });

  // Log tip
  await supabase.from('profile_tips').insert({ sender_profile_id, recipient_profile_id, amount, currency, message });

  return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
});
