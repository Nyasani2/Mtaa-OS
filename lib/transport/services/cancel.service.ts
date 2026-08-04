import { supabase } from '@/lib/supabase';

export async function cancelRide(rideId: string, cancelledBy: string, reason?: string) {
  const { data, error } = await supabase.rpc('release_ride_hold', {
    ride_id: rideId,
    p_cancelled_by: cancelledBy,
    p_reason: reason || 'Cancelled by user',
  });
  if (error) throw error;
  return data;
}

export async function cancelRideDirect(rideId: string, cancelledBy: string, reason?: string) {
  // Fallback if RPC not available — direct update
  const { data: ride, error: fetchErr } = await supabase
    .from('mtaxi_rides')
    .select('*')
    .eq('id', rideId)
    .single();
  if (fetchErr) throw fetchErr;

  if (ride.status === 'completed') throw new Error('Cannot cancel completed ride');
  if (ride.status === 'cancelled') throw new Error('Ride already cancelled');

  // If fare was held, release it
  if (ride.fare_held) {
    const { data: wallet } = await supabase
      .from('wallet_accounts')
      .select('id, hold_balance')
      .eq('user_id', ride.passenger_id)
      .eq('currency', 'KES')
      .order('is_default', { ascending: false })
      .limit(1)
      .single();

    if (wallet) {
      const fare = ride.fare_estimate || 0;
      await supabase.from('wallet_accounts').update({
        available_balance: supabase.rpc('add', { a: wallet.hold_balance, b: fare }),
        hold_balance: supabase.rpc('subtract', { a: wallet.hold_balance, b: fare }),
        updated_at: new Date().toISOString(),
      }).eq('id', wallet.id);

      await supabase.from('wallet_transactions').insert({
        user_id: ride.passenger_id,
        wallet_id: wallet.id,
        type: 'refund',
        amount: fare,
        currency: 'KES',
        status: 'completed',
        description: 'Fare refunded — ride cancelled',
        reference_id: rideId,
        reference_type: 'mtaxi_ride',
        metadata: { direction: 'refund', cancelled_by: cancelledBy },
      });
    }
  }

  const { data, error } = await supabase
    .from('mtaxi_rides')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      cancellation_reason: reason || 'Cancelled by user',
      cancelled_by: cancelledBy,
      fare_held: false,
      updated_at: new Date().toISOString(),
    })
    .eq('id', rideId)
    .select()
    .single();

  if (error) throw error;
  return data;
}
