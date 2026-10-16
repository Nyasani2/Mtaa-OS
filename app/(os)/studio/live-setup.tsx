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
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' },
  text: { color: '#fff', fontSize: 18, fontWeight: '600' },
});
