// @ts-nocheck
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export function OfflineWarning() {
  return (
    <View style={styles.container}>
      <Ionicons name="wifi-off" size={24} color="#fbbf24" />
      <Text style={styles.text}>You're offline. Some features may be limited.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fbbf24',
    padding: 12,
    borderRadius: 8,
    margin: 16,
    gap: 8,
  },
  text: {
    color: '#000',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
});
