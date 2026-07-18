import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES } from '@/constants/theme';

export default function AgentMapWeb() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <Ionicons name="phone-portrait" size={64} color={COLORS.primary} />
      <Text style={styles.title}>Mobile Only</Text>
      <Text style={styles.subtitle}>Agent tracking requires GPS and native maps.</Text>
      <Text style={styles.hint}>Use the MTAA mobile app to view agent locations.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SIZES.xl, backgroundColor: COLORS.background },
  title: { fontFamily: FONTS.bold, fontSize: 22, color: COLORS.text, marginTop: SIZES.lg },
  subtitle: { fontFamily: FONTS.regular, fontSize: 15, color: COLORS.textSecondary, textAlign: 'center', marginTop: SIZES.md },
  hint: { fontFamily: FONTS.medium, fontSize: 13, color: COLORS.primary, textAlign: 'center', marginTop: SIZES.md },
});
