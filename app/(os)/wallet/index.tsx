// app/(os)/wallet/index.tsx — Wallet Dashboard
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useWalletAccount } from '@/lib/wallet/hooks';

export default function WalletScreen() {
  const router = useRouter();
  const { account, loading, error } = useWalletAccount();

  const menuItems = [
    { icon: 'send', label: 'Send', route: '/wallet/send' as any },
    { icon: 'download', label: 'Receive', route: '/wallet/receive' as any },
    { icon: 'card', label: 'Deposit', route: '/wallet/deposit' as any },
    { icon: 'cash', label: 'Withdraw', route: '/wallet/withdraw' as any },
    { icon: 'time', label: 'History', route: '/wallet/history' as any },
    { icon: 'business', label: 'Business', route: '/wallet/business' as any },
    { icon: 'people', label: 'SACCO', route: '/wallet/sacco-hub' as any },
    { icon: 'shield', label: 'Insurance', route: '/wallet/insurance-hub' as any },
    { icon: 'school', label: 'Savings', route: '/wallet/savings-hub' as any },
    { icon: 'bank', label: 'Banking', route: '/wallet/banking-hub' as any },
    { icon: 'document', label: 'Tax', route: '/wallet/tax' as any },
    { icon: 'qr-code', label: 'QR Pay', route: '/wallet/qr' as any },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Total Balance</Text>
          <Text style={styles.balanceAmount}>
            {loading ? '...' : error ? 'Error' : `${account?.currency || 'KES'} ${(account?.balance || 0).toLocaleString()}`}
          </Text>
        </View>

        {/* Menu Grid */}
        <View style={styles.grid}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.label}
              style={styles.menuItem}
              onPress={() => router.push(item.route)}
            >
              <View style={styles.iconBox}>
                <Ionicons name={item.icon as any} size={24} color="#2563EB" />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  scroll: { padding: 16 },
  balanceCard: {
    backgroundColor: '#1E3A5F',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    alignItems: 'center',
  },
  balanceLabel: { color: '#94A3B8', fontSize: 14, marginBottom: 8 },
  balanceAmount: { color: '#fff', fontSize: 32, fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  menuItem: {
    width: '23%',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 12,
    backgroundColor: '#1E293B',
    borderRadius: 12,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2563EB20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  menuLabel: { color: '#CBD5E1', fontSize: 11, fontWeight: '500' },
});
