import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNetworkStatus } from '@/lib/health/hooks/useNetworkStatus';

export function OfflineBanner() {
  const { isOnline, isRetrying, retry } = useNetworkStatus();

  if (isOnline) return null;

  return (
    <View style={styles.banner}>
      <Text style={styles.text}>⚠️ You are offline</Text>
      <TouchableOpacity
        onPress={() => retry(async () => window.location.reload())}
        disabled={isRetrying}
        style={styles.button}
      >
        <Text style={styles.buttonText}>
          {isRetrying ? 'Retrying...' : 'Retry'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#ff9800',
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  text: {
    color: '#000',
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#000',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  buttonText: {
    color: '#fff',
    fontSize: 12,
  },
});
