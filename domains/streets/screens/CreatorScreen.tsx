import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function CreatorScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Creator</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', justifyContent: 'center', alignItems: 'center' },
  title: { color: '#fff', fontSize: 24, fontWeight: '700' },
});
