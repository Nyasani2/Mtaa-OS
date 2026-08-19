// @ts-nocheck
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

export default function BodaHub() {
  const router = useRouter();
  return (
    <View style={s.wrap}>
      <Text style={s.title}>️ Boda</Text>
      <Text style={s.sub}>Quick 2-wheel rides & deliveries</Text>
      <TouchableOpacity style={s.rider} onPress={() => router.push('/(mtaxi)/request?serviceType=boda')}>
        <Text style={s.riderT}>🛵 Book a Boda Ride</Text>
      </TouchableOpacity>
      <TouchableOpacity style={s.driver} onPress={() => router.push('/(mtaxi)/driver/onboarding?vtype=boda')}>
        <Text style={s.driverT}>🧑‍ Become a Boda Driver — earn per ride</Text>
      </TouchableOpacity>
    </View>
  );
}
const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#0f0f1a', padding: 20, justifyContent: 'center', gap: 14 },
  title: { color: '#fff', fontSize: 26, fontWeight: '800' },
  sub: { color: '#8892b0', marginBottom: 10 },
  rider: { backgroundColor: '#10b981', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  riderT: { color: '#fff', fontWeight: '800', fontSize: 16 },
  driver: { backgroundColor: '#7c3aed', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  driverT: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
