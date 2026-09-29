// @ts-nocheck
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Vibration } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function DriverRequestsScreen() {
  const router = useRouter();
  const [requests, setRequests] = useState([
    { id: '1', type: 'MTaxi', pickup: 'Westlands, Nairobi', dropoff: 'CBD, Nairobi', fare: 350, distance: '4.2 km', time: '12 mins' },
    { id: '2', type: 'MBoda', pickup: 'Kilimani, Nairobi', dropoff: 'Langata, Nairobi', fare: 150, distance: '3.1 km', time: '8 mins' },
  ]);

  const handleAccept = (id) => {
    Vibration.vibrate();
    Alert.alert('Request Accepted', 'Navigating to pickup location...');
    setRequests(requests.filter(r => r.id !== id));
  };

  const handleDecline = (id) => {
    setRequests(requests.filter(r => r.id !== id));
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Ride Requests</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
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
                <View style={[styles.typeBadge, req.type === 'MTaxi' ? { backgroundColor: '#3b82f6' } : { backgroundColor: '#f59e0b' }]}>
                  <Text style={styles.typeText}>{req.type}</Text>
                </View>
                <Text style={styles.fare}>KES {req.fare}</Text>
              </View>
              
              <View style={styles.routeContainer}>
                <View style={styles.routePoint}>
                  <Ionicons name="location" size={16} color="#22c55e" />
                  <Text style={styles.routeText}>{req.pickup}</Text>
                </View>
                <View style={styles.routeLine} />
                <View style={styles.routePoint}>
                  <Ionicons name="flag" size={16} color="#ef4444" />
                  <Text style={styles.routeText}>{req.dropoff}</Text>
                </View>
              </View>

              <View style={styles.metaRow}>
                <Text style={styles.metaText}>{req.distance} • {req.time}</Text>
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
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 16 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  content: { flex: 1, paddingHorizontal: 16 },
  emptyState: { alignItems: 'center', marginTop: 80 },
  emptyText: { color: '#fff', fontSize: 18, fontWeight: '600', marginTop: 16 },
  emptySubtext: { color: '#94a3b8', fontSize: 14, marginTop: 8 },
  requestCard: { backgroundColor: '#1e293b', borderRadius: 16, padding: 16, marginBottom: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  typeBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  typeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  fare: { color: '#22c55e', fontSize: 20, fontWeight: '800' },
  routeContainer: { marginBottom: 16 },
  routePoint: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  routeText: { color: '#e2e8f0', fontSize: 15, flex: 1 },
  routeLine: { width: 2, height: 20, backgroundColor: '#334155', marginLeft: 7, marginVertical: 4 },
  metaRow: { flexDirection: 'row', gap: 16, marginBottom: 16 },
  metaText: { color: '#94a3b8', fontSize: 13 },
  actionRow: { flexDirection: 'row', gap: 12 },
  actionBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  declineBtn: { backgroundColor: '#334155' },
  declineText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  acceptBtn: { backgroundColor: '#22c55e' },
  acceptText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
