import React from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity, StyleSheet } from 'react-native';

interface AsyncStateProps {
  loading: boolean;
  error: string | null;
  empty: boolean;
  emptyMessage?: string;
  onRetry?: () => void;
  children: React.ReactNode;
}

export function AsyncState({
  loading,
  error,
  empty,
  emptyMessage = 'No data yet',
  onRetry,
  children,
}: AsyncStateProps) {
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#ff9f0a" />
        <Text style={styles.text}>Loading...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>Error</Text>
        <Text style={styles.errorText}>{error}</Text>
        {onRetry && (
          <TouchableOpacity style={styles.button} onPress={onRetry}>
            <Text style={styles.buttonText}>Retry</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  if (empty) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>{emptyMessage}</Text>
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  text: { color: '#888', fontSize: 16, marginTop: 12 },
  errorTitle: { color: '#ff4444', fontSize: 18, fontWeight: '700', marginBottom: 8 },
  errorText: { color: '#ff6666', fontSize: 14, textAlign: 'center', marginBottom: 16 },
  button: { backgroundColor: '#ff9f0a', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  buttonText: { color: '#000', fontWeight: '600', fontSize: 16 },
});
