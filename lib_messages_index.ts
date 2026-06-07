import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export function MessagesApp() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Messages</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0a0a' },
  text: { color: '#fff', fontSize: 18 },
});

export default MessagesApp;
