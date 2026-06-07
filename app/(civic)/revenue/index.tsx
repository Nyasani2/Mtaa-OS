import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const REVENUE_SERVICES = [
  { id: 'tax', name: 'Pay Tax', icon: 'cash', color: '#059669', desc: 'Income, property tax' },
  { id: 'license', name: 'Licenses', icon: 'document-text', color: '#3B82F6', desc: 'Business permits' },
  { id: 'land', name: 'Land Rates', icon: 'map', color: '#F59E0B', desc: 'Property rates' },
  { id: 'parking', name: 'Parking', icon: 'car', color: '#8B5CF6', desc: 'Parking fees' },
  { id: 'business', name: 'Business Reg', icon: 'storefront', color: '#EC4899', desc: 'Register business' },
  { id: 'history', name: 'Payment History', icon: 'time', color: '#6B7280', desc: 'View past payments' },
];

export default function RevenueScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleService = (service: string) => {
    // Revenue module — implement actual navigation when ready
  };

  return (
    <LinearGradient colors={['#0F172A', '#1E293B']} style={styles.container}>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.title}>Revenue Services</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionTitle}>Services</Text>
          <View style={styles.servicesGrid}>
            {REVENUE_SERVICES.map(service => (
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
});

