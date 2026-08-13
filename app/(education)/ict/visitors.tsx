import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function VisitorsScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [visitors] = useState([
    { id: '1', name: 'Mr. Kamau', purpose: 'Parent Meeting', checkIn: '08:15 AM', checkOut: '09:30 AM', status: 'checked-out', phone: '+254 712 345 678' },
    { id: '2', name: 'Mrs. Ochieng', purpose: 'Fee Payment', checkIn: '09:00 AM', checkOut: '-', status: 'checked-in', phone: '+254 723 456 789' },
    { id: '3', name: 'Dr. Smith', purpose: 'Inspection', checkIn: '10:30 AM', checkOut: '-', status: 'checked-in', phone: '+254 734 567 890' },
    { id: '4', name: 'Vendor Ltd', purpose: 'Delivery', checkIn: '11:00 AM', checkOut: '11:45 AM', status: 'checked-out', phone: '+254 745 678 901' },
  ]);

  const filtered = visitors.filter((v: any) => v.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Visitors</Text>
        <TouchableOpacity><Ionicons name="add" size={24} color="#fff" /></TouchableOpacity>
      </View>
      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={18} color="#94a3b8" />
        <TextInput style={styles.searchInput} placeholder="Search visitors..." value={search} onChangeText={setSearch} />
      </View>
      <ScrollView style={styles.content}>
        {filtered.map((visitor) => (
          <View key={visitor.id} style={styles.visitorCard}>
            <View style={styles.visitorHeader}>
              <View style={styles.visitorAvatar}><Text style={styles.visitorAvatarText}>{visitor.name.charAt(0)}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.visitorName}>{visitor.name}</Text>
                <Text style={styles.visitorPurpose}>{visitor.purpose}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: visitor.status === 'checked-in' ? '#10b98120' : '#94a3b820' }]}>
                <Text style={[styles.statusText, { color: visitor.status === 'checked-in' ? '#10b981' : '#94a3b8' }]}>{visitor.status}</Text>
              </View>
            </View>
            <View style={styles.visitorDetails}>
              <View style={styles.detailItem}><Ionicons name="time-outline" size={14} color="#94a3b8" /><Text style={styles.detailText}>In: {visitor.checkIn}</Text></View>
              <View style={styles.detailItem}><Ionicons name="time-outline" size={14} color="#94a3b8" /><Text style={styles.detailText}>Out: {visitor.checkOut}</Text></View>
              <View style={styles.detailItem}><Ionicons name="call-outline" size={14} color="#94a3b8" /><Text style={styles.detailText}>{visitor.phone}</Text></View>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#1e3a5f', paddingTop: 50, paddingHorizontal: 16, paddingBottom: 16 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', margin: 16, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 14, color: '#1e293b' },
  content: { paddingHorizontal: 16 },
  visitorCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10 },
  visitorHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  visitorAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#3b82f6', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  visitorAvatarText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  visitorName: { fontSize: 15, fontWeight: '600', color: '#1e293b' },
  visitorPurpose: { fontSize: 12, color: '#94a3b8', marginTop: 1 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  statusText: { fontSize: 10, fontWeight: '600', textTransform: 'capitalize' },
  visitorDetails: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  detailText: { fontSize: 12, color: '#64748b' },
});
