import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CountryCode, CountryConfig } from '../types';
import { useBusinessRegistrations } from '../hooks';

export default function BusinessLookupScreen({ country, config }: { country: CountryCode; config: CountryConfig }) {
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const { data, loading, error, refresh } = useBusinessRegistrations(country, query);

  const doSearch = () => setQuery(search);

  return (
    <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      <View style={{ backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 }}>
          <Ionicons name="search" size={18} color="#9CA3AF" />
          <TextInput
            placeholder="Search business name..."
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={doSearch}
            style={{ flex: 1, marginLeft: 8, fontSize: 14, color: '#374151' }}
            returnKeyType="search"
          />
        </View>
        <TouchableOpacity onPress={doSearch} style={{ marginLeft: 10, backgroundColor: '#3B82F6', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 }}>
          <Text style={{ color: '#fff', fontWeight: '600', fontSize: 13 }}>Search</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} />}>
        {loading && <ActivityIndicator style={{ marginTop: 40 }} size="large" color="#3B82F6" />}
        {error && <Text style={{ color: '#EF4444', textAlign: 'center', marginTop: 40 }}>{error}</Text>}

        {data.map((biz: any) => (
          <View key={biz.id} style={{ backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#DBEAFE', justifyContent: 'center', alignItems: 'center' }}>
                  <Ionicons name="business" size={20} color="#3B82F6" />
                </View>
                <View style={{ marginLeft: 10, flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: '#111827' }}>{biz.business_name}</Text>
                  <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>Reg: {biz.registration_number}</Text>
                </View>
              </View>
              <View style={{ backgroundColor: biz.status === 'active' ? '#D1FAE5' : biz.status === 'suspended' ? '#FEE2E2' : '#F3F4F6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
                <Text style={{ fontSize: 11, fontWeight: '600', color: biz.status === 'active' ? '#059669' : biz.status === 'suspended' ? '#DC2626' : '#6B7280', textTransform: 'capitalize' }}>{biz.status}</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderColor: '#F3F4F6' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, color: '#9CA3AF' }}>Tax PIN</Text>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151', marginTop: 2 }}>{biz.tax_pin}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, color: '#9CA3AF' }}>Sector</Text>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151', marginTop: 2 }}>{biz.sector}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, color: '#9CA3AF' }}>Turnover</Text>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151', marginTop: 2 }}>{config.currency} {biz.annual_turnover?.toLocaleString()}</Text>
              </View>
            </View>
          </View>
        ))}
        {data.length === 0 && !loading && <Text style={{ fontSize: 14, color: '#9CA3AF', textAlign: 'center', paddingVertical: 40 }}>No businesses found</Text>}
      </ScrollView>
    </View>
  );
}
