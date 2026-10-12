// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, Phone, MapPin, Flag, DollarSign } from 'lucide-react-native';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';
import { maskPhoneNumber } from '@/lib/utils/pii';

export default function DriverActiveRideScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [ride, setRide] = useState<any>(null);
  const [passenger, setPassenger] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (user?.id) fetchActiveRide();
  }, [user?.id]);

  const fetchActiveRide = async () => {
    try {
      const { data, error } = await supabase
        .from('mtaxi_rides')
        .select('*')
        .eq('driver_id', user.id)
        .in('status', ['accepted', 'started', 'arrived'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        setRide(null);
        setLoading(false);
        return;
      }

      setRide(data);

      if (data.user_id) {
        const { data: p } = await supabase
          .from('user_profiles')
          .select('full_name, phone')
          .eq('user_id', data.user_id)
          .single();
        setPassenger(p);
      }
    } catch (err) {
      console.error('Fetch active ride error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartRide = async () => {
    if (!ride) return;
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('mtaxi_rides')
        .update({ status: 'started', started_at: new Date().toISOString() })
        .eq('id', ride.id);
      
      if (error) throw error;
      setRide({ ...ride, status: 'started' });
      Alert.alert('Success', 'Ride started! Navigate to the dropoff location.');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to start ride');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteRide = async () => {
    if (!ride) return;
    
    Alert.alert(
      'Complete Ride?',
      `This will charge the passenger KES ${ride.fare_estimate} and credit your wallet. Proceed?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete & Charge',
          style: 'default',
          onPress: async () => {
            setActionLoading(true);
            try {
              // 1. Update ride status to completed
              const { error: updateError } = await supabase
                .from('mtaxi_rides')
                .update({ status: 'completed', completed_at: new Date().toISOString() })
                .eq('id', ride.id);
              
              if (updateError) throw updateError;

              // 2. Trigger secure settlement (Driver payout + Platform fee)
              const { data: settleData, error: settleError } = await supabase.rpc('mtaa_settle', {
                p_payer_id: ride.user_id,
                p_payee_id: user.id,
                p_total: ride.fare_estimate,
                p_platform_rate_pct: 3, // 3% platform fee
                p_wht_rate_pct: 0, // Adjust based on country tax laws
                p_wht_country: 'KE',
                p_reference: `mtaxi-complete-${ride.id}`,
                p_tx_pin: null, // In production, prompt driver for PIN or use biometrics
                p_biometric_ok: true
              });

              if (settleError) throw settleError;
              if (!settleData?.ok) throw new Error('Settlement failed');

              Alert.alert(
                '✅ Ride Completed', 
                `You earned: KES ${settleData.payee_net}\nPlatform fee: KES ${settleData.platform_fee}`
              );
              setRide(null);
              router.replace('/(mtaxi)/driver/dashboard');
            } catch (err: any) {
              Alert.alert('Completion Failed', err.message || 'Could not complete ride');
              // Revert status if settlement failed to allow retry
              await supabase.from('mtaxi_rides').update({ status: 'started' }).eq('id', ride.id);
            } finally {
              setActionLoading(false);
            }
          }
        }
      ]
    );
  };

  const callPassenger = () => {
    if (passenger?.phone) Linking.openURL(`tel:${passenger.phone}`);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0ea5e9" />
      </View>
    );
  }

  if (!ride) {
    return (
      <View style={styles.center}>
        <Ionicons name="car-outline" size={64} color="#64748b" />
        <Text style={styles.emptyText}>No active rides</Text>
        <Text style={styles.emptySubtext}>You will see your current ride here.</Text>
        <TouchableOpacity style={styles.dashboardBtn} onPress={() => router.push('/(mtaxi)/driver/dashboard' as any)}>
          <Text style={styles.dashboardBtnText}>Go to Dashboard</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Active Ride</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={[styles.statusBadge, { backgroundColor: ride.status === 'started' ? '#22c55e' : '#f59e0b' }]}>
        <Text style={styles.statusText}>{ride.status.toUpperCase()}</Text>
      </View>

      {/* Passenger Info */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Passenger</Text>
          <TouchableOpacity style={styles.callBtn} onPress={callPassenger}>
            <Phone size={18} color="#fff" />
            <Text style={styles.callBtnText}>Call</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.passengerName}>{passenger?.full_name || 'Unknown'}</Text>
        <Text style={styles.passengerPhone}>{maskPhoneNumber(passenger?.phone) || 'No phone'}</Text>
      </View>

      {/* Route Info */}
      <View style={styles.card}>
        <View style={styles.routePoint}>
          <MapPin size={20} color="#22c55e" />
          <View style={{ flex: 1 }}>
            <Text style={styles.routeLabel}>Pickup</Text>
            <Text style={styles.routeValue}>{ride.pickup_address || 'Unknown Location'}</Text>
          </View>
        </View>
        <View style={styles.routeLine} />
        <View style={styles.routePoint}>
          <Flag size={20} color="#ef4444" />
          <View style={{ flex: 1 }}>
            <Text style={styles.routeLabel}>Dropoff</Text>
            <Text style={styles.routeValue}>{ride.dropoff_address || 'Unknown Location'}</Text>
          </View>
        </View>
      </View>

      {/* Fare Info */}
      <View style={styles.card}>
        <View style={styles.fareRow}>
          <Text style={styles.fareLabel}>Estimated Fare</Text>
          <Text style={styles.fareValue}>KES {ride.fare_estimate?.toLocaleString()}</Text>
        </View>
        <View style={styles.fareRow}>
          <Text style={styles.fareLabel}>Distance</Text>
          <Text style={styles.fareValue}>{ride.distance_km} km</Text>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        {ride.status === 'accepted' && (
          <TouchableOpacity style={[styles.actionBtn, styles.startBtn]} onPress={handleStartRide} disabled={actionLoading}>
            {actionLoading ? <ActivityIndicator color="#fff" /> : (
              <>
                <Ionicons name="play" size={20} color="#fff" />
                <Text style={styles.actionBtnText}>Start Ride</Text>
              </>
            )}
          </TouchableOpacity>
        )}
        
        {ride.status === 'started' && (
          <TouchableOpacity style={[styles.actionBtn, styles.completeBtn]} onPress={handleCompleteRide} disabled={actionLoading}>
            {actionLoading ? <ActivityIndicator color="#fff" /> : (
              <>
                <DollarSign size={20} color="#fff" />
                <Text style={styles.actionBtnText}>Complete & Charge</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a', padding: 20 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 16 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  statusBadge: { alignSelf: 'center', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, marginBottom: 16 },
  statusText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  card: { backgroundColor: '#1e293b', borderRadius: 16, padding: 16, marginHorizontal: 16, marginBottom: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardTitle: { color: '#94a3b8', fontSize: 12, fontWeight: '600', textTransform: 'uppercase' },
  callBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#22c55e', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 6 },
  callBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  passengerName: { color: '#fff', fontSize: 20, fontWeight: '700' },
  passengerPhone: { color: '#94a3b8', fontSize: 14, marginTop: 4 },
  routePoint: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  routeLabel: { color: '#94a3b8', fontSize: 12, fontWeight: '600' },
  routeValue: { color: '#fff', fontSize: 15, marginTop: 2 },
  routeLine: { width: 2, height: 24, backgroundColor: '#334155', marginLeft: 9, marginVertical: 8 },
  fareRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  fareLabel: { color: '#94a3b8', fontSize: 14 },
  fareValue: { color: '#fff', fontSize: 16, fontWeight: '700' },
  actions: { paddingHorizontal: 16, marginTop: 8 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 12, gap: 8 },
  startBtn: { backgroundColor: '#3b82f6' },
  completeBtn: { backgroundColor: '#22c55e' },
  actionBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  emptyText: { color: '#fff', fontSize: 18, fontWeight: '600', marginTop: 16 },
  emptySubtext: { color: '#94a3b8', fontSize: 14, marginTop: 8, textAlign: 'center' },
  dashboardBtn: { backgroundColor: '#0ea5e9', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, marginTop: 24 },
  dashboardBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
