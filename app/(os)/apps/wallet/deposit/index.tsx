import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  Alert,
} from 'react-native'

import { mpesaAdapter } from '@/lib/integrations/rails/mpesaAdapter'

export default function WalletDepositScreen() {
  const [amount, setAmount] = useState('')
  const [phone, setPhone] = useState('254748830512')
  const [loading, setLoading] = useState(false)

  const handleDeposit = async () => {
    if (!amount || !phone) {
      Alert.alert('Error', 'Enter amount and phone')
      return
    }

    try {
      setLoading(true)

      const response =
        await mpesaAdapter.stkPush({
          phone,
          amount: Number(amount),
          accountReference: 'MTAA_WALLET',
          description: 'Wallet Deposit',
        })

      console.log('STK RESPONSE:', response)

      if (response?.success) {
        Alert.alert(
          'Payment Initiated',
          response.customerMessage ||
            'Check your phone to complete payment'
        )
      } else {
        Alert.alert(
          'Failed',
          response?.error || 'Transaction failed'
        )
      }
    } catch (err: any) {
      console.error(err)
      Alert.alert(
        'Error',
        'Something went wrong'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Deposit Funds
      </Text>

      <Text style={styles.subtitle}>
        Add money to your MTAA wallet via MPesa
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Phone (254...)"
        placeholderTextColor="#888"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
      />

      <TextInput
        style={styles.input}
        placeholder="Amount"
        placeholderTextColor="#888"
        value={amount}
        onChangeText={setAmount}
        keyboardType="numeric"
      />

      <Pressable
        style={[
          styles.button,
          loading && { opacity: 0.6 },
        ]}
        onPress={handleDeposit}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading
            ? 'Processing...'
            : 'Send to MPesa'}
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
    justifyContent: 'center',
  },

  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 10,
  },

  subtitle: {
    color: '#888',
    marginBottom: 30,
  },

  input: {
    backgroundColor: '#111',
    padding: 14,
    borderRadius: 10,
    color: '#fff',
    marginBottom: 12,
  },

  button: {
    backgroundColor: '#22c55e',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },

  buttonText: {
    color: '#fff',
    fontWeight: '700',
  },
})
