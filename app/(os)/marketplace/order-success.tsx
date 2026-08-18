// @ts-nocheck
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

export default function OrderSuccessScreen() {
  const { order_id, total } = useLocalSearchParams();
  const router = useRouter();
  return (
    <View style={{ flex: 1, backgroundColor: '#0a0a0f', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
      <Text style={{ fontSize: 56 }}>✅</Text>
      <Text style={{ color: '#fff', fontSize: 22, fontWeight: '800', marginTop: 12 }}>Order Placed!</Text>
      <Text style={{ color: '#888', marginTop: 8, textAlign: 'center' }}>
        Order #{String(order_id || '').slice(0, 8)} · KES {Number(total || 0).toLocaleString()}
      </Text>
      <TouchableOpacity onPress={() => router.push('/')} style={{ marginTop: 24, backgroundColor: '#007AFF', borderRadius: 12, paddingHorizontal: 20, paddingVertical: 12 }}>
        <Text style={{ color: '#fff', fontWeight: '700' }}>Back to Home</Text>
      </TouchableOpacity>
    </View>
  );
}
