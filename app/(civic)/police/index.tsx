import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const POLICE_SERVICES = [
  { id: 'report', name: 'Report Incident', icon: 'alert-circle', color: '#DC2626', desc: 'File a police report' },
  { id: 'status', name: 'Case Status', icon: 'search', color: '#3B82F6', desc: 'Track your cases' },
  { id: 'wanted', name: 'Wanted Persons', icon: 'people', color: '#F59E0B', desc: 'View wanted list' },
  { id: 'permits', name: 'Permits', icon: 'document-text', color: '#10B981', desc: 'Apply for permits' },
  { id: 'clearance', name: 'Clearance', icon: 'shield-checkmark', color: '#8B5CF6', desc: 'Police clearance cert' },
  { id: 'emergency', name: 'Emergency', icon: 'call', color: '#EF4444', desc: '999 / 112 / 911' },
];

export default function PoliceScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [caseNumber, setCaseNumber] = useState('');

  const handleService = (service: string) => {
    switch (service) {
      case 'report':
        Alert.alert('Report Incident', 'Incident reporting form will open');
        break;
      case 'status':
        if (!caseNumber.trim()) {
          Alert.alert('Enter Case Number', 'Please enter your case number to track');
          return;
        }
        Alert.alert('Case Status', `Checking case: ${caseNumber}`);
        break;
      case 'emergency':
        Alert.alert('Emergency Numbers', '999 - Police\n112 - General Emergency\n911 - Alternative');
        Alert.alert('Emergency Numbers', '999 - Police\n112 - General Emergency\n911 - Alternative');
        Alert.alert('Emergency Numbers', '999 - Police\n112 - General Emergency\n911 - Alternative');
        break;
      default:
        Alert.alert('Coming Soon', `${service} module under development`);
    }
  };

  return (
    <LinearGradient colors={['#0F172A', '#1E293B']} style={styles.container}>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.title}>Police Services</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Case Status Quick Check */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Check Case Status</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                placeholder="Enter case number"
                placeholderTextColor="#64748B"
                value={caseNumber}
                onChangeText={setCaseNumber}
              />
              <TouchableOpacity style={styles.checkBtn} onPress={() => handleService('status')}>
                <Ionicons name="search" size={20} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Services Grid */}
          <Text style={styles.sectionTitle}>Services</Text>
          <View style={styles.servicesGrid}>
            {POLICE_SERVICES.map(service => (
              <TouchableOpacity
                key={service.id}
                style={styles.serviceCard}
                onPress={() => handleService(service.id)}
              >
                <View style={[styles.serviceIcon, { backgroundColor: service.color + '20' }]}>
                  <Ionicons name={service.icon as any} size={26} color={service.color} />
                </View>
                <Text style={styles.serviceName}>{service.name}</Text>
                <Text style={styles.serviceDesc}>{service.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Emergency Banner */}
          <TouchableOpacity style={styles.emergencyBanner} onPress={() => handleService('emergency')}>
            <Ionicons name="call" size={24} color="#FFF" />
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.emergencyTitle}>Emergency Hotline</Text>
              <Text style={styles.emergencyNumber}>999 / 112 / 911</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#FFF" style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>
        </ScrollView>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  backBtn: { padding: 8, marginLeft: -8 },
  title: { fontSize: 24, fontWeight: '800', color: '#FFF' },
  content: { paddingHorizontal: 16, paddingBottom: 32 },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#FFF', marginBottom: 12 },
  inputRow: { flexDirection: 'row', gap: 8 },
  input: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#FFF',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  checkBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  serviceCard: {
    width: '47%',
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  serviceIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  serviceName: { fontSize: 14, fontWeight: '700', color: '#FFF', marginBottom: 4 },
  serviceDesc: { fontSize: 12, color: '#94A3B8' },
  emergencyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DC2626',
    borderRadius: 16,
    padding: 16,
  },
  emergencyTitle: { fontSize: 14, fontWeight: '700', color: '#FFF' },
  emergencyNumber: { fontSize: 18, fontWeight: '800', color: '#FFF', marginTop: 2 },
});
