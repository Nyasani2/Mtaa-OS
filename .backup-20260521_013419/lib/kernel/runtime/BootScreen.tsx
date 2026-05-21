// lib/kernel/runtime/BootScreen.tsx
import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';

interface BootScreenProps {
  onComplete?: () => void;
  duration?: number;
}

export function BootScreen({ onComplete, duration = 2000 }: BootScreenProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]),
      Animated.timing(progressAnim, { toValue: 1, duration: duration - 800, useNativeDriver: false }),
      Animated.timing(fadeAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start(() => onComplete?.());
  }, []);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.logoContainer, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>M</Text>
        </View>
        <Text style={styles.title}>MTAA OS</Text>
        <Text style={styles.subtitle}>v1.0.0 • AfriQ Master Build</Text>
      </Animated.View>

      <View style={styles.progressContainer}>
        <Animated.View style={[styles.progressBar, { width: progressWidth }]} />
      </View>

      <Animated.Text style={[styles.status, { opacity: fadeAnim }]}>
        Loading system modules...
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F172A' },
  logoContainer: { alignItems: 'center' },
  logo: { width: 80, height: 80, borderRadius: 20, backgroundColor: '#3B82F6', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  logoText: { fontSize: 40, fontWeight: '800', color: '#FFF' },
  title: { fontSize: 28, fontWeight: '800', color: '#FFF', letterSpacing: 2 },
  subtitle: { fontSize: 12, color: '#64748B', marginTop: 4 },
  progressContainer: { width: 200, height: 3, backgroundColor: '#1E293B', borderRadius: 2, marginTop: 32, overflow: 'hidden' },
  progressBar: { height: '100%', backgroundColor: '#3B82F6' },
  status: { color: '#64748B', fontSize: 12, marginTop: 16 },
});
