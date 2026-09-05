// @ts-nocheck
import React, { useState, useCallback } from 'react';
import { Alert, View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Pill, Clock, ChevronRight, AlertCircle, CheckCircle2, Calendar, User, Building2, RefreshCw } from 'lucide-react-native';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { Colors } from '@/constants/Colors';

interface Prescription {
  id: string;
  drug_name: string;
  generic_name: string;
  dosage: string;
  frequency: string;
  duration_days: number;
  quantity: number;
  route: string;
  instructions: string;
  status: 'active' | 'dispensed' | 'partially_dispensed' | 'cancelled' | 'expired';
  prescribed_by: string;
  facility: string;
  prescribed_at: string;
  valid_until: string;
  is_substitutable: boolean;
}

export default function PrescriptionsScreen() {
  const router = useRouter();
  const { profile } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
  const [loading, setLoading] = useState(false);

  const prescriptions: Prescription[] = [
    {
      id: '1', drug_name: 'Metformin', generic_name: 'Metformin Hydrochloride',
      dosage: '500mg', frequency: 'Twice daily', duration_days: 30, quantity: 60,
      route: 'oral', instructions: 'Take with meals to reduce stomach upset',
      status: 'active', prescribed_by: 'Dr. Sarah Kimani',
      facility: 'Nairobi West Hospital', prescribed_at: '2025-06-10T10:00:00Z',
      valid_until: '2025-07-10T10:00:00Z', is_substitutable: false
    },
    {
      id: '2', drug_name: 'Amlodipine', generic_name: 'Amlodipine Besylate',
      dosage: '5mg', frequency: 'Once daily', duration_days: 30, quantity: 30,
      route: 'oral', instructions: 'Take in the morning',
      status: 'active', prescribed_by: 'Dr. Peter Njoroge',
      facility: 'Aga Khan University Hospital', prescribed_at: '2025-06-05T09:00:00Z',
      valid_until: '2025-07-05T09:00:00Z', is_substitutable: true
    },
    {
      id: '3', drug_name: 'Paracetamol', generic_name: 'Acetaminophen',
      dosage: '500mg', frequency: 'Every 6 hours as needed', duration_days: 5, quantity: 20,
      route: 'oral', instructions: 'For fever or pain. Max 4g per day.',
      status: 'dispensed', prescribed_by: 'Dr. Sarah Kimani',
      facility: 'Nairobi West Hospital', prescribed_at: '2025-05-20T14:00:00Z',
      valid_until: '2025-05-25T14:00:00Z', is_substitutable: true
    },
  ];

  const activePrescriptions = prescriptions.filter((p: any) => p.status === 'active');
  const historyPrescriptions = prescriptions.filter((p: any) => ['dispensed', 'partially_dispensed', 'cancelled', 'expired'].includes(p.status));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'active': return { color: '#4CAF50', bg: '#E8F5E9', icon: CheckCircle2 };
      case 'dispensed': return { color: '#2196F3', bg: '#E3F2FD', icon: CheckCircle2 };
      case 'partially_dispensed': return { color: '#FF9800', bg: '#FFF3E0', icon: AlertCircle };
      case 'cancelled': return { color: '#F44336', bg: '#FFEBEE', icon: AlertCircle };
      case 'expired': return { color: '#9E9E9E', bg: '#F5F5F5', icon: Clock };
      default: return { color: '#999', bg: '#f5f5f5', icon: AlertCircle };
    }
  };

  const renderPrescription = (rx: Prescription) => {
    const status = getStatusConfig(rx.status);
    const StatusIcon = status.icon;
    const daysRemaining = Math.ceil((new Date(rx.valid_until).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

    return (
      <TouchableOpacity
        key={rx.id}
        style={styles.rxCard}
        onPress={() => router.push({
          pathname: '/(os)/health/prescriptions/detail',
          params: { id: rx.id }
        } as any)}
      >
        <View style={styles.rxHeader}>
          <View style={[styles.rxIcon, { backgroundColor: status.bg }]}>
            <Pill size={20} color={status.color} />
          </View>
          <View style={styles.rxInfo}>
            <Text style={styles.rxName}>{rx.drug_name}</Text>
            <Text style={styles.rxGeneric}>{rx.generic_name}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
            <StatusIcon size={12} color={status.color} />
            <Text style={[styles.statusText, { color: status.color }]}>{rx.status.replace('_', ' ')}</Text>
          </View>
        </View>

        <View style={styles.rxDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Dosage:</Text>
            <Text style={styles.detailValue}>{rx.dosage} · {rx.frequency}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Duration:</Text>
            <Text style={styles.detailValue}>{rx.duration_days} days · {rx.quantity} units</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Route:</Text>
            <Text style={styles.detailValue}>{rx.route}</Text>
          </View>
          {rx.instructions && (
            <View style={styles.instructionsBox}>
              <AlertCircle size={12} color="#FF9800" />
              <Text style={styles.instructionsText}>{rx.instructions}</Text>
            </View>
          )}
        </View>

        <View style={styles.rxFooter}>
          <View style={styles.footerItem}>
            <User size={12} color="#888" />
            <Text style={styles.footerText}>{rx.prescribed_by}</Text>
          </View>
          <View style={styles.footerItem}>
            <Building2 size={12} color="#888" />
            <Text style={styles.footerText}>{rx.facility}</Text>
          </View>
          <View style={styles.footerItem}>
            <Calendar size={12} color="#888" />
            <Text style={styles.footerText}>
              {new Date(rx.prescribed_at).toLocaleDateString()}
            </Text>
          </View>
        </View>

        {rx.status === 'active' && daysRemaining > 0 && (
          <View style={[styles.daysBadge, { backgroundColor: daysRemaining <= 3 ? '#FFEBEE' : '#E8F5E9' }]}>
            <Clock size={12} color={daysRemaining <= 3 ? '#F44336' : '#4CAF50'} />
            <Text style={[styles.daysText, { color: daysRemaining <= 3 ? '#F44336' : '#4CAF50' }]}>
              {daysRemaining} days remaining
            </Text>
          </View>
        )}

        {rx.status === 'active' && (
          <TouchableOpacity
            style={styles.refillButton}
            onPress={() => Alert.alert('Refill Request', 'Request refill at nearest pharmacy?')}
          >
            <RefreshCw size={14} color={Colors.primary} />
            <Text style={styles.refillText}>Request Refill</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Prescriptions</Text>
          <Text style={styles.subtitle}>{activePrescriptions.length} active · {historyPrescriptions.length} history</Text>
        </View>
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'active' && styles.tabActive]}
          onPress={() => setActiveTab('active')}
        >
          <Text style={[styles.tabText, activeTab === 'active' && styles.tabTextActive]}>
            Active ({activePrescriptions.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'history' && styles.tabActive]}
          onPress={() => setActiveTab('history')}
        >
          <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>
            History ({historyPrescriptions.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <ActivityIndicator style={{ marginTop: 40 }} color={Colors.primary} />
        ) : (activeTab === 'active' ? activePrescriptions : historyPrescriptions).length === 0 ? (
          <View style={styles.emptyState}>
            <Pill size={40} color="#ccc" />
            <Text style={styles.emptyText}>
              {activeTab === 'active' ? 'No active prescriptions' : 'No prescription history'}
            </Text>
          </View>
        ) : (
          (activeTab === 'active' ? activePrescriptions : historyPrescriptions).map(renderPrescription)
        )}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  header: {
    paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12
  },
  title: { fontSize: 24, fontWeight: '700', color: '#1a1a1a' },
  subtitle: { fontSize: 13, color: '#666', marginTop: 2 },
  tabBar: {
    flexDirection: 'row', paddingHorizontal: 16,
    marginBottom: 12, gap: 8
  },
  tab: {
    flex: 1, paddingVertical: 10, borderRadius: 10,
    backgroundColor: '#E8E8E8', alignItems: 'center'
  },
  tabActive: { backgroundColor: Colors.primary },
  tabText: { fontSize: 13, color: '#666', fontWeight: '500' },
  tabTextActive: { color: '#fff' },
  rxCard: {
    backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 12,
    borderRadius: 16, padding: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 1
  },
  rxHeader: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 10
  },
  rxIcon: {
    width: 40, height: 40, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center', marginRight: 10
  },
  rxInfo: { flex: 1 },
  rxName: { fontSize: 15, fontWeight: '600', color: '#1a1a1a' },
  rxGeneric: { fontSize: 11, color: '#888', marginTop: 1 },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6
  },
  statusText: { fontSize: 10, fontWeight: '600', textTransform: 'capitalize' },
  rxDetails: { gap: 6, marginBottom: 10 },
  detailRow: { flexDirection: 'row', alignItems: 'center' },
  detailLabel: { fontSize: 12, color: '#888', width: 70 },
  detailValue: { fontSize: 12, color: '#333', flex: 1 },
  instructionsBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 6,
    backgroundColor: '#FFF8E1', borderRadius: 6,
    padding: 8, marginTop: 4
  },
  instructionsText: { fontSize: 11, color: '#5D4037', flex: 1 },
  rxFooter: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 12,
    borderTopWidth: 1, borderTopColor: '#f0f0f0',
    paddingTop: 10, marginBottom: 8
  },
  footerItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  footerText: { fontSize: 11, color: '#888' },
  daysBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    alignSelf: 'flex-start', paddingHorizontal: 8,
    paddingVertical: 4, borderRadius: 6, marginBottom: 8
  },
  daysText: { fontSize: 11, fontWeight: '600' },
  refillButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderWidth: 1, borderColor: Colors.primary, borderRadius: 8,
    paddingVertical: 8
  },
  refillText: { fontSize: 12, color: Colors.primary, fontWeight: '600' },
  emptyState: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 14, color: '#999', marginTop: 12 },
  bottomPadding: { height: 32 }
});
