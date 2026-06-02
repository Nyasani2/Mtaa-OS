import React from 'react';
import { View, StyleSheet } from 'react-native';
import { JobsPanel } from '../components/JobsPanel';

export default function JobsScreen() {
  return (
    <View style={styles.container}>
      <JobsPanel />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
});
