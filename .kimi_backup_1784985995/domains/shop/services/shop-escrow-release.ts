import { supabase } from '@/lib/supabase';

export async function shopEscrowRelease(orderId: string) {
  const { data: order, error: fetchError } = await supabase.from('shop_orders')
    .select('*')
    .eq('id', orderId)
    .single();

  if (fetchError) throw fetchError;
  if (order.status !== 'delivered') throw new Error('Order not delivered');

  const { data: escrow, error: escrowError } = await supabase.from('escrow_accounts')
    .select('*')
    .eq('order_id', orderId)
    .single();

  if (escrowError) throw escrowError;

  const { error: releaseError } = await supabase.from('wallet_transactions').insert({
    user_id: order.shop_id,
    amount: escrow.amount,
    type: 'escrow_release',
    status: 'completed',
    description: `Escrow release for order ${orderId}`
  });

  if (releaseError) throw releaseError;

  await supabase.from('escrow_accounts').update({ status: 'released' }).eq('id', escrow.id);

  return { success: true };
}
