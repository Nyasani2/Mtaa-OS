import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Vibration, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

export default function DriverRequestsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRequests = async () => {
    if (!user?.id) return;
    try {
      const { data, error } = await supabase
        .from('mtaxi_rides')
        .select(`
          id,
          pickup_address,
          dropoff_address,
          fare_estimate,
          distance_km,
          created_at,
          passenger:passenger_id (full_name, phone)
        `)
        .eq('status', 'searching')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setRequests(data || []);
    } catch (err) {
      console.error('Fetch requests error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    
    const subscription = supabase
      .channel('mtaxi_requests')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mtaxi_rides', filter: 'status=eq.searching' }, (payload) => {
        Vibration.vibrate();
        setRequests(prev => [payload.new, ...prev]);
      })
      .subscribe();

    return () => { subscription.unsubscribe(); };
  }, [user?.id]);

  const handleAccept = async (rideId: string) => {
    Vibration.vibrate();
    try {
      // SECURITY FIX: Use Edge Function to accept ride securely
      const { data, error } = await supabase.functions.invoke('mtaxi-accept', {
        body: { ride_id: rideId, driver_id: user?.id }
      });

      if (error || !data?.success) throw new Error(data?.error || 'Failed to accept ride');

      Alert.alert('Request Accepted', 'Navigating to pickup location...');
      setRequests(prev => prev.filter(r => r.id !== rideId));
      router.push(`/(mtaxi)/driver-ride?id=${rideId}` as any);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to accept ride');
    }
  };

  const handleDecline = (rideId: string) => {
    setRequests(prev => prev.filter(r => r.id !== rideId));
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchRequests();
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#3b82f6" /></View>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ride Requests</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />}
      >
        {requests.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={48} color="#64748b" />
            <Text style={styles.emptyText}>Searching for nearby rides...</Text>
            <Text style={styles.emptySubtext}>Make sure you are online to receive requests.</Text>
          </View>
        ) : (
          requests.map((req) => (
            <View key={req.id} style={styles.requestCard}>
              <View style={styles.cardHeader}>
                <View style={styles.typeBadge}><Text style={styles.typeText}>MTaxi</Text></View>
                <Text style={styles.fare}>KES {req.fare_estimate?.toLocaleString() || 0}</Text>
              </View>
              
              <View style={styles.passengerInfo}>
                <Ionicons name="person" size={16} color="#8892b0" />
                <Text style={styles.passengerName}>{req.passenger?.full_name || 'Passenger'}</Text>
              </View>

              <View style={styles.routeContainer}>
                <View style={styles.routePoint}>
                  <Ionicons name="location" size={16} color="#22c55e" />
                  <Text style={styles.routeText}>{req.pickup_address || 'Unknown Pickup'}</Text>
                </View>
                <View style={styles.routeLine} />
                <View style={styles.routePoint}>
                  <Ionicons name="flag" size={16} color="#ef4444" />
                  <Text style={styles.routeText}>{req.dropoff_address || 'Unknown Dropoff'}</Text>
                </View>
              </View>

              <View style={styles.metaRow}>
                <Text style={styles.metaText}>📏 {req.distance_km || 0} km</Text>
                <Text style={styles.metaText}>🕒 {new Date(req.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</Text>
              </View>

              <View style={styles.actionRow}>
                <TouchableOpacity style={[styles.actionBtn, styles.declineBtn]} onPress={() => handleDecline(req.id)}>
                  <Text style={styles.declineText}>Decline</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, styles.acceptBtn]} onPress={() => handleAccept(req.id)}>
                  <Text style={styles.acceptText}>Accept</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 16 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  content: { flex: 1, paddingHorizontal: 16 },
  emptyState: { alignItems: 'center', marginTop: 80 },
  emptyText: { color: '#fff', fontSize: 18, fontWeight: '600', marginTop: 16 },
  emptySubtext: { color: '#94a3b8', fontSize: 14, marginTop: 8 },
  requestCard: { backgroundColor: '#1e293b', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#334155' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  typeBadge: { backgroundColor: '#3b82f6', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  typeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  fare: { color: '#22c55e', fontSize: 20, fontWeight: '800' },
  passengerInfo: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12, backgroundColor: '#334155', padding: 8, borderRadius: 8 },
  passengerName: { color: '#e2e8f0', fontSize: 14, fontWeight: '600' },
  routeContainer: { marginBottom: 16 },
  routePoint: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  routeText: { color: '#e2e8f0', fontSize: 15, flex: 1 },
  routeLine: { width: 2, height: 20, backgroundColor: '#334155', marginLeft: 7, marginVertical: 4 },
  metaRow: { flexDirection: 'row', gap: 16, marginBottom: 16 },
  metaText: { color: '#94a3b8', fontSize: 13, fontWeight: '500' },
  actionRow: { flexDirection: 'row', gap: 12 },
  actionBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  declineBtn: { backgroundColor: '#334155' },
  declineText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  acceptBtn: { backgroundColor: '#22c55e' },
  acceptText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
