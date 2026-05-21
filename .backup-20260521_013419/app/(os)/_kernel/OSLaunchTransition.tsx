import React, { useRef, useEffect } from 'react'
import { Animated } from 'react-native'

export default function OSLaunchTransition({
  active,
  children,
}: {
  active: boolean
  children: React.ReactNode
}) {
  const scale = useRef(new Animated.Value(1)).current
  const opacity = useRef(new Animated.Value(1)).current

  useEffect(() => {
    if (active) {
      Animated.parallel([
        Animated.timing(scale, {
          toValue: 1.05,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.95,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start()
    } else {
      Animated.parallel([
        Animated.timing(scale, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start()
    }
  }, [active])

  return (
    <Animated.View
      style={{
        flex: 1,
        transform: [{ scale }],
        opacity,
      }}
    >
      {children}
    </Animated.View>
  )
}
