import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  FlatList,
  StyleSheet,
} from 'react-native'

import { walletCoreEngine } from '@/lib/hookup/wallet-bridge/walletCoreEngine'

type TxItem = {
  id?: string
  amount?: number
  status?: string
  created_at?: string
}

export default function WalletTransactionsScreen() {
  const [tx, setTx] = useState<TxItem[]>([])

  useEffect(() => {
    const bus =
      walletCoreEngine.getEventBus()

    // live updates from engine
    const unsubscribe = bus.on((event) => {
      if (
        event.type === 'TRANSACTION_CREATED'
      ) {
        setTx(
          event.payload?.list || []
        )
      }

      if (
        event.type === 'TRANSACTION_FAILED'
      ) {
        setTx((prev) =>
          prev.map((t) =>
            t.id === event.payload?.id
              ? { ...t, status: 'FAILED' }
              : t
          )
        )
      }
    })

    return () => unsubscribe()
  }, [])

  const renderItem = ({ item }: any) => {
    return (
      <View style={styles.card}>
        <Text style={styles.amount}>
          KES {item.amount || 0}
        </Text>

        <Text style={styles.status}>
          {item.status || 'PENDING'}
        </Text>

        <Text style={styles.ref}>
          {item.id || 'NO_REF'}
        </Text>

        {item.created_at && (
          <Text style={styles.date}>
            {item.created_at}
          </Text>
        )}
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Transaction Ledger
      </Text>

      <FlatList
        data={tx}
        keyExtractor={(item, i) =>
          item.id?.toString() ||
          i.toString()
        }
        renderItem={renderItem}
        ListEmptyComponent={
          <Text style={styles.empty}>
            No transactions yet
          </Text>
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 20,
  },

  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 20,
  },

  card: {
    backgroundColor: '#111',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },

  amount: {
    color: '#22c55e',
    fontSize: 18,
    fontWeight: '700',
  },

  status: {
    color: '#fff',
    marginTop: 5,
  },

  ref: {
    color: '#666',
    marginTop: 4,
    fontSize: 12,
  },

  date: {
    color: '#444',
    marginTop: 4,
    fontSize: 11,
  },

  empty: {
    color: '#666',
    textAlign: 'center',
    marginTop: 50,
  },
})
