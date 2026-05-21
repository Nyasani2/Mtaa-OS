import { useEffect } from 'react'
import { View, Text, ActivityIndicator } from 'react-native'
import { router } from 'expo-router'

import { kernel } from './app-runtime/kernel'

export default function SplashScreen() {
  useEffect(() => {
    boot()
  }, [])

  const boot = async () => {
    try {
      await kernel.boot()
      router.replace('/(os)/home')
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#050510',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text
        style={{
          color: 'white',
          fontSize: 32,
          fontWeight: '700',
          marginBottom: 20,
        }}
      >
        MTAA OS
      </Text>

      <ActivityIndicator color="white" />
    </View>
  )
}
