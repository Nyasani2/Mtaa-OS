/**
 * MTAA OS — Splash Screen (React Native)
 * Kernel initialization layer. NOT cosmetic.
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

interface SplashScreenProps {
  phase: string;
  error: string | null;
}

const PHASE_LABELS: Record<string, string> = {
  idle: 'Initializing...',
  booting: 'Booting kernel...',
  lifecycle: 'Activating lifecycle...',
  registry: 'Loading registry...',
  events: 'Initializing events...',
  realtime: 'Connecting realtime...',
  scheduler: 'Starting scheduler...',
  apps: 'Mounting apps...',
  watchdog: 'Activating watchdog...',
  ready: 'System ready',
  degraded: 'System degraded',
  shutdown: 'Shutting down...',
};

export function SplashScreen({ phase, error }: SplashScreenProps) {
  const [dots, setDots] = useState('');
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? '' : prev + '.'));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.2, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const isError = !!error;
  const progress = getPhaseProgress(phase);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Logo */}
        <Animated.View style={[styles.logoBox, { transform: [{ scale: pulseAnim }] }]}>
          <Text style={styles.logoText}>M</Text>
        </Animated.View>

        {/* Brand */}
        <View style={styles.brand}>
          <Text style={styles.brandTitle}>MTAA OS</Text>
          <Text style={styles.brandSub}>National Digital Infrastructure</Text>
        </View>

        {/* Phase */}
        <View style={styles.phaseBox}>
          {isError ? (
            <Text style={styles.errorText}>⚠ {error}</Text>
          ) : (
            <>
              <Text style={styles.phaseText}>{PHASE_LABELS[phase] || phase}{dots}</Text>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: progress }]} />
              </View>
            </>
          )}
        </View>

        <Text style={styles.version}>v10.0.0-kernel</Text>
      </View>
    </View>
  );
}

function getPhaseProgress(phase: string): string {
  const phases = ['idle', 'booting', 'lifecycle', 'registry', 'events', 'realtime', 'scheduler', 'apps', 'watchdog', 'ready'];
  const idx = phases.indexOf(phase);
  if (idx === -1) return '0%';
  return `${((idx + 1) / phases.length) * 100}%`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617', justifyContent: 'center', alignItems: 'center' },
  content: { alignItems: 'center', gap: 24 },
  logoBox: { width: 80, height: 80, borderRadius: 20, backgroundColor: '#3b82f6', alignItems: 'center', justifyContent: 'center' },
  logoText: { fontSize: 32, fontWeight: 'bold', color: '#fff' },
  brand: { alignItems: 'center' },
  brandTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff', letterSpacing: 1 },
  brandSub: { fontSize: 12, color: '#94a3b8', marginTop: 4 },
  phaseBox: { alignItems: 'center', gap: 8, minHeight: 60 },
  phaseText: { fontSize: 13, color: '#cbd5e1', fontFamily: 'monospace' },
  errorText: { fontSize: 13, color: '#f87171', textAlign: 'center', maxWidth: 280 },
  progressTrack: { width: 160, height: 3, backgroundColor: '#1e293b', borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#3b82f6', borderRadius: 2 },
  version: { fontSize: 10, color: '#475569', fontFamily: 'monospace' },
});
