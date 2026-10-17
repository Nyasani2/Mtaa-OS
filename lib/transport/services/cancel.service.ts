import { supabase } from '@/lib/supabase';

export async function cancelRide(rideId: string, cancelledBy: string, reason?: string) {
  // SECURITY FIX: Use Edge Function to handle wallet refunds and status updates securely
  const { data, error } = await supabase.functions.invoke('mtaxi-cancel', {
    body: { ride_id: rideId, cancelled_by: cancelledBy, reason: reason || 'Cancelled by user' }
  });
  
  if (error) throw error;
  if (!data?.success) throw new Error(data?.error || 'Failed to cancel ride');
  
  return data;
}

// Fallback for legacy compatibility (does NOT touch wallet, just updates status)
export async function cancelRideDirect(rideId: string, cancelledBy: string, reason?: string) {
  const { data: ride, error: fetchErr } = await supabase.from('mtaxi_rides').select('*').eq('id', rideId).maybeSingle();
  if (fetchErr) throw fetchErr;
  if (ride.status === 'completed') throw new Error('Cannot cancel completed ride');
  if (ride.status === 'cancelled') throw new Error('Ride already cancelled');

  const { data, error } = await supabase.from('mtaxi_rides').update({
    status: 'cancelled', cancelled_at: new Date().toISOString(), cancellation_reason: reason || 'Cancelled by user', cancelled_by: cancelledBy, updated_at: new Date().toISOString(),
  }).eq('id', rideId).select().maybeSingle();

  if (error) throw error;
  return data;
}
