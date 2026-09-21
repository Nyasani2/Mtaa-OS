// @ts-nocheck
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/lib/theme/ThemeContext';

const { width, height } = Dimensions.get('window');

export function ThemeBackground() {
  const { currentTheme } = useTheme();
  const anim1 = useRef(new Animated.Value(0)).current;
  const anim2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!currentTheme.animated) return;

    const animate = () => {
      Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(anim1, {
              toValue: 1,
              duration: 8000,
              useNativeDriver: true,
            }),
            Animated.timing(anim1, {
              toValue: 0,
              duration: 8000,
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(anim2, {
              toValue: 1,
              duration: 10000,
              useNativeDriver: true,
            }),
            Animated.timing(anim2, {
              toValue: 0,
              duration: 10000,
              useNativeDriver: true,
            }),
          ]),
        ])
      ).start();
    };

    animate();
  }, [currentTheme.animated]);

  if (!currentTheme.animated) {
    return (
      <LinearGradient
        colors={currentTheme.colors.background}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
    );
  }

  // Animated green blobs for Dynamic Green theme
  return (
    <View style={StyleSheet.absoluteFill}>
      <LinearGradient
        colors={currentTheme.colors.background}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <Animated.View
        style={[
          styles.blob,
          {
            transform: [
              { translateX: anim1.interpolate({ inputRange: [0, 1], outputRange: [-100, 100] }) },
              { translateY: anim2.interpolate({ inputRange: [0, 1], outputRange: [-50, 50] }) },
            ],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.blob2,
          {
            transform: [
              { translateX: anim2.interpolate({ inputRange: [0, 1], outputRange: [100, -100] }) },
              { translateY: anim1.interpolate({ inputRange: [0, 1], outputRange: [50, -50] }) },
            ],
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  blob: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(0, 255, 136, 0.15)',
    top: height * 0.2,
    left: width * 0.1,
  },
  blob2: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: 'rgba(0, 200, 100, 0.1)',
    bottom: height * 0.1,
    right: width * 0.05,
  },
});
