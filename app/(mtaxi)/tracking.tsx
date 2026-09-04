import { Alert, useState } from 'react';
// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { Alert, View, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { Alert, useTransport } from '@/lib/transport/hooks/useTransport';
import { supabase } from '@/lib/supabase';

export default function TrackingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const { cancelRideBooking, loading: actionLoading } = useTransport();
  const [ride, setRide] = useState<any>(null);
  const [driver, setDriver] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    loadRide();
    const sub = supabase
      .channel(`ride_${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mtaxi_rides', filter: `id=eq.${id}` }, (payload) => {
        setRide(payload.new);
      })
      .subscribe();
    const interval = setInterval(loadRide, 10000);
    return () => { sub.unsubscribe(); clearInterval(interval); };
  }, [id]);

  async function loadRide() {
    if (!id) return;
    setLoading(true);
    const { data } = await supabase.from('mtaxi_rides').select('*').eq('id', id).single();
    setRide(data);
    if (data?.driver_id) {
      const { data: d } = await supabase.from('mtaxi_drivers').select('*, mtaa_driver_profiles!inner(country)').eq('id', data.driver_id).single();
      if (d) {
        const prof = await supabase.from('user_profiles').select('country').eq('user_id', d.owner_id || d.user_id).maybeSingle();
        d.country_code = prof?.data?.country || 'KE';
      }
      setDriver(d);
    }
    setLoading(false);
  }

  const handleCancel = () => {
    if (!ride || !user?.id) return;
    if (ride.status === 'completed') { Alert.alert('Cannot cancel', 'Trip is already completed'); return; }
    if (ride.status === 'cancelled') { Alert.alert('Already cancelled'); return; }
    if (ride.status === 'started') { Alert.alert('Cannot cancel', 'Trip has already started. Contact support.'); return; }

    Alert.alert(
      'Cancel Ride?',
      ride.fare_held ? 'Your fare hold will be released immediately.' : 'No charge for cancellation.',
      [
        { text: 'Keep Ride', style: 'cancel' },
        {
          text: 'Cancel Ride',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelRideBooking(ride.id, user.id, 'Cancelled by passenger');
              Alert.alert('Ride Cancelled', 'Your fare has been refunded.');
              loadRide();
            } catch (err: any) {
              Alert.alert('Cancel Failed', err.message);
            }
          },
        },
      ]
    );
  };

  const statusColors: Record<string, string> = {
    searching: '#f39c12',
    accepted: '#3498db',
    arrived: '#9b59b6',
    started: '#2ecc71',
    completed: '#27ae60',
    cancelled: '#e74c3c',
  };

  const handleComplete = async () => {
    if (!ride || !user?.id || !driver) { Alert.alert('Not ready'); return; }
    const total = Number(ride.fare_estimate || 0);
    if (total <= 0) { Alert.alert('Invalid fare'); return; }
    const { data: w } = await supabase.from('wallet_accounts').select('available_balance, balance').eq('user_id', user.id).maybeSingle();
    const bal = Number(w?.available_balance || w?.balance || 0);
    if (bal < total) { Alert.alert('❌ Insufficient balance', 'KES ' + bal + ' available. Top up to complete.'); return; }
      const { data: wht } = await supabase.from('withholding_tax_rates').select('rate_percent, tax_authority').eq('country_code', driver.country_code || 'KE').maybeSingle();
    const whtPct = Number(wht?.rate_percent || 0);
    try {
      const { data: r, error: settleErr } = await supabase.rpc('mtaa_settle', {
        p_payer_id: user.id,
        p_payee_id: driver.owner_id || driver.user_id,
        p_total: total,
        p_platform_rate_pct: 3,
        p_wht_rate_pct: whtPct,
        p_wht_country: driver.country_code || 'KE',
        p_reference: 'mtaxi-' + ride.id,
      p_tx_pin: __auth?.pin || null, p_biometric_ok: !!__auth?.biometric});
      if (settleErr) throw new Error('Settle failed: ' + settleErr.message);
      if (!r?.ok) throw new Error('Settle not ok');
      const platformFee = Number(r.platform_fee || 0);
      const driverPayout = Number(r.payee_net || 0);
      const whtAmt = Number(r.wht || 0);
      await supabase.from('mtaxi_rides').update({ status: 'completed', payment_status: 'paid', platform_fee: platformFee, driver_payout: driverPayout, withholding_tax: whtAmt, country_code: driver.country_code || 'KE', completed_at: new Date().toISOString() }).eq('id', ride.id);
      Alert.alert('✅ Ride Complete', 'You paid: KES ' + total.toLocaleString() + '\n\nDriver net: KES ' + driverPayout.toLocaleString() + '\nPlatform fee: KES ' + platformFee + ' (3%)\nWithholding tax (' + (wht?.tax_authority || 'govt') + '): KES ' + whtAmt + ' (' + Math.round(whtRate*100) + '%)');
      loadRide();
    } catch (e) { Alert.alert('Payment failed', String(e?.message || e)); }
  };

  const canCancel = ride && ['searching', 'accepted', 'arrived'].includes(ride.status);

  if (loading && !ride) return <View style={styles.center}><ActivityIndicator color="#e94560" /></View>;
  if (!ride) return <View style={styles.center}><Text style={styles.empty}>Ride not found</Text></View>;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.header}>Trip Tracking</Text>
      <View style={[styles.badge, { backgroundColor: statusColors[ride.status] || '#555' }]}>
        <Text style={styles.badgeText}>{ride.status?.toUpperCase()}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Pickup</Text>
        <Text style={styles.value}>{ride.pickup_address || `${ride.pickup_lat}, ${ride.pickup_lng}`}</Text>
        <Text style={styles.label}>Dropoff</Text>
        <Text style={styles.value}>{ride.dropoff_address || `${ride.dropoff_lat}, ${ride.dropoff_lng}`}</Text>
        <Text style={styles.label}>Fare Estimate</Text>
        <Text style={styles.fare}>KES {ride.fare_estimate?.toLocaleString()}</Text>
        <Text style={styles.label}>Distance</Text>
        <Text style={styles.value}>{ride.distance_km} km</Text>
        {ride.base_fare > 0 && <><Text style={styles.label}>Base Fare</Text><Text style={styles.value}>KES {ride.base_fare}</Text></>}
        {ride.time_fare > 0 && <><Text style={styles.label}>Time Fare</Text><Text style={styles.value}>KES {ride.time_fare}</Text></>}
        {ride.surge_multiplier > 1 && <><Text style={styles.label}>Surge</Text><Text style={styles.surgeValue}>{ride.surge_multiplier}x</Text></>}
        {ride.fare_held && <Text style={styles.held}>🔒 Fare held — payment secured</Text>}
      </View>

      {driver && (
        <View style={styles.card}>
          <Text style={styles.label}>Driver</Text>
          <Text style={styles.value}>{driver.full_name}</Text>
          <Text style={styles.value}>📞 {driver.phone}</Text>
          <Text style={styles.value}>🚗 {driver.vehicle_plate} • {driver.vehicle_type}</Text>
          <Text style={styles.value}>⭐ {driver.rating}</Text>
        </View>
      )}

      {ride.status === 'searching' && (
        <View style={styles.center}>
          <ActivityIndicator color="#e94560" />
          <Text style={styles.hint}>Finding nearby drivers...</Text>
        </View>
      )}

      {canCancel && (
        <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel} disabled={actionLoading}>
          <Text style={styles.cancelText}>{actionLoading ? 'Cancelling...' : '❌ Cancel Ride'}</Text>
        </TouchableOpacity>
      )}

      {ride.status === 'cancelled' && (
        <View style={styles.cancelledBox}>
          <Text style={styles.cancelledText}>This ride was cancelled.</Text>
          {ride.cancellation_reason && <Text style={styles.cancelledReason}>Reason: {ride.cancellation_reason}</Text>}
          <TouchableOpacity style={styles.rebookBtn} onPress={() => router.push('/(mtaxi)/request' as any)}>
            <Text style={styles.rebookText}>Rebook Ride</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  completeBtn: { backgroundColor: '#27ae60', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 12 },
  completeBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  container: { flex: 1, backgroundColor: '#0f0f1a', padding: 16 },
  center: { justifyContent: 'center', alignItems: 'center', padding: 40 },
  header: { color: '#fff', fontSize: 22, fontWeight: '800', marginBottom: 12 },
  badge: { alignSelf: 'flex-start', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, marginBottom: 16 },
  badgeText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  card: { backgroundColor: '#1a1a2e', borderRadius: 12, padding: 14, marginBottom: 12 },
  label: { color: '#8892b0', fontSize: 11, fontWeight: '600', marginTop: 8, textTransform: 'uppercase' },
  value: { color: '#fff', fontSize: 15, marginTop: 2 },
  fare: { color: '#e94560', fontSize: 20, fontWeight: '800', marginTop: 2 },
  surgeValue: { color: '#f39c12', fontSize: 15, fontWeight: '700', marginTop: 2 },
  held: { color: '#2ecc71', fontSize: 12, marginTop: 8, fontWeight: '600' },
  empty: { color: '#555', fontSize: 16 },
  hint: { color: '#8892b0', marginTop: 12 },
  cancelBtn: { backgroundColor: '#e74c3c', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 16 },
  cancelText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  cancelledBox: { backgroundColor: '#1a1a2e', borderRadius: 12, padding: 20, alignItems: 'center', marginTop: 16 },
  cancelledText: { color: '#e74c3c', fontSize: 16, fontWeight: '700' },
  cancelledReason: { color: '#8892b0', fontSize: 12, marginTop: 6 },
  rebookBtn: { backgroundColor: '#e94560', borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10, marginTop: 12 },
  rebookText: { color: '#fff', fontWeight: '700' },
});
