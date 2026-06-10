import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
export default function CreatorsScreen() {
  return <View style={styles.container}><Text style={styles.text}>⭐ Creators</Text></View>;
}
const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: '#0a0a1a', justifyContent: 'center', alignItems: 'center' }, text: { color: '#fff', fontSize: 20 } });
