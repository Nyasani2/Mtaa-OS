import React from 'react'
import { View } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated'

export function useOSTransition() {
  const opacity = useSharedValue(1)
  const scale = useSharedValue(1)

  const enter = () => {
    opacity.value = withTiming(1, { duration: 220 })
    scale.value = withSpring(1, { damping: 18 })
  }

  const exit = () => {
    opacity.value = withTiming(0.85, { duration: 180 })
    scale.value = withSpring(0.98, { damping: 20 })
  }

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ scale: scale.value }],
    }
  })

  return {
    enter,
    exit,
    animatedStyle,
  }
}

export function OSTransitionView({
  children,
  style,
}: {
  children: React.ReactNode
  style?: any
}) {
  const t = useOSTransition()

  React.useEffect(() => {
    t.enter()
  }, [])

  return (
    <Animated.View style={[{ flex: 1 }, t.animatedStyle, style]}>
      {children}
    </Animated.View>
  )
}
