import React from 'react';

import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';

export function LoadingProvider({
  message = 'Loading...'
}: {
  message?: string;
}) {
  return (
    <View style={styles.overlay}>
      <View style={styles.card}>
        <ActivityIndicator size="large" color="#ffffff" />

        <Text style={styles.text}>
          {message}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999
  },

  card: {
    backgroundColor: '#181818',
    padding: 24,
    borderRadius: 24,
    alignItems: 'center'
  },

  text: {
    color: '#fff',
    marginTop: 16,
    textAlign: 'center'
  }
});
