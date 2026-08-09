import React, { memo } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';

export interface Institution {
  id: string;
  name: string;
  type: 'primary' | 'secondary' | 'tertiary' | 'vocational';
  country: string;
  city: string;
  logo_url?: string;
  student_count: number;
  teacher_count: number;
  rating: number;
  is_verified: boolean;
}

interface Props {
  institution: Institution;
  compact?: boolean;
}

export const InstitutionCard = memo(function InstitutionCard({ institution, compact }: Props) {
  const router = useRouter();
  const { colors } = useTheme();

  const typeColors: Record<string, string> = {
    primary: '#22c55e',
    secondary: '#3b82f6',
    tertiary: '#8b5cf6',
    vocational: '#f59e0b',
  };

  return (
    <TouchableOpacity
      style={[styles.card, compact && styles.compact, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => router.push(`/(education)/institutions/${institution.id}`)}
      activeOpacity={0.8}
    >
      <Image
        source={{ uri: institution.logo_url || 'https://api.dicebear.com/7.x/identicon/svg?seed=' + institution.name }}
        style={styles.logo}
      />
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>{institution.name}</Text>
          {institution.is_verified && (
            <Ionicons name="checkmark-circle" size={14} color="#3b82f6" />
          )}
        </View>
        <Text style={[styles.location, { color: colors.textSecondary }]}>{institution.city}, {institution.country}</Text>
        <View style={styles.stats}>
          <View style={[styles.badge, { backgroundColor: typeColors[institution.type] + '20' }]}>
            <Text style={[styles.badgeText, { color: typeColors[institution.type] }]}>
              {institution.type}
            </Text>
          </View>
          <Text style={[styles.statText, { color: colors.textSecondary }]}>{institution.student_count.toLocaleString()} students</Text>
          <Text style={[styles.statText, { color: colors.textSecondary }]}>{institution.teacher_count.toLocaleString()} teachers</Text>
          <View style={styles.rating}>
            <Ionicons name="star" size={12} color="#f59e0b" />
            <Text style={styles.ratingText}>{institution.rating.toFixed(1)}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  compact: { padding: 12 },
  logo: { width: 56, height: 56, borderRadius: 12, backgroundColor: '#1e1e2e' },
  info: { flex: 1, marginLeft: 14 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { fontSize: 15, fontWeight: '700', flex: 1 },
  location: { fontSize: 12, marginTop: 2 },
  stats: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8, flexWrap: 'wrap' },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText: { fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },
  statText: { fontSize: 11 },
  rating: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  ratingText: { color: '#f59e0b', fontSize: 11, fontWeight: '700' },
});
