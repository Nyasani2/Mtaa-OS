import React, { useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CountryCode, CountryConfig } from '../types';
import { useComplianceReport } from '../hooks';

const PERIODS = ['2026-Q1', '2025-Q4', '2025-Q3', '2025-Q2', '2025-Q1'];

export default function ComplianceScreen({ country, config }: { country: CountryCode; config: CountryConfig }) {
  const [period, setPeriod] = useState('2026-Q1');
  const { data, loading, error, refresh } = useComplianceReport(country, period);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#F9FAFB' }} contentContainerStyle={{ padding: 16 }}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} />}>

      <Text style={{ fontSize: 14, fontWeight: '600', color: '#6B7280', marginBottom: 8 }}>Select Period</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
        {PERIODS.map(p => (
          <Text
            key={p}
            onPress={() => setPeriod(p)}
            style={{
              paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, marginRight: 8,
              backgroundColor: period === p ? '#3B82F6' : '#F3F4F6',
              color: period === p ? '#fff' : '#6B7280',
              fontSize: 13, fontWeight: '600'
            }}
          >
            {p}
          </Text>
        ))}
      </ScrollView>

      {loading && <ActivityIndicator style={{ marginTop: 40 }} size="large" color="#3B82F6" />}
      {error && <Text style={{ color: '#EF4444', textAlign: 'center', marginTop: 40 }}>{error}</Text>}

      {data && (
        <View>
          <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, alignItems: 'center' }}>
            <Text style={{ fontSize: 14, color: '#6B7280' }}>Compliance Rate</Text>
            <Text style={{ fontSize: 40, fontWeight: '800', color: data.tax_collection_rate >= 80 ? '#059669' : data.tax_collection_rate >= 50 ? '#D97706' : '#DC2626', marginTop: 8 }}>
              {data.tax_collection_rate.toFixed(1)}%
            </Text>
            <View style={{ height: 8, backgroundColor: '#F3F4F6', borderRadius: 4, marginTop: 12, width: '100%' }}>
              <View style={{ width: `${Math.min(data.tax_collection_rate, 100)}%`, height: 8, backgroundColor: data.tax_collection_rate >= 80 ? '#059669' : data.tax_collection_rate >= 50 ? '#D97706' : '#DC2626', borderRadius: 4 }} />
            </View>
          </View>

          <View style={{ flexDirection: 'row', marginBottom: 12 }}>
            <View style={{ flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 14, marginRight: 8, alignItems: 'center' }}>
              <Ionicons name="business" size={24} color="#3B82F6" />
              <Text style={{ fontSize: 20, fontWeight: '800', color: '#111827', marginTop: 8 }}>{data.total_businesses.toLocaleString()}</Text>
              <Text style={{ fontSize: 11, color: '#6B7280', marginTop: 4 }}>Total Businesses</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 14, alignItems: 'center' }}>
              <Ionicons name="shield-checkmark" size={24} color="#059669" />
              <Text style={{ fontSize: 20, fontWeight: '800', color: '#111827', marginTop: 8 }}>{data.compliant_businesses.toLocaleString()}</Text>
              <Text style={{ fontSize: 11, color: '#6B7280', marginTop: 4 }}>Compliant</Text>
            </View>
          </View>

          <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16 }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 12 }}>Non-Compliant Businesses</Text>
            <Text style={{ fontSize: 13, color: '#6B7280' }}>
              {(data.total_businesses - data.compliant_businesses).toLocaleString()} businesses out of {data.total_businesses.toLocaleString()} are not meeting their tax obligations in {period}.
            </Text>
            <View style={{ flexDirection: 'row', marginTop: 12, alignItems: 'center' }}>
              <View style={{ flex: 1, height: 8, backgroundColor: '#FEE2E2', borderRadius: 4 }}>
                <View style={{ width: `${((data.total_businesses - data.compliant_businesses) / data.total_businesses) * 100}%`, height: 8, backgroundColor: '#DC2626', borderRadius: 4 }} />
              </View>
              <Text style={{ marginLeft: 10, fontSize: 13, fontWeight: '700', color: '#DC2626' }}>
                {((1 - data.compliant_businesses / data.total_businesses) * 100).toFixed(1)}%
              </Text>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
}
