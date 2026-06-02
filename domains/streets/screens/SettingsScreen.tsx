import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SettingsPanel } from '../components/SettingsPanel';

export default function SettingsScreen() {
  return (
    <View style={styles.container}>
      <SettingsPanel />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
});
