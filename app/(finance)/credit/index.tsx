// app/(finance)/credit/index.tsx
// MTAA Credit — Loans & Credit Score

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function CreditScreen() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Credit</Text>
        <TouchableOpacity>
          <Ionicons name="help-circle-outline" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* Credit Score Card */}
      <View style={styles.scoreCard}>
        <Text style={styles.scoreLabel}>Credit Score</Text>
        <Text style={styles.scoreValue}>—</Text>
        <Text style={styles.scoreSub}>Complete your profile to get scored</Text>
      </View>

      {/* Quick Actions */}
      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.actionCard}>
          <Ionicons name="cash-outline" size={28} color="#007AFF" />
          <Text style={styles.actionTitle}>Apply Loan</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionCard}>
          <Ionicons name="trending-up-outline" size={28} color="#34C759" />
          <Text style={styles.actionTitle}>Build Score</Text>
        </TouchableOpacity>
      </View>

      {/* Loan Products */}
      <Text style={styles.sectionTitle}>Loan Products</Text>
      {['Personal Loan', 'Business Loan', 'Emergency Loan', 'Education Loan'].map((loan) => (
        <TouchableOpacity key={loan} style={styles.loanCard}>
          <View style={styles.loanIcon}>
            <Ionicons name="document-text" size={22} color="#007AFF" />
          </View>
          <View style={styles.loanInfo}>
            <Text style={styles.loanName}>{loan}</Text>
            <Text style={styles.loanDesc}>Tap to learn more and apply</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#C7C7CC" />
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#fff',
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#000' },
  scoreCard: {
    backgroundColor: '#007AFF',
    margin: 16,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  scoreLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 14 },
  scoreValue: { color: '#fff', fontSize: 48, fontWeight: '800', marginTop: 8 },
  scoreSub: { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 8 },
  actionsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  actionTitle: { fontSize: 14, fontWeight: '600', color: '#000', marginTop: 8 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#000',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  loanCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 14,
  },
  loanIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loanInfo: { flex: 1, marginLeft: 12 },
  loanName: { fontSize: 16, fontWeight: '600', color: '#000' },
  loanDesc: { fontSize: 13, color: '#8E8E93', marginTop: 2 },
});
