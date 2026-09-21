// @ts-nocheck
import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export function HolographicASISCore({ isActive, size = 120 }: { isActive: boolean; size?: number }) {
  const spinValue = useRef(new Animated.Value(0)).current;
  const pulseValue = useRef(new Animated.Value(1)).current;
  const glowValue = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    if (isActive) {
      // Spin animation
      Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 4000,
          useNativeDriver: true,
        })
      ).start();

      // Pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseValue, { toValue: 1.2, duration: 1000, useNativeDriver: true }),
          Animated.timing(pulseValue, { toValue: 1, duration: 1000, useNativeDriver: true }),
        ])
      ).start();

      // Glow animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowValue, { toValue: 0.8, duration: 1500, useNativeDriver: true }),
          Animated.timing(glowValue, { toValue: 0.3, duration: 1500, useNativeDriver: true }),
        ])
      ).start();
    } else {
      spinValue.setValue(0);
      pulseValue.setValue(1);
      glowValue.setValue(0.3);
    }
  }, [isActive]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Outer Glow */}
      <Animated.View
        style={[
          styles.glowRing,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            opacity: glowValue,
            borderWidth: 2,
            borderColor: '#00f0ff',
            shadowColor: '#00f0ff',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.8,
            shadowRadius: 20,
          },
        ]}
      />
      
      {/* Rotating Holographic Ring */}
      <Animated.View
        style={[
          styles.ring,
          {
            width: size * 0.8,
            height: size * 0.8,
            borderRadius: (size * 0.8) / 2,
            borderWidth: 1,
            borderColor: '#00f0ff',
            borderStyle: 'dashed',
            transform: [{ rotate: spin }],
          },
        ]}
      />

      {/* Pulsing Core */}
      <Animated.View
        style={[
          styles.core,
          {
            width: size * 0.5,
            height: size * 0.5,
            borderRadius: (size * 0.5) / 2,
            backgroundColor: '#00f0ff',
            transform: [{ scale: pulseValue }],
            justifyContent: 'center',
            alignItems: 'center',
            shadowColor: '#00f0ff',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 1,
            shadowRadius: 15,
          },
        ]}
      >
        <Ionicons name="sparkles" size={size * 0.25} color="#fff" />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  glowRing: {
    position: 'absolute',
  },
  ring: {
    position: 'absolute',
  },
  core: {
    position: 'absolute',
  },
});
