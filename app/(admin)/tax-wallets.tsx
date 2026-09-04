import { useState } from 'react';
// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';

export default function TaxWalletsScreen() {
  const router = useRouter();
  const [wallets, setWallets] = useState([]);
  const [rates, setRates] = useState([]);

  useEffect(() => { (async () => {
    const [{ data: w }, { data: r }] = await Promise.all([
      supabase.from('government_tax_wallets').select('*').order('country_name'),
      supabase.from('withholding_tax_rates').select('*').eq('is_active', true),
    ]);
    setWallets(w || []);
    setRates(r || []);
  })(); }, []);

  const getRate = (cc) => rates.find(r => r.country_code === cc);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#0f172a', padding: 16 }} contentContainerStyle={{ paddingBottom: 40 }}>
      <TouchableOpacity onPress={() => router.back()}><Text style={{ color: '#60a5fa', fontWeight: '700', marginBottom: 12 }}>← Back</Text></TouchableOpacity>
      <Text style={{ color: '#fff', fontSize: 22, fontWeight: '800', marginBottom: 16 }}>🏛️ Government Tax Wallets</Text>
      <Text style={{ color: '#94a3b8', marginBottom: 16 }}>Withholding tax auto-collected per country. Remit monthly to tax authority.</Text>

      {wallets.map((w) => {
        const r = getRate(w.country_code);
        return (
          <View key={w.country_code} style={{ backgroundColor: '#1e293b', borderRadius: 12, padding: 14, marginBottom: 10 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>{w.country_name} ({w.country_code})</Text>
              <Text style={{ color: '#60a5fa', fontSize: 13, fontWeight: '700' }}>WHT {r?.rate_percent || 0}%</Text>
            </View>
            <Text style={{ color: '#94a3b8', fontSize: 12, marginTop: 2 }}>{r?.tax_authority || 'Tax Authority'}</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
              <View>
                <Text style={{ color: '#94a3b8', fontSize: 11 }}>Current Balance</Text>
                <Text style={{ color: '#34d399', fontSize: 18, fontWeight: '800' }}>{w.currency} {Number(w.balance).toLocaleString()}</Text>
              </View>
              <View>
                <Text style={{ color: '#94a3b8', fontSize: 11 }}>All-Time Withheld</Text>
                <Text style={{ color: '#fbbf24', fontSize: 18, fontWeight: '800' }}>{w.currency} {Number(w.total_withheld).toLocaleString()}</Text>
              </View>
            </View>
            {Number(w.balance) > 0 && (
              <TouchableOpacity onPress={() => alert('Remit ' + w.currency + ' ' + Number(w.balance).toLocaleString() + ' to ' + r?.tax_authority)} style={{ marginTop: 10, backgroundColor: '#dc2626', borderRadius: 8, padding: 10, alignItems: 'center' }}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>Remit to {r?.tax_authority}</Text>
              </TouchableOpacity>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}
