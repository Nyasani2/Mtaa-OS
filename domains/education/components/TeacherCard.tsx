import React, { memo } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';

export interface Teacher {
  id: string;
  full_name: string;
  avatar_url?: string;
  subjects: string[];
  institution_name: string;
  years_experience: number;
  rating: number;
  is_verified: boolean;
  bio?: string;
}

interface Props {
  teacher: Teacher;
  compact?: boolean;
}

export const TeacherCard = memo(function TeacherCard({ teacher, compact }: Props) {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => router.push(`/(education)/teachers/${teacher.id}` as any)}
      activeOpacity={0.8}
    >
      <Image
        source={{ uri: teacher.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + teacher.full_name }}
        style={styles.avatar}
      />
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>{teacher.full_name}</Text>
          {teacher.is_verified && (
            <Ionicons name="checkmark-circle" size={14} color="#3b82f6" />
          )}
        </View>
        <Text style={[styles.institution, { color: colors.textSecondary }]}>{teacher.institution_name}</Text>
        {!compact && (
          <Text style={[styles.bio, { color: colors.textSecondary }]} numberOfLines={2}>{teacher.bio || 'Educator on MTAA Education Network'}</Text>
        )}
        <View style={styles.footer}>
          <View style={styles.subjects}>
            {teacher.subjects.slice(0, 3).map((s, i) => (
              <View key={i} style={[styles.subjectBadge, { backgroundColor: colors.primary + '15' }]}>
                <Text style={[styles.subjectText, { color: colors.primary }]}>{s}</Text>
              </View>
            ))}
          </View>
          <View style={styles.meta}>
            <Text style={[styles.metaText, { color: colors.textSecondary }]}>{teacher.years_experience}y exp</Text>
            <View style={styles.rating}>
              <Ionicons name="star" size={12} color="#f59e0b" />
              <Text style={styles.ratingText}>{teacher.rating.toFixed(1)}</Text>
            </View>
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
    alignItems: 'flex-start',
  },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#1e1e2e' },
  info: { flex: 1, marginLeft: 14 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { fontSize: 15, fontWeight: '700', flex: 1 },
  institution: { fontSize: 12, marginTop: 2 },
  bio: { fontSize: 12, lineHeight: 18, marginTop: 6 },
  footer: { marginTop: 10 },
  subjects: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  subjectBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  subjectText: { fontSize: 10, fontWeight: '600' },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 },
  metaText: { fontSize: 11 },
  rating: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  ratingText: { color: '#f59e0b', fontSize: 11, fontWeight: '700' },
});
