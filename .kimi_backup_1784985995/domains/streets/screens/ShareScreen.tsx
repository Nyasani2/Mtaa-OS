import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { ShareSheet } from '../components/ShareSheet';

export default function ShareScreen() {
  const { postId } = useLocalSearchParams<{ postId: string }>();

  return (
    <View style={styles.container}>
      <ShareSheet postId={postId} visible={true} onClose={() => router.back()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
});
