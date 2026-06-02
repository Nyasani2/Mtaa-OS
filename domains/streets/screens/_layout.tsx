import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { ReportModal } from '../components/ReportModal';

export default function StreetsLayout() {
  return (
    <View style={styles.container}>
      <Stack screenOptions={{ headerShown: false }} />
      <ReportModal />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
