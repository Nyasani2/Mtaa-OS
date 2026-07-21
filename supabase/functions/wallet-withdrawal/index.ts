import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  try {
    const { user_id, amount, phone_number, till_number } = await req.json();

    // Validation
    if (!user_id || !amount || amount <= 0) {
      return new Response(JSON.stringify({ success: false, error: 'user_id and amount required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (amount > 150000) {
      return new Response(JSON.stringify({ success: false, error: 'Maximum withdrawal is KES 150,000' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get user's wallet
    const { data: wallet, error: walletError } = await supabase
      .from('wallet_accounts')
      .select('id, balance, available_balance, currency')
      .eq('user_id', user_id)
      .eq('currency', 'KES')
      .eq('is_default', true)
      .single();

    if (walletError || !wallet) {
      return new Response(JSON.stringify({ success: false, error: 'Wallet not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (Number(wallet.available_balance) < amount) {
      return new Response(JSON.stringify({
        success: false,
        error: `Insufficient balance. Available: KES ${wallet.available_balance}`,
      }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Calculate fee (1% platform fee, min KES 10, max KES 500)
    const fee = Math.min(Math.max(Math.round(amount * 0.01), 10), 500);
    const netAmount = amount - fee;

    // Create withdrawal record
    const { data: withdrawal, error: withdrawalError } = await supabase
      .from('wallet_withdrawals')
      .insert({
        user_id,
        wallet_id: wallet.id,
        amount,
        fee,
        net_amount: netAmount,
        currency: 'KES',
        status: 'pending',
        phone_number: phone_number || null,
        till_number: till_number || null,
        description: `Withdrawal to M-Pesa`,
      })
      .select()
      .single();

    if (withdrawalError) {
      throw new Error(`Failed to create withdrawal: ${withdrawalError.message}`);
    }

    // Hold funds in wallet
    const { error: holdError } = await supabase.rpc('hold_wallet_funds', {
      p_wallet_id: wallet.id,
      p_amount: amount,
      p_reference_type: 'withdrawal',
      p_reference_id: withdrawal.id,
    });

    if (holdError) {
      // Rollback withdrawal record
      await supabase.from('wallet_withdrawals').update({ status: 'failed' }).eq('id', withdrawal.id);
      throw new Error(`Failed to hold funds: ${holdError.message}`);
    }

    // Initiate B2C transfer (send money to user's phone)
    // This would call Safaricom B2C API - placeholder for now
    const b2cResult = await initiateB2C(supabase, phone_number, netAmount, withdrawal.id);

    if (b2cResult.success) {
      // Complete withdrawal
      await supabase.rpc('debit_wallet', {
        p_wallet_id: wallet.id,
        p_amount: amount,
        p_description: `Withdrawal to ${phone_number}`,
        p_reference_type: 'withdrawal',
        p_reference_id: withdrawal.id,
      });

      await supabase.from('wallet_withdrawals')
        .update({ status: 'completed', completed_at: new Date().toISOString(), mpesa_receipt: b2cResult.receipt })
        .eq('id', withdrawal.id);

      // Notify user
      await supabase.from('notifications').insert({
        user_id,
        type: 'wallet_withdrawal',
        title: 'Withdrawal Completed',
        body: `KES ${netAmount.toLocaleString()} sent to ${phone_number}. Fee: KES ${fee}`,
        data: { withdrawal_id: withdrawal.id, amount, net_amount: netAmount, fee },
      });
    } else {
      // Release hold
      await supabase.rpc('release_wallet_hold', {
        p_wallet_id: wallet.id,
        p_amount: amount,
        p_reference_type: 'withdrawal',
        p_reference_id: withdrawal.id,
      });

      await supabase.from('wallet_withdrawals')
        .update({ status: 'failed', failure_reason: b2cResult.error })
        .eq('id', withdrawal.id);
    }

    return new Response(JSON.stringify({
      success: b2cResult.success,
      withdrawal_id: withdrawal.id,
      status: b2cResult.success ? 'completed' : 'failed',
      amount,
      fee,
      net_amount: netAmount,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('[Withdrawal] Error:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// Placeholder for B2C initiation - replace with actual Safaricom B2C API call
async function initiateB2C(supabase: any, phone: string, amount: number, withdrawalId: string): Promise<{ success: boolean; receipt?: string; error?: string }> {
  // TODO: Implement actual Safaricom B2C API call
  // This would use Daraja B2C API to send money from MTAA's bulk payment account to user's phone
  return { success: true, receipt: `B2C-${Date.now()}` };
}
