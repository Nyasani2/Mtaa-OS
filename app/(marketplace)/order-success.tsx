// app/(os)/marketplace/order-success.tsx
// Order Success Screen — confirmation after checkout

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function OrderSuccessScreen() {
  const router = useRouter();
  const { order_id, total } = useLocalSearchParams();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.icon}>🎉</Text>
        <Text style={styles.title}>Order Placed!</Text>
        <Text style={styles.subtitle}>
          Your order has been confirmed and payment secured in escrow.
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Order ID</Text>
          <Text style={styles.cardValue}>{order_id}</Text>
          <View style={styles.cardDivider} />
          <Text style={styles.cardLabel}>Total Paid</Text>
          <Text style={styles.cardValueHighlight}>KES {parseFloat(total as string).toLocaleString()}</Text>
          <View style={styles.cardDivider} />
          <Text style={styles.cardLabel}>Status</Text>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>Payment Secured → Awaiting Shipment</Text>
          </View>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>What happens next?</Text>
          <Text style={styles.infoItem}>1. Seller prepares and ships your order</Text>
          <Text style={styles.infoItem}>2. You receive tracking information</Text>
          <Text style={styles.infoItem}>3. Confirm delivery to release payment to seller</Text>
          <Text style={styles.infoItem}>4. Funds held safely in escrow until then</Text>
        </View>

        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => router.push('/(os)/marketplace/orders')}
        >
          <Text style={styles.primaryBtnText}>View My Orders</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => router.push('/(os)/marketplace')}
        >
          <Text style={styles.secondaryBtnText}>Continue Shopping</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
  icon: { fontSize: 64, marginBottom: 20 },
  title: { fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 10 },
  subtitle: { fontSize: 14, color: '#888', textAlign: 'center', marginBottom: 30, lineHeight: 20 },

  card: { backgroundColor: '#1a1a2e', borderRadius: 16, padding: 24, width: '100%', marginBottom: 24 },
  cardLabel: { fontSize: 12, color: '#666', marginBottom: 4 },
  cardValue: { fontSize: 15, color: '#fff', fontWeight: '600', marginBottom: 12 },
  cardValueHighlight: { fontSize: 20, color: '#00d26a', fontWeight: '800', marginBottom: 12 },
  cardDivider: { height: 1, backgroundColor: '#2a2a3e', marginVertical: 10 },
  statusBadge: { backgroundColor: '#0d2e1a', borderRadius: 8, padding: 10, alignItems: 'center' },
  statusText: { color: '#00d26a', fontSize: 13, fontWeight: '600' },

  infoBox: { width: '100%', marginBottom: 24 },
  infoTitle: { fontSize: 14, fontWeight: '700', color: '#fff', marginBottom: 10 },
  infoItem: { fontSize: 13, color: '#888', marginBottom: 6, lineHeight: 18 },

  primaryBtn: { backgroundColor: '#007AFF', borderRadius: 14, paddingVertical: 16, paddingHorizontal: 40, width: '100%', alignItems: 'center', marginBottom: 12 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  secondaryBtn: { paddingVertical: 12 },
  secondaryBtnText: { color: '#888', fontSize: 14 },
});
