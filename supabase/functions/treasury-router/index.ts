// ============================================================================
// MTAA Creator Earnings → Treasury Router
// Edge Function: routes creator earnings to Treasury when they become available
// Triggered by: Supabase DB trigger on creator_earnings.status change
// ============================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, serviceRoleKey);

interface CreatorEarning {
  id: string;
  profile_id: string;
  user_id: string;
  source_type: string;
  source_module: string;
  gross_amount: number;
  platform_fee: number;
  tax_withheld: number;
  processing_fee: number;
  net_amount: number;
  currency: string;
  description: string | null;
  metadata: Record<string, any>;
}

interface TreasuryAccount {
  id: string;
  account_code: string;
  account_name: string;
  current_balance: number;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  try {
    const { earning, event } = await req.json();

    if (event !== 'earning.available') {
      return new Response(JSON.stringify({ message: 'Event ignored' }), { status: 200 });
    }

    const e: CreatorEarning = earning;

    // 1. Get or create Treasury account for creator payouts
    const { data: account, error: accountError } = await supabase
      .from('treasury_accounts')
      .select('id, current_balance')
      .eq('account_code', 'CREATOR_PAYOUTS')
      .eq('fiscal_year', new Date().getFullYear())
      .single();

    if (accountError || !account) {
      // Create account if not exists
      const { data: newAccount, error: createError } = await supabase
        .from('treasury_accounts')
        .insert({
          account_code: 'CREATOR_PAYOUTS',
          account_name: 'Creator Payouts Account',
          account_type: 'development',
          fiscal_year: new Date().getFullYear(),
          opening_balance: 0,
          current_balance: 0,
          budget_approved: 100000000,
          currency: 'KES',
        })
        .select()
        .single();

      if (createError) throw createError;
      // Use newAccount
    }

    const treasuryAccountId = account?.id;

    // 2. Get creator profile details
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name, username')
      .eq('id', e.profile_id)
      .single();

    // 3. Get creator wallet
    const { data: wallet } = await supabase
      .from('wallets')
      .select('id, wallet_address')
      .eq('user_id', e.user_id)
      .single();

    // 4. Create Treasury expenditure record
    const { data: expenditure, error: expError } = await supabase
      .from('treasury_expenditures')
      .insert({
        country_code: 'KE',
        voucher_number: `MTAA-CR-${e.id.slice(0, 8)}`,
        account_id: treasuryAccountId,
        payee_name: profile?.display_name || profile?.username || 'Creator',
        payee_type: 'creator',
        payee_account: wallet?.wallet_address || null,
        description: `Creator earning: ${e.source_type} from ${e.source_module}`,
        gross_amount: e.gross_amount,
        net_amount: e.net_amount,
        payment_method: 'wallet',
        payment_status: 'pending',
        metadata: {
          creator_earning_id: e.id,
          source_type: e.source_type,
          source_module: e.source_module,
          profile_id: e.profile_id,
          platform_fee: e.platform_fee,
          tax_withheld: e.tax_withheld,
        },
      })
      .select()
      .single();

    if (expError) throw expError;

    // 5. Update creator_earnings with treasury link
    await supabase
      .from('creator_earnings')
      .update({
        treasury_account_id: treasuryAccountId,
        treasury_voucher_id: expenditure.id,
        routed_to_treasury: true,
        routed_at: new Date().toISOString(),
      })
      .eq('id', e.id);

    // 6. Update Treasury account balance
    if (treasuryAccountId) {
      await supabase.rpc('update_treasury_balance', {
        p_account_id: treasuryAccountId,
        p_amount: e.net_amount,
      });
    }

    // 7. Log to platform revenue account
    const { data: platformAccount } = await supabase
      .from('treasury_accounts')
      .select('id')
      .eq('account_code', 'PLATFORM_REVENUE')
      .eq('fiscal_year', new Date().getFullYear())
      .single();

    if (platformAccount) {
      await supabase.from('treasury_expenditures').insert({
        country_code: 'KE',
        voucher_number: `MTAA-PF-${e.id.slice(0, 8)}`,
        account_id: platformAccount.id,
        payee_name: 'MTAA Platform',
        payee_type: 'platform',
        description: `Platform fee from ${e.source_module}: ${e.source_type}`,
        gross_amount: e.platform_fee,
        net_amount: e.platform_fee,
        payment_method: 'internal',
        payment_status: 'completed',
        metadata: {
          creator_earning_id: e.id,
          fee_type: 'platform_fee',
          source_module: e.source_module,
        },
      });
    }

    // 8. Send notification to creator
    await supabase.from('notifications').insert({
      user_id: e.user_id,
      type: 'earning_available',
      title: 'Earnings Available',
      body: `KES ${e.net_amount.toFixed(2)} from ${e.source_module} is now available for withdrawal`,
      data: {
        earning_id: e.id,
        amount: e.net_amount,
        source_module: e.source_module,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        earning_id: e.id,
        treasury_expenditure_id: expenditure.id,
        message: 'Earning routed to Treasury successfully',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Treasury router error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
