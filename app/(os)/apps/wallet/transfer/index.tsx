import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
} from 'react-native'

import { supabase } from '@/lib/supabase'
import { walletExecutionPipeline } from '@/lib/hookup/wallet-bridge/walletExecutionPipeline'

export default function WalletTransferScreen() {
  const [targetWallet, setTargetWallet] = useState('')
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)

  const handleTransfer = async () => {
    try {
      setLoading(true)

      const { data } = await supabase.auth.getUser()

      if (!data?.user?.id) {
        throw new Error('Not authenticated')
      }

      await walletExecutionPipeline.execute({
        type: 'TRANSFER',
        userId: data.user.id,
        amount: Number(amount),
        currency: 'KES',
        metadata: {
          targetWallet,
        },
      })

      Alert.alert(
        'Transfer Complete',
        'Wallet transfer completed successfully'
      )

      setTargetWallet('')
      setAmount('')
    } catch (err: any) {
      Alert.alert(
        'Transfer Failed',
        err?.message || 'Unknown error'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Transfer Funds</Text>

      <TextInput
        placeholder="Target Wallet ID"
        placeholderTextColor="#666"
        value={targetWallet}
        onChangeText={setTargetWallet}
        style={styles.input}
      />

      <TextInput
        placeholder="Amount"
        placeholderTextColor="#666"
        keyboardType="numeric"
        value={amount}
        onChangeText={setAmount}
        style={styles.input}
      />

      <Pressable
        style={styles.button}
        onPress={handleTransfer}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Processing...' : 'Transfer'}
        </Text>
      </Pressable>
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
    color: '#fff',
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 30,
  },

  input: {
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    marginBottom: 16,
  },

  button: {
    backgroundColor: '#2563eb',
    padding: 18,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 10,
  },

  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
})
