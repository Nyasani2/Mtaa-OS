import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, Pressable } from 'react-native'
import { CameraView, useCameraPermissions } from 'expo-camera'
import { Ionicons } from '@expo/vector-icons'

import { walletUIBridge } from '@/lib/hookup/wallet-bridge/walletUIBridge'

export default function WalletScanScreen() {
  const [permission, requestPermission] = useCameraPermissions()
  const [scanned, setScanned] = useState(false)
  const [result, setResult] = useState<any>(null)

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission()
    }
  }, [])

  const handleBarcodeScanned = async ({ data }: any) => {
    if (scanned) return

    try {
      setScanned(true)

      // Send REAL QR to wallet system
      const response = await walletUIBridge.scanAndPay(data)

      setResult(response)
    } catch (err) {
      console.error('Scan error:', err)
    }
  }

  if (!permission) {
    return (
      <View style={styles.center}>
        <Text style={{ color: '#fff' }}>Requesting camera permission...</Text>
      </View>
    )
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={{ color: '#fff' }}>No camera access</Text>
        <Pressable onPress={requestPermission} style={styles.button}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </Pressable>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFill}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
        onBarcodeScanned={handleBarcodeScanned}
      />

      <View style={styles.overlay}>
        <Ionicons name="scan-circle" size={120} color="#22c55e" />
        <Text style={styles.text}>Align QR to pay</Text>
      </View>

      {result && (
        <View style={styles.resultBox}>
          <Text style={styles.resultText}>
            {JSON.stringify(result)}
          </Text>

          <Pressable
            onPress={() => setScanned(false)}
            style={styles.button}
          >
            <Text style={styles.buttonText}>Scan Again</Text>
          </Pressable>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },

  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },

  text: {
    color: '#fff',
    marginTop: 10,
    fontSize: 16,
  },

  resultBox: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: '#111',
    padding: 15,
    borderRadius: 12,
  },

  resultText: {
    color: '#0f0',
    fontSize: 12,
  },

  button: {
    marginTop: 12,
    backgroundColor: '#22c55e',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },

  buttonText: {
    color: '#fff',
    fontWeight: '700',
  },
})
