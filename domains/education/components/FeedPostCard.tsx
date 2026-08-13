import React, { memo } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';

export interface FeedPost {
  id: string;
  author_name: string;
  author_avatar?: string;
  author_role: string;
  institution_name?: string;
  content: string;
  media_url?: string;
  created_at: string;
  likes_count: number;
  comments_count: number;
  scope: 'school' | 'country' | 'africa';
  is_liked?: boolean;
  subject_name?: string;
  grade_level?: string;
}

interface Props {
  post: FeedPost;
  onLike?: (id: string) => void;
  onComment?: (id: string) => void;
  compact?: boolean;
}

export const FeedPostCard = memo(function FeedPostCard({ post, onLike, onComment, compact }: Props) {
  const router = useRouter();
  const { colors } = useTheme();

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'now';
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
  };

  const scopeColor = {
    school: '#22c55e',
    country: '#f59e0b',
    africa: '#8b5cf6',
  };

  const scopeLabel = {
    school: 'School',
    country: 'National',
    africa: 'Africa',
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {/* Header */}
      <View style={styles.header}>
        <Image
          source={{ uri: post.author_avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + post.author_name }}
          style={styles.avatar}
        />
        <View style={styles.headerText}>
          <Text style={[styles.authorName, { color: colors.text }]}>{post.author_name}</Text>
          <Text style={[styles.meta, { color: colors.textSecondary }]}>
            {post.author_role} · {post.institution_name || 'MTAA Education'}
          </Text>
        </View>
        <View style={[styles.scopeBadge, { backgroundColor: scopeColor[post.scope] + '20' }]}>
          <Text style={[styles.scopeText, { color: scopeColor[post.scope] }]}>
            {scopeLabel[post.scope]}
          </Text>
        </View>
      </View>

      {/* Content */}
      <Text style={[styles.content, { color: colors.text }]} numberOfLines={compact ? 3 : undefined}>
        {post.content}
      </Text>

      {/* Tags */}
      {(post.subject_name || post.grade_level) && (
        <View style={styles.tagRow}>
          {post.subject_name && (
            <View style={[styles.tag, { backgroundColor: colors.primary + '15' }]}>
              <Text style={[styles.tagText, { color: colors.primary }]}>{post.subject_name}</Text>
            </View>
          )}
          {post.grade_level && (
            <View style={[styles.tag, { backgroundColor: '#FEF3C7' }]}>
              <Text style={[styles.tagText, { color: '#D97706' }]}>Grade {post.grade_level}</Text>
            </View>
          )}
        </View>
      )}

      {/* Media */}
      {post.media_url && !compact && (
        <Image source={{ uri: post.media_url }} style={styles.media} resizeMode="cover" />
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={[styles.time, { color: colors.textSecondary }]}>{timeAgo(post.created_at)}</Text>
        <View style={styles.actions}>
          <TouchableOpacity onPress={() => onLike?.(post.id)} style={styles.actionBtn}>
            <Ionicons name={post.is_liked ? 'heart' : 'heart-outline'} size={18} color={post.is_liked ? '#ef4444' : colors.textSecondary} />
            <Text style={[styles.actionText, { color: colors.textSecondary }]}>{post.likes_count}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onComment?.(post.id)} style={styles.actionBtn}>
            <Ionicons name="chatbubble-outline" size={18} color={colors.textSecondary} />
            <Text style={[styles.actionText, { color: colors.textSecondary }]}>{post.comments_count}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push(`/(education)/feed/${post.id}` as any)} style={styles.actionBtn}>
            <Ionicons name="arrow-redo-outline" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1e1e2e' },
  headerText: { flex: 1, marginLeft: 12 },
  authorName: { fontSize: 15, fontWeight: '700' },
  meta: { fontSize: 12, marginTop: 2 },
  scopeBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  scopeText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  content: { fontSize: 14, lineHeight: 20, marginBottom: 12 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  tag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  tagText: { fontSize: 11, fontWeight: '600' },
  media: { width: '100%', height: 200, borderRadius: 12, marginBottom: 12, backgroundColor: '#1e1e2e' },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  time: { fontSize: 12 },
  actions: { flexDirection: 'row', gap: 16 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionText: { fontSize: 12, fontWeight: '600' },
});
