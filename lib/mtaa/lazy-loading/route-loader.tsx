// lib/mtaa/lazy-loading/route-loader.tsx
import React, { Suspense, lazy, ComponentType } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

const DefaultFallback = () => (
  <View style={styles.fallback}><ActivityIndicator size="large" color="#3B82F6" /></View>
);

export function lazyRoute<T extends ComponentType<any>>(loader: () => Promise<{ default: T }>, options: { fallback?: React.ReactNode; preload?: boolean } = {}) {
  const LazyComponent = lazy(loader);
  const WrappedComponent = (props: any) => (
    <Suspense fallback={options.fallback || <DefaultFallback />}><LazyComponent {...props} /></Suspense>
  );
  if (options.preload) loader();
  return WrappedComponent as any;
}

const styles = StyleSheet.create({ fallback: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0A0A0A' } });
