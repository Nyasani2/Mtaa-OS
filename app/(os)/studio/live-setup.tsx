import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
export default function LiveSetupScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Live Setup Coming Soon</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0a0a' },
  text: { color: '#fff', fontSize: 18, fontWeight: '600' as const },
});
