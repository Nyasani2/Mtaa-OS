/**
 * MTAA OS — Splash Screen (Kernel Layer)
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

function getPhaseProgress(phase: string) {
  const phases = [
    "idle","booting","lifecycle","registry","events",
    "realtime","scheduler","apps","watchdog","ready"
  ];
  const idx = phases.indexOf(phase);
  return idx === -1 ? "0%" : `${((idx + 1) / phases.length) * 100}%`;
}

export function SplashScreen({ phase, error }: SplashScreenProps) {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const i = setInterval(() => {
      setDots(d => (d.length >= 3 ? '' : d + '.'));
    }, 500);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
      ])
    ).start();
  }, []);

  const progress = getPhaseProgress(phase);

  return (
    <View style={styles.container}>
        <Text style={styles.logoText}>M</Text>
      </Animated.View>

      <Text style={styles.title}>MTAA OS</Text>

      <Text style={styles.phase}>
        {PHASE_LABELS[phase] || phase}{dots}
      </Text>

      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <View style={styles.bar}>
          <View style={[styles.fill, { width: progress }]} />
        </View>
      )}

      <Text style={styles.version}>v10.0.0</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617', justifyContent: 'center', alignItems: 'center' },
  logo: { width: 80, height: 80, borderRadius: 20, backgroundColor: '#3b82f6', justifyContent: 'center', alignItems: 'center' },
  logoText: { color: '#fff', fontSize: 32, fontWeight: 'bold' },
  title: { color: '#fff', fontSize: 20, marginTop: 10 },
  phase: { color: '#cbd5e1', marginTop: 10 },
  error: { color: '#f87171', marginTop: 10 },
  bar: { width: 160, height: 3, backgroundColor: '#1e293b', marginTop: 10 },
  fill: { height: 3, backgroundColor: '#3b82f6' },
  version: { color: '#475569', fontSize: 10, marginTop: 20 },
});
