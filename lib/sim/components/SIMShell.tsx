import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const plans = [
  { id: 1, name: 'Daily Bundle', data: '1 GB', price: 'KES 50', validity: '24h' },
  { id: 2, name: 'Weekly Plus', data: '5 GB', price: 'KES 250', validity: '7 days' },
  { id: 3, name: 'Monthly Pro', data: '20 GB', price: 'KES 1000', validity: '30 days' },
];

export function SIMShell() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>SIM</Text>
      </View>
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Airtime Balance</Text>
        <Text style={styles.balanceAmount}>KES 245.00</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.qaBtn}>
            <Ionicons name="call" size={18} color="white" />
            <Text style={styles.qaText}>Buy Airtime</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.qaBtn}>
            <Ionicons name="wifi" size={18} color="white" />
            <Text style={styles.qaText}>Buy Data</Text>
          </TouchableOpacity>
        </View>
      </View>
      <Text style={styles.sectionTitle}>Data Plans</Text>
      {plans.map(plan => (
        <TouchableOpacity key={plan.id} style={styles.planCard}>
          <View style={styles.planHeader}>
            <Text style={styles.planName}>{plan.name}</Text>
            <Text style={styles.planPrice}>{plan.price}</Text>
          </View>
          <View style={styles.planDetails}>
            <Text style={styles.planData}><Ionicons name="phone-portrait" size={14} /> {plan.data}</Text>
            <Text style={styles.planValidity}><Ionicons name="time" size={14} /> {plan.validity}</Text>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050816' },
  header: { padding: 20, paddingTop: 60 },
  title: { fontSize: 32, fontWeight: 'bold', color: 'white' },
  balanceCard: { backgroundColor: '#1E293B', margin: 16, padding: 20, borderRadius: 16 },
  balanceLabel: { color: '#94A3B8', fontSize: 14 },
  balanceAmount: { color: 'white', fontSize: 32, fontWeight: 'bold', marginTop: 8 },
  quickActions: { flexDirection: 'row', gap: 12, marginTop: 16 },
  qaBtn: { flex: 1, backgroundColor: '#334155', padding: 12, borderRadius: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 },
  qaText: { color: 'white', fontSize: 13 },
  sectionTitle: { color: 'white', fontSize: 18, fontWeight: 'bold', marginHorizontal: 16, marginTop: 16, marginBottom: 12 },
  planCard: { backgroundColor: '#1E293B', marginHorizontal: 16, padding: 16, borderRadius: 12, marginBottom: 8 },
  planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  planName: { color: 'white', fontSize: 16, fontWeight: '600' },
  planPrice: { color: '#6366F1', fontSize: 16, fontWeight: 'bold' },
  planDetails: { flexDirection: 'row', gap: 16, marginTop: 8 },
  planData: { color: '#94A3B8', fontSize: 13 },
  planValidity: { color: '#94A3B8', fontSize: 13 },
});
