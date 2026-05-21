// lib/kernel/runtime/BootGate.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Animated } from 'react-native';
import { kernel, registerAllModules } from '../kernel-bootloader';

interface BootGateProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (errors: string[]) => void;
}

export function BootGate({ children, fallback, onError }: BootGateProps) {
  const [bootState, setBootState] = useState(kernel.getState());
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    const unsubscribe = kernel.subscribe(setBootState);

    const init = async () => {
      try {
        registerAllModules();
        await kernel.boot();
        Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
      } catch (err: any) {
        console.error('[BootGate] Boot failed:', err);
        onError?.([err.message]);
      }
    };

    init();
    return unsubscribe;
  }, []);

  if (bootState.bootPhase === 'idle' || bootState.bootPhase === 'initializing') {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.text}>Initializing MTAA OS...</Text>
      </View>
    );
  }

  if (bootState.bootPhase === 'loading_modules') {
    const total = bootState.modules.size;
    const ready = Array.from(bootState.modules.values()).filter(m => m.status === 'ready').length;
    const progress = total > 0 ? (ready / total) * 100 : 0;

    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.text}>Loading modules ({ready}/{total})...</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
      </View>
    );
  }

  if (bootState.bootPhase === 'error') {
    return (
      <View style={styles.container}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorTitle}>System Error</Text>
        <Text style={styles.errorText}>{bootState.errors[0] || 'Failed to initialize'}</Text>
        {fallback}
      </View>
    );
  }

  // ready or safe_mode
  return (
    <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F172A' },
  text: { color: '#94A3B8', marginTop: 16, fontSize: 14 },
  progressBar: { width: 200, height: 4, backgroundColor: '#1E293B', borderRadius: 2, marginTop: 16, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#3B82F6', borderRadius: 2 },
  errorIcon: { fontSize: 48 },
  errorTitle: { color: '#EF4444', fontSize: 20, fontWeight: '700', marginTop: 16 },
  errorText: { color: '#94A3B8', fontSize: 14, marginTop: 8, textAlign: 'center', paddingHorizontal: 32 },
});
