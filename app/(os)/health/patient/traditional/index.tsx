import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { useTraditionalMedicine } from '@/lib/health/hooks/useTraditionalMedicine';
import { Leaf, Star, Search, MapPin, Phone, ChevronRight } from 'lucide-react-native';

export default function PatientTraditionalMedicineScreen() {
  const router = useRouter();
  const { healers, remedies, loading, searchHealers, searchRemedies } = useTraditionalMedicine();
  const [tab, setTab] = useState<'healers' | 'remedies'>('healers');
  const [search, setSearch] = useState('');

  const handleSearch = (text: string) => {
    setSearch(text);
    if (tab === 'healers') searchHealers(text); else searchRemedies(text);
  };

  const renderHealer = ({ item }: any) => (
    <TouchableOpacity style={styles.card} onPress={() => router.push(`/(os)/health/patient/traditional/healer/${item.id}` as any)}>
      <View style={styles.cardHeader}>
        <View style={styles.avatar}><Leaf size={24} color="#059669" /></View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle}>{item.full_name}</Text>
          <Text style={styles.cardSub}>{item.practice_type?.replace('_', ' ')} · {item.years_of_experience} years</Text>
          <View style={styles.ratingRow}><Star size={14} color="#F59E0B" fill="#F59E0B" /><Text style={styles.ratingText}>{(item.rating || 0).toFixed(1)} ({item.review_count || 0})</Text></View>
        </View>
        <ChevronRight size={20} color="#D1D5DB" />
      </View>
      <View style={styles.cardFooter}>
        <View style={styles.footerItem}><MapPin size={12} color="#6B7280" /><Text style={styles.footerText}>{item.service_areas?.[0] || 'Local'}</Text></View>
        <View style={styles.footerItem}><Phone size={12} color="#6B7280" /><Text style={styles.footerText}>{item.phone || 'N/A'}</Text></View>
        <Text style={styles.feeText}>${item.consultation_fee || 0}/session</Text>
      </View>
    </TouchableOpacity>
  );

  const renderRemedy = ({ item }: any) => (
    <TouchableOpacity style={styles.card} onPress={() => router.push(`/(os)/health/patient/traditional/remedy/${item.id}` as any)}>
      <View style={styles.cardHeader}>
        <View style={styles.remedyIcon}><Leaf size={20} color="#10B981" /></View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle}>{item.name}</Text>
          <Text style={styles.cardSub}>{item.local_name} · {item.scientific_name}</Text>
          <View style={styles.conditionsRow}>
            {item.conditions_treated?.slice(0, 3).map((c: string, i: number) => (
              <View key={i} style={styles.conditionChip}><Text style={styles.conditionText}>{c}</Text></View>
            ))}
          </View>
        </View>
        <Text style={styles.priceText}>${item.price}</Text>
      </View>
      <View style={styles.cardFooter}>
        <Text style={[styles.approvalText, item.is_approved_by_regulator ? { color: '#10B981' } : { color: '#F59E0B' }]}>{item.is_approved_by_regulator ? 'Regulator Approved' : 'Pending Approval'}</Text>
        <Text style={styles.stockText}>{item.stock_quantity} {item.unit} available</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Traditional Medicine</Text>
        <Text style={styles.headerSub}>Find verified healers & herbal remedies</Text>
      </View>
      <View style={styles.searchRow}>
        <View style={styles.searchBox}><Search size={18} color="#9CA3AF" /><TextInput style={styles.searchInput} placeholder="Search healers or remedies..." value={search} onChangeText={handleSearch} /></View>
      </View>
      <View style={styles.tabRow}>
        <TouchableOpacity style={[styles.tab, tab === 'healers' && styles.tabActive]} onPress={() => setTab('healers')}><Text style={[styles.tabText, tab === 'healers' && styles.tabTextActive]}>Healers</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tab === 'remedies' && styles.tabActive]} onPress={() => setTab('remedies')}><Text style={[styles.tabText, tab === 'remedies' && styles.tabTextActive]}>Remedies</Text></TouchableOpacity>
      </View>
      <FlatList data={tab === 'healers' ? healers : remedies} renderItem={tab === 'healers' ? renderHealer : renderRemedy} keyExtractor={(i: any) => i.id} contentContainerStyle={styles.list} ListEmptyComponent={<Text style={styles.emptyText}>No {tab} found</Text>} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: { backgroundColor: '#059669', padding: 20, paddingTop: 50 },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#fff' },
  headerSub: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  searchRow: { padding: 12 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 15, color: '#1F2937' },
  tabRow: { flexDirection: 'row', paddingHorizontal: 12, gap: 8, marginBottom: 4 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: '#fff', alignItems: 'center' },
  tabActive: { backgroundColor: '#059669' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  tabTextActive: { color: '#fff' },
  list: { padding: 12 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10 },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#ECFDF5', alignItems: 'center', justifyContent: 'center' },
  remedyIcon: { width: 44, height: 44, borderRadius: 10, backgroundColor: '#ECFDF5', alignItems: 'center', justifyContent: 'center' },
  cardInfo: { flex: 1, marginLeft: 12 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#1F2937' },
  cardSub: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 },
  ratingText: { fontSize: 12, color: '#6B7280' },
  cardFooter: { flexDirection: 'row', marginTop: 10, gap: 12 },
  footerItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  footerText: { fontSize: 11, color: '#6B7280' },
  feeText: { fontSize: 13, fontWeight: '700', color: '#0A4DA6', marginLeft: 'auto' },
  priceText: { fontSize: 16, fontWeight: '800', color: '#0A4DA6' },
  conditionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 6 },
  conditionChip: { backgroundColor: '#ECFDF5', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  conditionText: { fontSize: 10, color: '#059669', fontWeight: '600' },
  approvalText: { fontSize: 11, fontWeight: '600' },
  stockText: { fontSize: 11, color: '#6B7280', marginLeft: 'auto' },
  emptyText: { color: '#9CA3AF', textAlign: 'center', padding: 24 },
});
