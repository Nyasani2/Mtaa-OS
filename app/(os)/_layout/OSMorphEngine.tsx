import React from 'react'
import { ViewStyle } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated'

export type MorphState = {
  x: number
  y: number
  width: number
  height: number
  active: boolean
}

type Props = {
  state: MorphState
  children: React.ReactNode
}

export default function OSMorphEngine({ state, children }: Props) {
  const translateX = useSharedValue(state.x)
  const translateY = useSharedValue(state.y)
  const scaleX = useSharedValue(1)
  const scaleY = useSharedValue(1)
  const radius = useSharedValue(20)

  React.useEffect(() => {
    if (state.active) {
      // ICON → FULLSCREEN MORPH

      translateX.value = withTiming(0, { duration: 280 })
      translateY.value = withTiming(0, { duration: 280 })

      scaleX.value = withSpring(1, { damping: 14 })
      scaleY.value = withSpring(1, { damping: 14 })

      radius.value = withTiming(0, { duration: 250 })
    } else {
      // RESET STATE (back to grid icon feel)
      radius.value = withSpring(20)
    }
  }, [state.active])

  const animatedStyle = useAnimatedStyle(() => {
    const style: ViewStyle = {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scaleX: scaleX.value },
        { scaleY: scaleY.value },
      ],
      borderRadius: radius.value,
      overflow: 'hidden',
    }

    return style
  })

  return <Animated.View style={animatedStyle}>{children}</Animated.View>
}
