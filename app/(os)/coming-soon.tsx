import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function ComingSoon() {
  const router = useRouter();
  const { feature } = useLocalSearchParams();
  
  const featureName = (typeof feature === 'string' ? feature : 'This feature')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons name="construct-outline" size={64} color="#fbbf24" />
      </View>
      <Text style={styles.title}>Coming Soon to Kamo Phones</Text>
      <Text style={styles.featureName}>{featureName}</Text>
      <Text style={styles.text}>
        We are actively building {featureName.toLowerCase()} to ensure it meets MTAA's 
        high standards for security and performance. Stay tuned for the next update!
      </Text>
      <TouchableOpacity style={styles.button} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={20} color="#fff" style={{ marginRight: 8 }} />
        <Text style={styles.buttonText}>Go Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 32, 
    backgroundColor: '#0f172a' 
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: { 
    fontSize: 20, 
    fontWeight: '700', 
    color: '#94a3b8', 
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8 
  },
  featureName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 16,
  },
  text: { 
    fontSize: 16, 
    color: '#cbd5e1', 
    textAlign: 'center', 
    lineHeight: 24, 
    marginBottom: 40 
  },
  button: { 
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6', 
    paddingHorizontal: 32, 
    paddingVertical: 14, 
    borderRadius: 12,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: { 
    color: '#fff', 
    fontSize: 16, 
    fontWeight: '600' 
  },
});
