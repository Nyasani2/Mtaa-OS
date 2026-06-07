import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export function StreetsApp() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Streets</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0a0a' },
  text: { color: '#fff', fontSize: 18 },
});

export default StreetsApp;
