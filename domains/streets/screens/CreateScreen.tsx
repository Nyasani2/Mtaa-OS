import React from 'react';
import { View, StyleSheet } from 'react-native';
import { CreateModal } from '../components/CreateModal';

export default function CreateScreen() {
  return (
    <View style={styles.container}>
      <CreateModal visible={true} onClose={() => router.back()} />
    </View>
  );
}

import { router } from 'expo-router';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
});
