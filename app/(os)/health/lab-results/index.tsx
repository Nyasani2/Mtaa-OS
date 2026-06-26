import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  RefreshControl, ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  FlaskConical, TrendingUp, TrendingDown, Minus,
  ChevronRight, Calendar, AlertCircle, CheckCircle2,
  FileText, Filter
} from 'lucide-react-native';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { Colors } from '@/constants/Colors';

interface LabResult {
  id: string;
  test_name: string;
  test_code: string;
  category: string;
  result_value: string;
  result_unit: string;
  reference_range: string;
  is_abnormal: boolean;
  status: string;
  interpreted_by: string;
  interpreted_at: string;
  facility: string;
  trend?: 'up' | 'down' | 'stable';
  history?: { date: string; value: string }[];
}

export default function LabResultsScreen() {
  const router = useRouter();
  const { profile } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [loading, setLoading] = useState(false);

  const labResults: LabResult[] = [
    {
      id: '1', test_name: 'HbA1c', test_code: 'HBA1C', category: 'biochemistry',
      result_value: '7.2', result_unit: '%', reference_range: '<5.7%',
      is_abnormal: true, status: 'completed',
      interpreted_by: 'Dr. James Omondi', interpreted_at: '2025-06-05T08:00:00Z',
      facility: 'Lancet Laboratories', trend: 'up',
      history: [
        { date: '2025-03-05', value: '6.8' },
        { date: '2025-01-05', value: '6.5' },
        { date: '2024-10-05', value: '6.2' },
      ]
    },
    {
      id: '2', test_name: 'Fasting Blood Glucose', test_code: 'FBG', category: 'biochemistry',
      result_value: '126', result_unit: 'mg/dL', reference_range: '70-100 mg/dL',
      is_abnormal: true, status: 'completed',
      interpreted_by: 'Dr. James Omondi', interpreted_at: '2025-06-05T08:00:00Z',
      facility: 'Lancet Laboratories', trend: 'stable'
    },
    {
      id: '3', test_name: 'Total Cholesterol', test_code: 'TCHOL', category: 'biochemistry',
      result_value: '195', result_unit: 'mg/dL', reference_range: '<200 mg/dL',
      is_abnormal: false, status: 'completed',
      interpreted_by: 'Dr. James Omondi', interpreted_at: '2025-06-05T08:00:00Z',
      facility: 'Lancet Laboratories', trend: 'down'
    },
    {
      id: '4', test_name: 'Complete Blood Count', test_code: 'CBC', category: 'hematology',
      result_value: 'Normal', result_unit: '', reference_range: 'Normal',
      is_abnormal: false, status: 'completed',
      interpreted_by: 'Dr. James Omondi', interpreted_at: '2025-05-20T10:00:00Z',
      facility: 'Nairobi West Hospital', trend: 'stable'
    },
    {
      id: '5', test_name: 'Liver Function Test', test_code: 'LFT', category: 'biochemistry',
      result_value: 'Normal', result_unit: '', reference_range: 'Normal',
      is_abnormal: false, status: 'completed',
      interpreted_by: 'Dr. James Omondi', interpreted_at: '2025-05-20T10:00:00Z',
      facility: 'Nairobi West Hospital', trend: 'stable'
    },
  ];

  const categories = ['all', ...Array.from(new Set(labResults.map(r => r.category)))];

  const filteredResults = activeCategory === 'all'
    ? labResults
    : labResults.filter(r => r.category === activeCategory);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case 'up': return <TrendingUp size={14} color="#F44336" />;
      case 'down': return <TrendingDown size={14} color="#4CAF50" />;
      default: return <Minus size={14} color="#999" />;
    }
  };

  const getTrendColor = (trend?: string, isAbnormal?: boolean) => {
    if (isAbnormal) return '#F44336';
    switch (trend) {
      case 'up': return '#FF9800';
      case 'down': return '#4CAF50';
      default: return '#4CAF50';
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Lab Results</Text>
          <Text style={styles.subtitle}>{labResults.length} tests on record</Text>
        </View>
        <TouchableOpacity style={styles.iconButton}>
          <Filter size={20} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{labResults.filter(r => r.is_abnormal).length}</Text>
          <Text style={styles.summaryLabel}>Abnormal</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{labResults.filter(r => !r.is_abnormal).length}</Text>
          <Text style={styles.summaryLabel}>Normal</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{labResults.filter(r => r.status === 'pending').length}</Text>
          <Text style={styles.summaryLabel}>Pending</Text>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
        <View style={styles.categoryRow}>
          {categories.map(cat => (
            <TouchableOpacity
              key={cat}
              style={[styles.categoryChip, activeCategory === cat && styles.categoryChipActive]}
              onPress={() => setActiveCategory(cat)}
            >
              <Text style={[styles.categoryText, activeCategory === cat && styles.categoryTextActive]}>
                {cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <ActivityIndicator style={{ marginTop: 40 }} color={Colors.primary} />
        ) : filteredResults.length === 0 ? (
          <View style={styles.emptyState}>
            <FlaskConical size={40} color="#ccc" />
            <Text style={styles.emptyText}>No lab results found</Text>
          </View>
        ) : (
          filteredResults.map(result => (
            <TouchableOpacity
              key={result.id}
              style={styles.resultCard}
              onPress={() => router.push({
                pathname: '/(os)/health/lab-results/detail',
                params: { id: result.id }
              } as any)}
            >
              <View style={styles.resultHeader}>
                <View style={[styles.resultIcon, {
                  backgroundColor: result.is_abnormal ? '#FFEBEE' : '#E8F5E9'
                }]}>
                  {result.is_abnormal ? (
                    <AlertCircle size={18} color="#F44336" />
                  ) : (
                    <CheckCircle2 size={18} color="#4CAF50" />
                  )}
                </View>
                <View style={styles.resultInfo}>
                  <Text style={styles.resultName}>{result.test_name}</Text>
                  <Text style={styles.resultCode}>{result.test_code}</Text>
                </View>
                <View style={styles.trendBox}>
                  {getTrendIcon(result.trend)}
                </View>
              </View>

              <View style={styles.resultBody}>
                <View style={styles.valueRow}>
                  <Text style={[styles.resultValue, {
                    color: getTrendColor(result.trend, result.is_abnormal)
                  }]}>
                    {result.result_value} {result.result_unit}
                  </Text>
                  <View style={styles.rangeBox}>
                    <Text style={styles.rangeText}>Ref: {result.reference_range}</Text>
                  </View>
                </View>

                {result.is_abnormal && (
                  <View style={styles.abnormalBanner}>
                    <AlertCircle size={12} color="#F44336" />
                    <Text style={styles.abnormalText}>Above normal range — follow up recommended</Text>
                  </View>
                )}

                {result.history && result.history.length > 0 && (
                  <View style={styles.trendChart}>
                    <Text style={styles.trendLabel}>Trend (last {result.history.length} tests)</Text>
                    <View style={styles.trendBars}>
                      {result.history.map((h, i) => (
                        <View key={i} style={styles.trendBarContainer}>
                          <View style={[styles.trendBar, {
                            height: Math.max(20, parseFloat(h.value) * 8),
                            backgroundColor: parseFloat(h.value) > 7 ? '#F44336' : '#4CAF50'
                          }]} />
                          <Text style={styles.trendBarLabel}>{h.value}</Text>
                          <Text style={styles.trendBarDate}>
                            {new Date(h.date).toLocaleDateString(undefined, { month: 'short' })}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </View>

              <View style={styles.resultFooter}>
                <View style={styles.footerItem}>
                  <Calendar size={12} color="#888" />
                  <Text style={styles.footerText}>
                    {new Date(result.interpreted_at).toLocaleDateString()}
                  </Text>
                </View>
                <View style={styles.footerItem}>
                  <FileText size={12} color="#888" />
                  <Text style={styles.footerText}>{result.facility}</Text>
                </View>
                <View style={styles.footerItem}>
                  <FlaskConical size={12} color="#888" />
                  <Text style={styles.footerText}>{result.interpreted_by}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
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
  iconButton: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center'
  },
  summaryRow: {
    flexDirection: 'row', paddingHorizontal: 12, gap: 8, marginBottom: 12
  },
  summaryCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 12,
    padding: 12, alignItems: 'center'
  },
  summaryValue: { fontSize: 20, fontWeight: '700', color: Colors.primary },
  summaryLabel: { fontSize: 11, color: '#666', marginTop: 2 },
  categoryScroll: { maxHeight: 48, marginBottom: 8 },
  categoryRow: { flexDirection: 'row', paddingHorizontal: 12, gap: 6 },
  categoryChip: {
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 16, backgroundColor: '#E8E8E8'
  },
  categoryChipActive: { backgroundColor: Colors.primary },
  categoryText: { fontSize: 12, color: '#666', fontWeight: '500' },
  categoryTextActive: { color: '#fff' },
  resultCard: {
    backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 12,
    borderRadius: 16, padding: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 1
  },
  resultHeader: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 10
  },
  resultIcon: {
    width: 36, height: 36, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center', marginRight: 10
  },
  resultInfo: { flex: 1 },
  resultName: { fontSize: 15, fontWeight: '600', color: '#1a1a1a' },
  resultCode: { fontSize: 11, color: '#888', marginTop: 1 },
  trendBox: { padding: 4 },
  resultBody: { marginBottom: 10 },
  valueRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'
  },
  resultValue: { fontSize: 24, fontWeight: '700' },
  rangeBox: {
    backgroundColor: '#f5f5f5', paddingHorizontal: 10,
    paddingVertical: 4, borderRadius: 6
  },
  rangeText: { fontSize: 11, color: '#666' },
  abnormalBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#FFEBEE', borderRadius: 6,
    padding: 8, marginTop: 8
  },
  abnormalText: { fontSize: 11, color: '#C62828', flex: 1 },
  trendChart: { marginTop: 12 },
  trendLabel: { fontSize: 11, color: '#888', marginBottom: 8 },
  trendBars: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 12,
    height: 80, paddingHorizontal: 4
  },
  trendBarContainer: { alignItems: 'center', flex: 1 },
  trendBar: {
    width: 24, borderRadius: 4, minHeight: 20
  },
  trendBarLabel: { fontSize: 10, color: '#666', marginTop: 4 },
  trendBarDate: { fontSize: 9, color: '#999', marginTop: 2 },
  resultFooter: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 12,
    borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 10
  },
  footerItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  footerText: { fontSize: 11, color: '#888' },
  emptyState: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 14, color: '#999', marginTop: 12 },
  bottomPadding: { height: 32 }
});
