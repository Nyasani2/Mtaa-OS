import React, { useRef } from 'react'
import { Animated } from 'react-native'

export default function OSKernelTransitions({
  children,
}: {
  children: React.ReactNode
}) {
  const opacity = useRef(new Animated.Value(1)).current

  return (
    <Animated.View
      style={{
        flex: 1,
        opacity,
      }}
    >
      {children}
    </Animated.View>
  )
}

