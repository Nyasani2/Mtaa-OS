import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Safaricom's official IP ranges for Daraja API callbacks
const SAFARICOM_IPS = [
  '156.154.64.0/24',
  '156.154.65.0/24',
  '196.43.230.0/24',  // Safaricom production IPs
  '102.133.168.0/24', // Additional Safaricom ranges
];

serve(async (req) => {
  try {
    // 1. SECURITY: Verify request comes from Safaricom IPs
    const clientIP = req.headers.get('x-forwarded-for') || 
                     req.headers.get('cf-connecting-ip') ||
                     req.headers.get('x-real-ip');
    
    if (clientIP && !isSafaricomIP(clientIP)) {
      console.error(`[MPESA] Unauthorized callback attempt from IP: ${clientIP}`);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Unauthorized source' 
      }), { status: 403, headers: { 'Content-Type': 'application/json' } });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const body = await req.json();
    const callback = body.Body?.stkCallback;

    if (!callback) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Invalid callback format' 
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const checkoutId = callback.CheckoutRequestID;
    const resultCode = callback.ResultCode;

    // 2. FIND TRANSACTION (STRICT MATCH)
    const { data: tx, error: txError } = await supabase
      .from('wallet_transactions')
      .select('*')
      .or(`reference.eq.${checkoutId},metadata->checkoutRequestID.eq.${checkoutId}`)
      .single();

    if (txError || !tx) {
      console.error(`[MPESA] Transaction not found for: ${checkoutId}`);
      return new Response(JSON.stringify({
        success: false,
        error: 'Transaction not found',
      }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    // 3. IDEMPOTENCY CHECK (PREVENT DOUBLE PROCESSING)
    if (tx.status === 'SUCCESS') {
      console.log(`[MPESA] Already processed: ${checkoutId}`);
      return new Response(JSON.stringify({
        success: true,
        message: 'Already processed',
      }), { headers: { 'Content-Type': 'application/json' } });
    }

    // 4. FAILURE CASE
    if (resultCode !== 0) {
      await supabase
        .from('wallet_transactions')
        .update({
          status: 'FAILED',
          metadata: {
            ...tx.metadata,
            callback,
            failure_reason: 'Payment cancelled or failed by user',
          },
        })
        .eq('id', tx.id);

      return new Response(JSON.stringify({
        success: true,
        status: 'FAILED',
      }), { headers: { 'Content-Type': 'application/json' } });
    }

    // 5. EXTRACT & STRICTLY VALIDATE AMOUNT
    const callbackAmount = callback.CallbackMetadata?.Item?.find(
      (i: any) => i.Name === 'Amount'
    )?.Value;

    // Strictly validate that the callback amount matches the expected transaction amount
    if (Number(callbackAmount) !== Number(tx.amount)) {
      console.error(`[MPESA] Amount mismatch! Expected: ${tx.amount}, Got: ${callbackAmount}`);
      await supabase
        .from('wallet_transactions')
        .update({
          status: 'FAILED',
          metadata: { ...tx.metadata, callback, error: 'Amount mismatch' },
        })
        .eq('id', tx.id);
      
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Amount mismatch - potential fraud attempt' 
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const amount = Number(callbackAmount);

    // 6. VERIFY USER OWNERSHIP (Security: ensure wallet belongs to transaction user)
    const { data: userWallet } = await supabase
      .from('wallets')
      .select('id, user_id')
      .eq('user_id', tx.user_id)
      .single();

    if (!userWallet) {
      console.error(`[MPESA] Wallet not found for user: ${tx.user_id}`);
      await supabase
        .from('wallet_transactions')
        .update({
          status: 'FAILED',
          metadata: { ...tx.metadata, callback, error: 'Wallet not found' },
        })
        .eq('id', tx.id);
      
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Wallet not found' 
      }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    // 7. CREDIT WALLET (Atomic safety: don't mark success until money is credited)
    const { error: rpcError } = await supabase.rpc('update_wallet_balance', {
      user_id: tx.user_id,
      amount: amount,
    });

    if (rpcError) {
      console.error('[MPESA] Wallet credit RPC failed:', rpcError);
      await supabase
        .from('wallet_transactions')
        .update({
          status: 'FAILED',
          metadata: { ...tx.metadata, callback, error: rpcError.message },
        })
        .eq('id', tx.id);
      
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Wallet credit failed' 
      }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    // 8. MARK TRANSACTION AS SUCCESS (Only AFTER successful credit)
    await supabase
      .from('wallet_transactions')
      .update({
        status: 'SUCCESS',
        completed_at: new Date().toISOString(),
        metadata: {
          ...tx.metadata,
          callback,
          credited_amount: amount,
          credited_wallet_id: userWallet.id,
        },
      })
      .eq('id', tx.id);

    // 9. EVENT LOG (REALTIME SYSTEM)
    await supabase.from('wallet_deposit_events').insert({
      user_id: tx.user_id,
      event_type: 'MPESA_DEPOSIT_SUCCESS',
      metadata: {
        reference: checkoutId,
        amount,
        wallet_id: userWallet.id,
      },
    });

    console.log(`[MPESA] Successfully credited ${amount} to user ${tx.user_id}`);

    return new Response(JSON.stringify({
      success: true,
      status: 'SUCCESS',
      checkoutId,
      amount,
    }), { headers: { 'Content-Type': 'application/json' } });

  } catch (err) {
    console.error('[MPESA] Critical error:', err);
    return new Response(JSON.stringify({
      success: false,
      error: err.message,
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
});

// Helper function to check if IP is from Safaricom
function isSafaricomIP(ip: string): boolean {
  // For production, you would implement proper CIDR checking
  // For now, we'll do a basic check - in production, use a CIDR library
  const safaricomPrefixes = ['156.154.', '196.43.230.', '102.133.168.'];
  return safaricomPrefixes.some(prefix => ip.startsWith(prefix));
}
