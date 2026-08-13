import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function WorkspaceScreen() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <Ionicons name="briefcase" size={64} color="#666" />
      <Text style={styles.title}>Workspace</Text>
      <Text style={styles.subtitle}>Your work dashboard is being built</Text>
      <TouchableOpacity style={styles.button} onPress={() => router.back()}>
        <Text style={styles.buttonText}>Go Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0a0a' },
  title: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginTop: 16 },
  subtitle: { color: '#888', fontSize: 16, marginTop: 8 },
  button: { marginTop: 24, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: '#10b981', borderRadius: 8 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
