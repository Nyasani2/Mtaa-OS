// @ts-nocheck
import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Dimensions
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Baby, ChevronLeft, Calendar, Syringe, Heart, Activity,
  TrendingUp, Ruler, Weight, AlertCircle, CheckCircle2, Clock
} from 'lucide-react-native';
import { Colors } from '@/constants/Colors';

interface Vaccination {
  name: string;
  dose: number;
  total_doses: number;
  administered_at: string;
  status: 'completed' | 'due' | 'overdue';
}

interface GrowthRecord {
  date: string;
  weight_kg: number;
  height_cm: number;
  head_circumference_cm?: number;
}

interface Visit {
  date: string;
  type: string;
  doctor: string;
  facility: string;
  notes: string;
}

export default function ChildHealthRecordScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [activeTab, setActiveTab] = useState<'overview' | 'vaccinations' | 'growth' | 'visits'>('overview');

  // Mock data for child ID
  const child = {
    id: id || '1',
    name: 'Wanjiku Kamau',
    date_of_birth: '2020-03-15',
    gender: 'female',
    blood_group: 'O+',
    allergies: ['Penicillin']
  };

  const vaccinations: Vaccination[] = [
    { name: 'BCG', dose: 1, total_doses: 1, administered_at: '2020-03-20', status: 'completed' },
    { name: 'Polio (OPV)', dose: 3, total_doses: 4, administered_at: '2021-03-15', status: 'completed' },
    { name: 'DTP-HepB-Hib', dose: 3, total_doses: 3, administered_at: '2021-03-15', status: 'completed' },
    { name: 'Measles-Rubella', dose: 1, total_doses: 2, administered_at: '2021-09-15', status: 'completed' },
    { name: 'Measles-Rubella', dose: 2, total_doses: 2, administered_at: '', status: 'due' },
    { name: 'HPV', dose: 1, total_doses: 2, administered_at: '', status: 'overdue' },
  ];

  const growthRecords: GrowthRecord[] = [
    { date: '2025-05-10', weight_kg: 18.5, height_cm: 105, head_circumference_cm: 50 },
    { date: '2025-01-15', weight_kg: 17.2, height_cm: 102 },
    { date: '2024-09-20', weight_kg: 16.0, height_cm: 98 },
    { date: '2024-05-10', weight_kg: 14.8, height_cm: 94 },
  ];

  const visits: Visit[] = [
    { date: '2025-05-10', type: 'Routine checkup', doctor: 'Dr. Sarah Kimani', facility: 'Nairobi West Hospital', notes: 'Growth normal. Continue current diet.' },
    { date: '2025-01-15', type: 'Vaccination', doctor: 'Nurse Grace Muthoni', facility: 'Nairobi West Hospital', notes: 'DTP-HepB-Hib dose 3 administered.' },
    { date: '2024-09-20', type: 'Fever consultation', doctor: 'Dr. Peter Njoroge', facility: 'Aga Khan Hospital', notes: 'Malaria negative. Viral fever. Paracetamol prescribed.' },
  ];

  const getAge = (dob: string) => {
    const birth = new Date(dob);
    const now = new Date();
    const years = now.getFullYear() - birth.getFullYear();
    const months = now.getMonth() - birth.getMonth();
    if (months < 0) return `${years - 1}y ${12 + months}m`;
    return `${years}y ${months}m`;
  };

  const getVaxStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#4CAF50';
      case 'due': return '#FF9800';
      case 'overdue': return '#F44336';
      default: return '#999';
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{child.name}</Text>
          <Text style={styles.headerSubtitle}>{getAge(child.date_of_birth)} · {child.gender}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Quick Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Heart size={16} color="#F44336" />
          <Text style={styles.statValue}>{child.blood_group}</Text>
          <Text style={styles.statLabel}>Blood</Text>
        </View>
        <View style={styles.statCard}>
          <Weight size={16} color="#FF9800" />
          <Text style={styles.statValue}>{growthRecords[0]?.weight_kg}kg</Text>
          <Text style={styles.statLabel}>Weight</Text>
        </View>
        <View style={styles.statCard}>
          <Ruler size={16} color="#2196F3" />
          <Text style={styles.statValue}>{growthRecords[0]?.height_cm}cm</Text>
          <Text style={styles.statLabel}>Height</Text>
        </View>
        <View style={styles.statCard}>
          <Syringe size={16} color="#4CAF50" />
          <Text style={styles.statValue}>{vaccinations.filter((v: any) => v.status === 'completed').length}/{vaccinations.length}</Text>
          <Text style={styles.statLabel}>Vaccines</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {(['overview', 'vaccinations', 'growth', 'visits'] as const).map((tab: any) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {activeTab === 'overview' && (
          <View style={styles.overviewSection}>
            {/* Allergies */}
            {child.allergies.length > 0 && (
              <View style={styles.alertCard}>
                <AlertCircle size={18} color="#F44336" />
                <View style={styles.alertContent}>
                  <Text style={styles.alertTitle}>Allergies</Text>
                  <Text style={styles.alertText}>{child.allergies.join(', ')}</Text>
                </View>
              </View>
            )}

            {/* Recent Visit */}
            <Text style={styles.sectionTitle}>Recent Visit</Text>
            <View style={styles.visitCard}>
              <View style={styles.visitHeader}>
                <Calendar size={14} color="#666" />
                <Text style={styles.visitDate}>{new Date(visits[0].date).toLocaleDateString()}</Text>
              </View>
              <Text style={styles.visitType}>{visits[0].type}</Text>
              <Text style={styles.visitDoctor}>{visits[0].doctor} · {visits[0].facility}</Text>
              <Text style={styles.visitNotes}>{visits[0].notes}</Text>
            </View>

            {/* Upcoming Vaccination */}
            <Text style={styles.sectionTitle}>Upcoming</Text>
            {vaccinations.filter((v: any) => v.status !== 'completed').slice(0, 2).map((vax: any) => (
              <View key={vax.name + vax.dose} style={styles.upcomingCard}>
                <Syringe size={16} color={getVaxStatusColor(vax.status)} />
                <View style={styles.upcomingInfo}>
                  <Text style={styles.upcomingName}>{vax.name} (Dose {vax.dose}/{vax.total_doses})</Text>
                  <Text style={[styles.upcomingStatus, { color: getVaxStatusColor(vax.status) }]}>
                    {vax.status.toUpperCase()}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {activeTab === 'vaccinations' && (
          <View style={styles.vaxSection}>
            {vaccinations.map((vax, index) => {
              const color = getVaxStatusColor(vax.status);
              const isCompleted = vax.status === 'completed';

              return (
                <View key={index} style={styles.vaxCard}>
                  <View style={[styles.vaxIcon, { backgroundColor: color + '15' }]}>
                    {isCompleted ? <CheckCircle2 size={18} color={color} /> : <Clock size={18} color={color} />}
                  </View>
                  <View style={styles.vaxInfo}>
                    <Text style={styles.vaxName}>{vax.name}</Text>
                    <Text style={styles.vaxDose}>Dose {vax.dose} of {vax.total_doses}</Text>
                    {isCompleted && (
                      <Text style={styles.vaxDate}>
                        Administered: {new Date(vax.administered_at).toLocaleDateString()}
                      </Text>
                    )}
                  </View>
                  <View style={[styles.vaxStatusBadge, { backgroundColor: color + '15' }]}>
                    <Text style={[styles.vaxStatusText, { color }]}>{vax.status}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {activeTab === 'growth' && (
          <View style={styles.growthSection}>
            {/* Growth Chart Placeholder */}
            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>Weight Trend (kg)</Text>
              <View style={styles.chartBars}>
                {growthRecords.map((record, i) => (
                  <View key={i} style={styles.chartBarContainer}>
                    <View style={[styles.chartBar, {
                      height: record.weight_kg * 4,
                      backgroundColor: '#2196F3'
                    }]} />
                    <Text style={styles.chartLabel}>{record.weight_kg}kg</Text>
                    <Text style={styles.chartDate}>
                      {new Date(record.date).toLocaleDateString(undefined, { month: 'short', year: '2-digit' })}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>Height Trend (cm)</Text>
              <View style={styles.chartBars}>
                {growthRecords.map((record, i) => (
                  <View key={i} style={styles.chartBarContainer}>
                    <View style={[styles.chartBar, {
                      height: record.height_cm * 0.8,
                      backgroundColor: '#4CAF50'
                    }]} />
                    <Text style={styles.chartLabel}>{record.height_cm}cm</Text>
                    <Text style={styles.chartDate}>
                      {new Date(record.date).toLocaleDateString(undefined, { month: 'short', year: '2-digit' })}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Growth Records Table */}
            <Text style={styles.sectionTitle}>Growth Records</Text>
            {growthRecords.map((record, i) => (
              <View key={i} style={styles.growthRow}>
                <Text style={styles.growthDate}>{new Date(record.date).toLocaleDateString()}</Text>
                <Text style={styles.growthValue}>{record.weight_kg}kg</Text>
                <Text style={styles.growthValue}>{record.height_cm}cm</Text>
                {record.head_circumference_cm && (
                  <Text style={styles.growthValue}>{record.head_circumference_cm}cm head</Text>
                )}
              </View>
            ))}
          </View>
        )}

        {activeTab === 'visits' && (
          <View style={styles.visitsSection}>
            {visits.map((visit, i) => (
              <View key={i} style={styles.visitHistoryCard}>
                <View style={styles.visitHistoryHeader}>
                  <Calendar size={14} color="#666" />
                  <Text style={styles.visitHistoryDate}>{new Date(visit.date).toLocaleDateString()}</Text>
                  <View style={[styles.visitTypeBadge, { backgroundColor: '#E3F2FD' }]}>
                    <Text style={[styles.visitTypeText, { color: '#2196F3' }]}>{visit.type}</Text>
                  </View>
                </View>
                <Text style={styles.visitHistoryDoctor}>{visit.doctor}</Text>
                <Text style={styles.visitHistoryFacility}>{visit.facility}</Text>
                <Text style={styles.visitHistoryNotes}>{visit.notes}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12
  },
  backButton: { width: 40, height: 40, justifyContent: 'center' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a1a' },
  headerSubtitle: { fontSize: 12, color: '#888', marginTop: 2 },
  statsRow: {
    flexDirection: 'row', paddingHorizontal: 12, gap: 8, marginBottom: 12
  },
  statCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 12,
    padding: 12, alignItems: 'center'
  },
  statValue: { fontSize: 16, fontWeight: '700', color: '#1a1a1a', marginTop: 4 },
  statLabel: { fontSize: 10, color: '#888', marginTop: 2 },
  tabBar: {
    flexDirection: 'row', paddingHorizontal: 16,
    marginBottom: 12, gap: 6
  },
  tab: {
    flex: 1, paddingVertical: 8, borderRadius: 8,
    backgroundColor: '#E8E8E8', alignItems: 'center'
  },
  tabActive: { backgroundColor: Colors.primary },
  tabText: { fontSize: 11, color: '#666', fontWeight: '500' },
  tabTextActive: { color: '#fff' },
  overviewSection: { paddingHorizontal: 16 },
  alertCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#FFEBEE', borderRadius: 12,
    padding: 14, marginBottom: 12
  },
  alertContent: { flex: 1 },
  alertTitle: { fontSize: 13, fontWeight: '600', color: '#C62828' },
  alertText: { fontSize: 12, color: '#5D4037', marginTop: 2 },
  sectionTitle: {
    fontSize: 14, fontWeight: '600', color: '#1a1a1a',
    marginTop: 16, marginBottom: 8
  },
  visitCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 14
  },
  visitHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  visitDate: { fontSize: 12, color: '#888' },
  visitType: { fontSize: 14, fontWeight: '600', color: '#1a1a1a' },
  visitDoctor: { fontSize: 12, color: '#666', marginTop: 2 },
  visitNotes: { fontSize: 11, color: '#888', marginTop: 4, fontStyle: 'italic' },
  upcomingCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#fff', borderRadius: 12,
    padding: 12, marginBottom: 8
  },
  upcomingInfo: { flex: 1 },
  upcomingName: { fontSize: 13, fontWeight: '600', color: '#1a1a1a' },
  upcomingStatus: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  vaxSection: { paddingHorizontal: 16 },
  vaxCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 12,
    padding: 14, marginBottom: 8
  },
  vaxIcon: {
    width: 36, height: 36, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center', marginRight: 10
  },
  vaxInfo: { flex: 1 },
  vaxName: { fontSize: 14, fontWeight: '600', color: '#1a1a1a' },
  vaxDose: { fontSize: 11, color: '#888', marginTop: 1 },
  vaxDate: { fontSize: 11, color: '#4CAF50', marginTop: 2 },
  vaxStatusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  vaxStatusText: { fontSize: 10, fontWeight: '600', textTransform: 'capitalize' },
  growthSection: { paddingHorizontal: 16 },
  chartCard: {
    backgroundColor: '#fff', borderRadius: 12,
    padding: 14, marginBottom: 12
  },
  chartTitle: { fontSize: 13, fontWeight: '600', color: '#1a1a1a', marginBottom: 12 },
  chartBars: {
    flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around',
    height: 120, paddingHorizontal: 4
  },
  chartBarContainer: { alignItems: 'center', flex: 1 },
  chartBar: {
    width: 24, borderRadius: 4, minHeight: 20
  },
  chartLabel: { fontSize: 10, color: '#666', marginTop: 4 },
  chartDate: { fontSize: 9, color: '#999', marginTop: 2 },
  growthRow: {
    flexDirection: 'row', backgroundColor: '#fff',
    borderRadius: 10, padding: 12, marginBottom: 6,
    justifyContent: 'space-between'
  },
  growthDate: { fontSize: 12, color: '#666', flex: 1 },
  growthValue: { fontSize: 12, color: '#1a1a1a', fontWeight: '600', width: 70, textAlign: 'center' },
  visitsSection: { paddingHorizontal: 16 },
  visitHistoryCard: {
    backgroundColor: '#fff', borderRadius: 12,
    padding: 14, marginBottom: 8
  },
  visitHistoryHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6
  },
  visitHistoryDate: { fontSize: 12, color: '#888', flex: 1 },
  visitTypeBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  visitTypeText: { fontSize: 10, fontWeight: '600' },
  visitHistoryDoctor: { fontSize: 14, fontWeight: '600', color: '#1a1a1a' },
  visitHistoryFacility: { fontSize: 12, color: '#666', marginTop: 1 },
  visitHistoryNotes: { fontSize: 11, color: '#888', marginTop: 4, fontStyle: 'italic' },
  bottomPadding: { height: 32 }
});
