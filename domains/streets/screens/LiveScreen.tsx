import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { LivePlayer } from '../components/LivePlayer';

export default function LiveScreen() {
  const { streamId } = useLocalSearchParams<{ streamId: string }>();

  return (
    <View style={styles.container}>
      <LivePlayer streamId={streamId} isHost={false} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
});
