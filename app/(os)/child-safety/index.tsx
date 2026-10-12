// @ts-nocheck
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';

export default function ChildSafetyHub() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Child Safety</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.heroBanner}>
          <Ionicons name="shield-checkmark" size={48} color="#fff" />
          <Text style={styles.heroTitle}>MTAA Child Safety Net</Text>
          <Text style={styles.heroSub}>Protecting every child, registered or not.</Text>
        </View>

        <View style={styles.grid}>
          {/* 1. Scan Found Child */}
          <TouchableOpacity 
            style={[styles.card, { borderLeftColor: '#10B981' }]} 
            onPress={() => router.push('/(os)/child-safety/scan')}
          >
            <View style={[styles.iconBox, { backgroundColor: '#10B98120' }]}>
              <Ionicons name="scan" size={28} color="#10B981" />
            </View>
            <Text style={styles.cardTitle}>Scan Found Child</Text>
            <Text style={styles.cardDesc}>Scan QR or Biometric to identify and contact parents.</Text>
          </TouchableOpacity>

          {/* 2. Report Missing Child */}
          <TouchableOpacity 
            style={[styles.card, { borderLeftColor: '#EF4444' }]} 
            onPress={() => router.push('/(os)/child-safety/report')}
          >
            <View style={[styles.iconBox, { backgroundColor: '#EF444420' }]}>
              <Ionicons name="alert-circle" size={28} color="#EF4444" />
            </View>
            <Text style={styles.cardTitle}>Report Missing Child</Text>
            <Text style={styles.cardDesc}>Upload photo and details to alert the MTAA community.</Text>
          </TouchableOpacity>

          {/* 3. Search Missing Children */}
          <TouchableOpacity 
            style={[styles.card, { borderLeftColor: '#3B82F6' }]} 
            onPress={() => router.push('/(os)/child-safety/search')}
          >
            <View style={[styles.iconBox, { backgroundColor: '#3B82F620' }]}>
              <Ionicons name="search" size={28} color="#3B82F6" />
            </View>
            <Text style={styles.cardTitle}>Search Missing Children</Text>
            <Text style={styles.cardDesc}>Browse active reports. See who has your child.</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color="#94A3B8" />
          <Text style={styles.infoText}>
            If a child is not registered on MTAA, scanning them will allow you to securely report them as "Found" so their parents can locate them.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { padding: 8 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  scrollContent: { padding: 16 },
  heroBanner: { backgroundColor: '#1E293B', borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 24, borderWidth: 1, borderColor: '#334155' },
  heroTitle: { color: '#fff', fontSize: 20, fontWeight: '800', marginTop: 12 },
  heroSub: { color: '#94A3B8', fontSize: 14, textAlign: 'center', marginTop: 4 },
  grid: { gap: 16 },
  card: { backgroundColor: '#1E293B', borderRadius: 16, padding: 20, flexDirection: 'row', alignItems: 'flex-start', borderWidth: 1, borderColor: '#334155', borderLeftWidth: 4 },
  iconBox: { width: 56, height: 56, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  cardTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 4 },
  cardDesc: { color: '#94A3B8', fontSize: 13, lineHeight: 18 },
  infoBox: { flexDirection: 'row', marginTop: 24, padding: 16, backgroundColor: '#1E293B', borderRadius: 12, borderWidth: 1, borderColor: '#334155' },
  infoText: { color: '#94A3B8', fontSize: 13, marginLeft: 12, flex: 1, lineHeight: 18 },
});
