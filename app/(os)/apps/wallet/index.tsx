import React from 'react'
import { View, Text, StyleSheet, Pressable } from 'react-native'
import { router } from 'expo-router'
import { useWalletStore } from '@/_STAGING/wallet_engine/stores/walletStore'
import { useTransactionActivity } from '@/hooks/useTransactionActivity'
import { Ionicons } from '@expo/vector-icons'

export default function WalletScreen() {
  const { balance } = useWalletStore()
  const { transactions } = useTransactionActivity()

  const ActionButton = ({ icon, label, onPress }: any) => {
    return (
      <Pressable style={styles.actionBtn} onPress={onPress}>
        <Ionicons name={icon} size={22} color="#fff" />
        <Text style={styles.actionText}>{label}</Text>
      </Pressable>
    )
  }

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <Text style={styles.title}>MTAA Wallet</Text>

      {/* BALANCE */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Available Balance</Text>
        <Text style={styles.balanceValue}>KES {balance}</Text>
      </View>

      {/* ACTION GRID */}
      <View style={styles.actionsRow}>
        <ActionButton
          icon="arrow-down-circle"
          label="Deposit"
          onPress={() => router.push('/(os)/apps/wallet/deposit' as any)}
        />

        <ActionButton
          icon="arrow-up-circle"
          label="Send"
          onPress={() => router.push('/(os)/apps/wallet/send' as any)}
        />

        <ActionButton
          icon="scan"
          label="Scan"
          onPress={() => router.push('/(os)/apps/wallet/scan' as any)}
        />

        <ActionButton
          icon="swap-horizontal"
          label="Transfer"
          onPress={() =>
            router.push('/(os)/apps/wallet/transfer' as any)
          }
        />
      </View>

      {/* TRANSACTIONS */}
      <View style={styles.txBox}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>

        {transactions.map((tx) => (
          <View key={tx.id} style={styles.txItem}>
            <Text style={styles.txDesc}>{tx.description}</Text>
            <Text style={styles.txAmount}>{tx.amount}</Text>
          </View>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 16,
  },

  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 20,
  },

  balanceCard: {
    backgroundColor: '#111',
    padding: 16,
    borderRadius: 14,
    marginBottom: 20,
  },

  balanceLabel: {
    color: '#888',
    fontSize: 12,
  },

  balanceValue: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
    marginTop: 6,
  },

  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },

  actionBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    width: '23%',
    backgroundColor: '#111',
    borderRadius: 12,
  },

  actionText: {
    color: '#fff',
    fontSize: 10,
    marginTop: 6,
  },

  txBox: {
    flex: 1,
  },

  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
  },

  txItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomColor: '#222',
    borderBottomWidth: 1,
  },

  txDesc: {
    color: '#aaa',
  },

  txAmount: {
    color: '#fff',
    fontWeight: '600',
  },
})
