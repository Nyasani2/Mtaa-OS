import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CountryCode, CountryConfig } from '../types';
import { useTaxPayments } from '../hooks';

type FilterStatus = 'all' | 'paid' | 'pending' | 'overdue';

export default function TaxPaymentsScreen({ country, config }: { country: CountryCode; config: CountryConfig }) {
  const [filter, setFilter] = useState<FilterStatus>('all');
  const statusParam = filter === 'all' ? undefined : filter;
  const { data, loading, error, refresh } = useTaxPayments(country, statusParam);

  const filters: { key: FilterStatus; label: string; color: string }[] = [
    { key: 'all', label: 'All', color: '#6B7280' },
    { key: 'paid', label: 'Paid', color: '#059669' },
    { key: 'pending', label: 'Pending', color: '#D97706' },
    { key: 'overdue', label: 'Overdue', color: '#DC2626' },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ backgroundColor: '#fff', paddingVertical: 10, paddingHorizontal: 16 }}>
        {filters.map(f => (
          <TouchableOpacity
            key={f.key}
            onPress={() => setFilter(f.key)}
            style={{ paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, marginRight: 8, backgroundColor: filter === f.key ? f.color + '20' : '#F3F4F6' }}
          >
            <Text style={{ fontSize: 12, fontWeight: '600', color: filter === f.key ? f.color : '#6B7280' }}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} />}>
        {loading && <ActivityIndicator style={{ marginTop: 40 }} size="large" color="#3B82F6" />}
        {error && <Text style={{ color: '#EF4444', textAlign: 'center', marginTop: 40 }}>{error}</Text>}

        {data.map((payment: any) => (
          <View key={payment.id} style={{ backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{
                  width: 36, height: 36, borderRadius: 18,
                  backgroundColor: payment.status === 'paid' ? '#D1FAE5' : payment.status === 'overdue' ? '#FEE2E2' : '#FEF3C7',
                  justifyContent: 'center', alignItems: 'center'
                }}>
                  <Ionicons
                    name={payment.status === 'paid' ? 'checkmark' : payment.status === 'overdue' ? 'alert' : 'time'}
                    size={18}
                    color={payment.status === 'paid' ? '#059669' : payment.status === 'overdue' ? '#DC2626' : '#D97706'}
                  />
                </View>
                <View style={{ marginLeft: 10 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151' }}>{payment.tax_type}</Text>
                  <Text style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>Due: {new Date(payment.due_date).toLocaleDateString()}</Text>
                </View>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: '#111827' }}>{config.currency} {payment.amount.toLocaleString()}</Text>
                <View style={{
                  backgroundColor: payment.status === 'paid' ? '#D1FAE5' : payment.status === 'overdue' ? '#FEE2E2' : '#FEF3C7',
                  paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginTop: 4
                }}>
                  <Text style={{
                    fontSize: 11, fontWeight: '600',
                    color: payment.status === 'paid' ? '#059669' : payment.status === 'overdue' ? '#DC2626' : '#D97706',
                    textTransform: 'capitalize'
                  }}>{payment.status}</Text>
                </View>
              </View>
            </View>
            {payment.paid_at && (
              <Text style={{ fontSize: 11, color: '#059669', marginTop: 8 }}>Paid on {new Date(payment.paid_at).toLocaleDateString()}</Text>
            )}
          </View>
        ))}
        {data.length === 0 && !loading && <Text style={{ fontSize: 14, color: '#9CA3AF', textAlign: 'center', paddingVertical: 40 }}>No payments found</Text>}
      </ScrollView>
    </View>
  );
}
