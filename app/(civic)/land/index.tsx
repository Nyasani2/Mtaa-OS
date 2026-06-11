// app/(civic)/land/index.tsx
// Land Registry — Placeholder for full implementation
// Tables: property_land_parcels, property_titles, property_transfers (from Property SQL)

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function LandRegistryScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const features = [
    { icon: 'search', title: 'Title Search', desc: 'Search property titles by parcel number or owner', color: '#3B82F6' },
    { icon: 'document-text', title: 'Title Transfer', desc: 'Initiate property ownership transfer', color: '#10B981' },
    { icon: 'map', title: 'Parcel Map', desc: 'View land parcels and boundaries', color: '#8B5CF6' },
    { icon: 'git-compare', title: 'Disputes', desc: 'File or track land dispute cases', color: '#EF4444' },
    { icon: 'cash', title: 'Rates & Fees', desc: 'Pay land rates and registration fees', color: '#F59E0B' },
    { icon: 'shield-checkmark', title: 'Verification', desc: 'Verify title authenticity', color: '#06B6D4' },
  ];

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Land Registry</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Search */}
      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color="#94A3B8" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by title number, owner, or location..."
          placeholderTextColor="#94A3B8"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>—</Text>
          <Text style={styles.statLabel}>Registered Parcels</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>—</Text>
          <Text style={styles.statLabel}>Pending Transfers</Text>
        </View>
      </View>

      {/* Features */}
      <Text style={styles.sectionTitle}>Services</Text>
      <View style={styles.featuresGrid}>
        {features.map((f) => (
          <TouchableOpacity key={f.title} style={styles.featureCard}>
            <View style={[styles.featureIcon, { backgroundColor: `${f.color}15` }]}>
              <Ionicons name={f.icon as any} size={24} color={f.color} />
            </View>
            <Text style={styles.featureTitle}>{f.title}</Text>
            <Text style={styles.featureDesc} numberOfLines={2}>{f.desc}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Coming Soon */}
      <View style={styles.comingSoon}>
        <Ionicons name="construct" size={32} color="#94A3B8" />
        <Text style={styles.comingSoonTitle}>Full Land Registry Coming Soon</Text>
        <Text style={styles.comingSoonText}>
          This module will integrate with the Property OS database for complete land management.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#fff',
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#0F172A' },

  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 15, color: '#0F172A' },

  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  statValue: { fontSize: 24, fontWeight: '800', color: '#0F172A' },
  statLabel: { fontSize: 12, color: '#64748B', marginTop: 4, textAlign: 'center' },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    paddingHorizontal: 16,
    marginBottom: 12,
  },

  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
  },
  featureCard: {
    width: '46%',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginHorizontal: '2%',
    marginBottom: 12,
    alignItems: 'center',
  },
  featureIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  featureTitle: { fontSize: 14, fontWeight: '700', color: '#0F172A', textAlign: 'center' },
  featureDesc: { fontSize: 12, color: '#64748B', marginTop: 4, textAlign: 'center', lineHeight: 16 },

  comingSoon: {
    alignItems: 'center',
    paddingVertical: 40,
    marginHorizontal: 16,
  },
  comingSoonTitle: { fontSize: 16, fontWeight: '700', color: '#64748B', marginTop: 12 },
  comingSoonText: { fontSize: 13, color: '#94A3B8', marginTop: 6, textAlign: 'center', paddingHorizontal: 20 },
});
