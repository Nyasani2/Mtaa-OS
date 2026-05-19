import React, { useEffect } from 'react'
import { View, StyleSheet } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated'

export default function OSTransition({
  children,
}: {
  children: React.ReactNode
}) {
  const opacity = useSharedValue(0)
  const scale = useSharedValue(0.98)

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 250 })
    scale.value = withSpring(1, { damping: 18 })
  }, [])

  const style = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ scale: scale.value }],
    }
  })

  return (
    <Animated.View style={[styles.container, style]}>
      {children}
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})
