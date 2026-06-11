import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  RefreshControl, ActivityIndicator, Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Baby, Plus, ChevronRight, Shield, Calendar, Heart,
  Syringe, Activity, QrCode, AlertTriangle
} from 'lucide-react-native';
import { useAuthStore } from '@/lib/auth/state/auth.store';
import { Colors } from '@/constants/Colors';

interface ChildProfile {
  id: string;
  name: string;
  date_of_birth: string;
  gender: string;
  blood_group: string;
  allergies: string[];
  vaccinations_up_to_date: boolean;
  next_vaccination?: string;
  last_checkup: string;
  qr_hash: string;
  relationship: string;
}

export default function ChildProfilesScreen() {
  const router = useRouter();
  const { profile } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);

  const children: ChildProfile[] = [
    {
      id: '1', name: 'Wanjiku Kamau', date_of_birth: '2020-03-15',
      gender: 'female', blood_group: 'O+',
      allergies: ['Penicillin'], vaccinations_up_to_date: true,
      next_vaccination: '2025-09-15', last_checkup: '2025-05-10',
      qr_hash: 'MTAA-CHILD-001', relationship: 'mother'
    },
    {
      id: '2', name: 'Kamau Junior', date_of_birth: '2018-07-22',
      gender: 'male', blood_group: 'A+',
      allergies: [], vaccinations_up_to_date: false,
      next_vaccination: '2025-06-20', last_checkup: '2025-04-15',
      qr_hash: 'MTAA-CHILD-002', relationship: 'mother'
    }
  ];

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  const getAge = (dob: string) => {
    const birth = new Date(dob);
    const now = new Date();
    const years = now.getFullYear() - birth.getFullYear();
    const months = now.getMonth() - birth.getMonth();
    if (months < 0) return `${years - 1} years ${12 + months} months`;
    return `${years} years ${months} months`;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>My Children</Text>
          <Text style={styles.subtitle}>{children.length} linked profiles</Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => Alert.alert('Add Child', 'Link a child profile')}
        >
          <Plus size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {children.map(child => {
          const age = getAge(child.date_of_birth);
          const daysToVax = child.next_vaccination
            ? Math.ceil((new Date(child.next_vaccination).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
            : null;

          return (
            <TouchableOpacity
              key={child.id}
              style={styles.childCard}
              onPress={() => router.push({
                pathname: '/(os)/health/children/detail',
                params: { id: child.id }
              } as any)}
            >
              <View style={styles.childHeader}>
                <View style={[styles.avatar, { backgroundColor: child.gender === 'male' ? '#2196F3' : '#E91E63' }]}>
                  <Baby size={24} color="#fff" />
                </View>
                <View style={styles.childInfo}>
                  <Text style={styles.childName}>{child.name}</Text>
                  <Text style={styles.childAge}>{age}</Text>
                </View>
                <ChevronRight size={20} color="#ccc" />
              </View>

              <View style={styles.childDetails}>
                <View style={styles.detailRow}>
                  <Heart size={14} color="#F44336" />
                  <Text style={styles.detailText}>Blood: {child.blood_group}</Text>
                </View>
                {child.allergies.length > 0 && (
                  <View style={styles.detailRow}>
                    <AlertTriangle size={14} color="#FF9800" />
                    <Text style={styles.detailText}>Allergies: {child.allergies.join(', ')}</Text>
                  </View>
                )}
                <View style={styles.detailRow}>
                  <Calendar size={14} color="#666" />
                  <Text style={styles.detailText}>Last checkup: {new Date(child.last_checkup).toLocaleDateString()}</Text>
                </View>
              </View>

              <View style={styles.vaccinationRow}>
                <View style={[styles.vaxBadge, {
                  backgroundColor: child.vaccinations_up_to_date ? '#E8F5E9' : '#FFF3E0'
                }]}>
                  <Syringe size={12} color={child.vaccinations_up_to_date ? '#4CAF50' : '#FF9800'} />
                  <Text style={[styles.vaxText, {
                    color: child.vaccinations_up_to_date ? '#4CAF50' : '#FF9800'
                  }]}>
                    {child.vaccinations_up_to_date ? 'Vaccinations up to date' : 'Vaccination pending'}
                  </Text>
                </View>
                {daysToVax !== null && daysToVax <= 30 && (
                  <View style={[styles.upcomingBadge, { backgroundColor: '#FFEBEE' }]}>
                    <Calendar size={12} color="#F44336" />
                    <Text style={styles.upcomingText}>{daysToVax}d to next vax</Text>
                  </View>
                )}
              </View>

              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => router.push({
                    pathname: '/(os)/health/children/health-record',
                    params: { id: child.id }
                  } as any)}
                >
                  <Activity size={14} color={Colors.primary} />
                  <Text style={styles.actionText}>Health Record</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => Alert.alert('QR Code', `Hash: ${child.qr_hash}`)}
                >
                  <QrCode size={14} color={Colors.primary} />
                  <Text style={styles.actionText}>QR ID</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => router.push({
                    pathname: '/(os)/health/children/growth',
                    params: { id: child.id }
                  } as any)}
                >
                  <Activity size={14} color={Colors.primary} />
                  <Text style={styles.actionText}>Growth</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          );
        })}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12
  },
  title: { fontSize: 24, fontWeight: '700', color: '#1a1a1a' },
  subtitle: { fontSize: 13, color: '#666', marginTop: 2 },
  addButton: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center'
  },
  childCard: {
    backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 12,
    borderRadius: 16, padding: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 1
  },
  childHeader: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 10
  },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    justifyContent: 'center', alignItems: 'center', marginRight: 12
  },
  childInfo: { flex: 1 },
  childName: { fontSize: 16, fontWeight: '600', color: '#1a1a1a' },
  childAge: { fontSize: 12, color: '#888', marginTop: 1 },
  childDetails: { gap: 6, marginBottom: 10 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detailText: { fontSize: 12, color: '#555', flex: 1 },
  vaccinationRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  vaxBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6
  },
  vaxText: { fontSize: 10, fontWeight: '600' },
  upcomingBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6
  },
  upcomingText: { fontSize: 10, color: '#F44336', fontWeight: '600' },
  actionRow: {
    flexDirection: 'row', borderTopWidth: 1,
    borderTopColor: '#f0f0f0', paddingTop: 10, gap: 16
  },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionText: { fontSize: 12, color: Colors.primary, fontWeight: '500' },
  bottomPadding: { height: 32 }
});
