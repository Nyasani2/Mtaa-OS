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

export default function WalletSendScreen() {
  const [recipientId, setRecipientId] = useState('')
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSend = async () => {
    try {
      setLoading(true)

      const { data } = await supabase.auth.getUser()

      if (!data?.user?.id) {
        throw new Error('Not authenticated')
      }

      await walletExecutionPipeline.execute({
        type: 'SEND_MONEY',
        userId: data.user.id,
        recipientId,
        amount: Number(amount),
        currency: 'KES',
      })

      Alert.alert(
        'Success',
        'Money sent successfully'
      )

      setRecipientId('')
      setAmount('')
    } catch (err: any) {
      Alert.alert(
        'Transaction Failed',
        err?.message || 'Unknown error'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Send Money</Text>

      <TextInput
        placeholder="Recipient User ID"
        placeholderTextColor="#666"
        value={recipientId}
        onChangeText={setRecipientId}
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
        onPress={handleSend}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Processing...' : 'Send Money'}
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
    backgroundColor: '#16a34a',
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
