import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

export default function LiveRoomScreen() {
  const { roomId } = useLocalSearchParams<{ roomId: string }>();
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Live Room #{roomId}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  text: { color: '#fff', fontSize: 18 },
});
