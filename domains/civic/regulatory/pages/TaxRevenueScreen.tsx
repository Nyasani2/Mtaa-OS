import React from 'react';
import { View, Text, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CountryCode, CountryConfig } from '../types';
import { useTaxRevenue } from '../hooks';

export default function TaxRevenueScreen({ country, config }: { country: CountryCode; config: CountryConfig }) {
  const { data, loading, error, refresh } = useTaxRevenue(country);

  if (loading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color="#3B82F6" /></View>;
  if (error) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}><Ionicons name="warning" size={40} color="#EF4444" /><Text style={{ marginTop: 12, color: '#EF4444' }}>{error}</Text></View>;

  const total = data.reduce((sum, t) => sum + t.amount, 0);
  const target = data.reduce((sum, t) => sum + t.target, 0);
  const rate = target > 0 ? ((total / target) * 100).toFixed(1) : '0';

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#F9FAFB' }} contentContainerStyle={{ padding: 16 }}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} />}>

      <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, alignItems: 'center' }}>
        <Text style={{ fontSize: 14, color: '#6B7280' }}>Total Revenue ({config.taxAuthority})</Text>
        <Text style={{ fontSize: 36, fontWeight: '800', color: '#059669', marginTop: 8 }}>{config.currency} {total.toLocaleString()}</Text>
        <View style={{ flexDirection: 'row', marginTop: 12, width: '100%' }}>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#3B82F6' }}>{config.currency} {target.toLocaleString()}</Text>
            <Text style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>Target</Text>
          </View>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#D97706' }}>{rate}%</Text>
            <Text style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>Achievement</Text>
          </View>
        </View>
      </View>

      <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 12 }}>Revenue by Type</Text>
      {data.map((item: any) => (
        <View key={item.id} style={{ backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 8 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#DBEAFE', justifyContent: 'center', alignItems: 'center' }}>
                <Ionicons name="cash" size={18} color="#3B82F6" />
              </View>
              <View style={{ marginLeft: 10 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', textTransform: 'capitalize' }}>{item.tax_type}</Text>
                <Text style={{ fontSize: 11, color: '#9CA3AF' }}>{item.period}</Text>
              </View>
            </View>
            <Text style={{ fontSize: 15, fontWeight: '700', color: '#059669' }}>{config.currency} {item.amount.toLocaleString()}</Text>
          </View>
          <View style={{ height: 6, backgroundColor: '#F3F4F6', borderRadius: 3, marginTop: 10 }}>
            <View style={{ width: `${Math.min((item.amount / item.target) * 100, 100)}%`, height: 6, backgroundColor: '#3B82F6', borderRadius: 3 }} />
          </View>
          <Text style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>Target: {config.currency} {item.target.toLocaleString()}</Text>
        </View>
      ))}
      {data.length === 0 && <Text style={{ fontSize: 14, color: '#9CA3AF', textAlign: 'center', paddingVertical: 40 }}>No revenue data available</Text>}
    </ScrollView>
  );
}
