import React, { useEffect, useState } from 'react'
import { View, Text, FlatList, StyleSheet } from 'react-native'
import { supabase } from '@/lib/supabase'

export default function ReceiptScreen() {
  const [receipts, setReceipts] = useState<any[]>([])

  const load = async () => {
    const { data } = await supabase
      .from('wallet_receipts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)

    setReceipts(data || [])
  }

  useEffect(() => {
    load()

    const channel = supabase
      .channel('receipts-live')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'wallet_receipts',
        },
        () => load()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Receipts</Text>

      <FlatList
        data={receipts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.code}>{item.receipt_code}</Text>
            <Text style={styles.amount}>
              KES {item.amount}
            </Text>
            <Text style={styles.meta}>
              {item.status} • {item.phone}
            </Text>
            <Text style={styles.time}>
              {new Date(item.created_at).toLocaleString()}
            </Text>
          </View>
        )}
      />
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
    marginBottom: 10,
  },
  card: {
    backgroundColor: '#111',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
  },
  code: {
    color: '#22c55e',
    fontSize: 16,
    fontWeight: '700',
  },
  amount: {
    color: '#fff',
    fontSize: 18,
    marginTop: 4,
  },
  meta: {
    color: '#888',
    marginTop: 4,
  },
  time: {
    color: '#555',
    marginTop: 4,
    fontSize: 12,
  },
})
