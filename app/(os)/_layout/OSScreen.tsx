import React from 'react'
import { View, StyleSheet, ImageBackground, StatusBar } from 'react-native'
import { OSTransitionView } from './OSKernelTransitions'

export default function OSScreen({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ImageBackground
      source={require('@/assets/images/mtaa_home.jpg')}
      resizeMode="cover"
      style={styles.bg}
    >
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      <View style={styles.overlay} />

      <OSTransitionView>
        <View style={styles.container}>
          {children}
        </View>
      </OSTransitionView>
    </ImageBackground>
  )
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  container: { flex: 1 },
})
