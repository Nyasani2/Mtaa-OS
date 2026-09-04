import React, { useState, useEffect, useCallback } from 'react';

import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';

interface CountryConfig {
  id: string;
  country_code: string;
  country_name: string;
  currency: string;
  central_bank_name: string;
  regulatory_body: string;
  status: string;
}

interface TreasuryOfficer {
  id: string;
  full_name: string;
  role: string;
  department: string;
  country: string;
  status: string;
}

export default function CentralBankView() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [countries, setCountries] = useState<CountryConfig[]>([]);
  const [officers, setOfficers] = useState<TreasuryOfficer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<string>('all');

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: configs } = await supabase
        .from('treasury_country_config')
        .select('*')
        .order('country_name', { ascending: true });
      if (configs) setCountries(configs);

      let query = supabase.from('treasury_officers').select('*');
      if (selectedCountry !== 'all') {
        query = query.eq('country', selectedCountry);
      }
      const { data: offs } = await query.order('full_name', { ascending: true });
      if (offs) setOfficers(offs);
    } catch (err) {
      console.error('Central bank error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, selectedCountry]);

  useEffect(() => { loadData(); }, [loadData]);
  const onRefresh = () => { setRefreshing(true); loadData(); };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#00d4ff" />
        <Text style={styles.loadingText}>Loading Central Bank...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00d4ff" />}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Central Bank</Text>
        <Text style={styles.headerSub}>African Government Treasury Oversight</Text>
      </View>

      {/* Country Selector */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.countryScroll}>
        <TouchableOpacity
          style={[styles.countryBtn, selectedCountry === 'all' && styles.countryBtnActive]}
          onPress={() => setSelectedCountry('all')}
        >
          <Text style={[styles.countryText, selectedCountry === 'all' && styles.countryTextActive]}>All Countries</Text>
        </TouchableOpacity>
        {countries.map((c: any) => (
          <TouchableOpacity
            key={c.id}
            style={[styles.countryBtn, selectedCountry === c.country_code && styles.countryBtnActive]}
            onPress={() => setSelectedCountry(c.country_code)}
          >
            <Text style={[styles.countryText, selectedCountry === c.country_code && styles.countryTextActive]}>
              {c.country_name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Countries */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Government Configurations</Text>
        {countries.length === 0 ? (
          <Text style={styles.emptyText}>No countries configured</Text>
        ) : (
          countries.map((country: any) => (
            <View key={country.id} style={styles.countryCard}>
              <View style={styles.countryHeader}>
                <View style={[styles.flag, { backgroundColor: getCountryColor(country.country_code) }]}>
                  <Text style={styles.flagText}>{country.country_code}</Text>
                </View>
                <View style={styles.countryInfo}>
                  <Text style={styles.countryName}>{country.country_name}</Text>
                  <Text style={styles.countryBank}>{country.central_bank_name}</Text>
                </View>
                <View style={[styles.countryStatus, country.status === 'active' ? styles.statusActive : styles.statusInactive]}>
                  <Text style={styles.statusText}>{country.status}</Text>
                </View>
              </View>
              <View style={styles.countryDetails}>
                <Detail label="Currency" value={country.currency} />
                <Detail label="Regulator" value={country.regulatory_body} />
              </View>
            </View>
          ))
        )}
      </View>

      {/* Treasury Officers */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Treasury Officers</Text>
        {officers.length === 0 ? (
          <Text style={styles.emptyText}>No officers found</Text>
        ) : (
          officers.map((officer: any) => (
            <View key={officer.id} style={styles.officerCard}>
              <View style={styles.officerAvatar}>
                <Text style={styles.officerInitial}>{officer.full_name.charAt(0)}</Text>
              </View>
              <View style={styles.officerInfo}>
                <Text style={styles.officerName}>{officer.full_name}</Text>
                <Text style={styles.officerRole}>{officer.role} · {officer.department}</Text>
                <Text style={styles.officerCountry}>{officer.country}</Text>
              </View>
              <View style={[styles.officerStatus, officer.status === 'active' ? styles.statusActive : styles.statusInactive]}>
                <Text style={styles.statusText}>{officer.status}</Text>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailBox}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

function getCountryColor(code: string): string {
  const colors: Record<string, string> = {
    KE: '#00cc66',
    NG: '#00d4ff',
    ZA: '#ffaa00',
    GH: '#ff4444',
    TZ: '#8855ff',
    UG: '#ff6600',
    RW: '#3366ff',
  };
  return colors[code] || '#888';
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  loadingText: { color: '#fff', fontSize: 16, marginTop: 16 },
  header: { padding: 20, paddingTop: 60, backgroundColor: '#111', borderBottomWidth: 1, borderBottomColor: '#222' },
  backBtn: { marginBottom: 12 },
  headerTitle: { color: '#fff', fontSize: 26, fontWeight: 'bold' },
  headerSub: { color: '#888', fontSize: 14, marginTop: 4 },
  countryScroll: { paddingHorizontal: 16, paddingVertical: 12 },
  countryBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#1a1a1a', marginRight: 8, borderWidth: 1, borderColor: '#333' },
  countryBtnActive: { backgroundColor: '#00d4ff22', borderColor: '#00d4ff' },
  countryText: { color: '#888', fontSize: 13 },
  countryTextActive: { color: '#00d4ff', fontWeight: '600' },
  section: { padding: 16, marginBottom: 8 },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: '600', marginBottom: 12 },
  emptyText: { color: '#666', fontSize: 14, fontStyle: 'italic' },
  countryCard: { backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16, marginBottom: 12 },
  countryHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  flag: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  flagText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  countryInfo: { flex: 1 },
  countryName: { color: '#fff', fontSize: 16, fontWeight: '600' },
  countryBank: { color: '#888', fontSize: 12, marginTop: 2 },
  countryStatus: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  statusActive: { backgroundColor: '#00cc6622' },
  statusInactive: { backgroundColor: '#ff444422' },
  statusText: { fontSize: 10, fontWeight: '600' },
  countryDetails: { flexDirection: 'row', justifyContent: 'space-around', paddingTop: 12, borderTopWidth: 1, borderTopColor: '#222' },
  detailBox: { alignItems: 'center' },
  detailLabel: { color: '#888', fontSize: 11 },
  detailValue: { color: '#fff', fontSize: 13, fontWeight: '500', marginTop: 2 },
  officerCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a1a', borderRadius: 12, padding: 14, marginBottom: 10 },
  officerAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#00d4ff', justifyContent: 'center', alignItems: 'center' },
  officerInitial: { color: '#000', fontSize: 18, fontWeight: 'bold' },
  officerInfo: { flex: 1, marginLeft: 12 },
  officerName: { color: '#fff', fontSize: 15, fontWeight: '600' },
  officerRole: { color: '#888', fontSize: 12, marginTop: 2 },
  officerCountry: { color: '#666', fontSize: 11, marginTop: 2 },
  officerStatus: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
});
