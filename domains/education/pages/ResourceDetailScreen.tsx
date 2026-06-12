import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Share,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useResourceDetail, useResourceLibrary } from '@/domains/education/hooks/useResourceLibrary';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';

const TYPE_ICONS: Record<string, string> = {
  document: 'document-text', video: 'videocam', audio: 'musical-notes', image: 'image',
  link: 'link', lesson_plan: 'book', worksheet: 'reader', presentation: 'easel',
  code: 'code-slash', book: 'library', article: 'newspaper',
};

const TYPE_COLORS: Record<string, string> = {
  document: '#3b82f6', video: '#ef4444', audio: '#8b5cf6', image: '#10b981',
  link: '#06b6d4', lesson_plan: '#f59e0b', worksheet: '#6366f1', presentation: '#ec4899',
  code: '#14b8a6', book: '#f97316', article: '#6b7280',
};

const TYPE_LABELS: Record<string, string> = {
  document: 'Document', video: 'Video', audio: 'Audio', image: 'Image',
  link: 'Link', lesson_plan: 'Lesson Plan', worksheet: 'Worksheet', presentation: 'Presentation',
  code: 'Code', book: 'Book', article: 'Article',
};

export default function ResourceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const { resource, loading, error, fetch, view } = useResourceDetail(id);
  const { resources: relatedResources } = useResourceLibrary({
    institution_id: user?.institution_id,
    resource_type: resource?.resource_type,
  });

  const [actionLoading, setActionLoading] = useState(false);

  // Track view on mount
  React.useEffect(() => {
    if (id) view();
  }, [id, view]);

  // Loading state
  if (loading && !resource) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading resource...</Text>
      </View>
    );
  }

  // Error state
  if (error && !resource) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
        <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
        <TouchableOpacity style={[styles.retryBtn, { backgroundColor: colors.primary }]} onPress={fetch}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Not found
  if (!resource) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <Ionicons name="document-outline" size={48} color={colors.textSecondary} />
        <Text style={[styles.emptyTitle, { color: colors.text }]}>Resource Not Found</Text>
        <Text style={[styles.emptySub, { color: colors.textSecondary }]}>The resource may have been removed or you don't have access.</Text>
      </View>
    );
  }

  const iconName = TYPE_ICONS[resource.resource_type] || 'document';
  const iconColor = TYPE_COLORS[resource.resource_type] || '#6b7280';
  const typeLabel = TYPE_LABELS[resource.resource_type] || resource.resource_type;

  const handleOpen = async () => {
    setActionLoading(true);
    const url = resource.external_url || resource.file_url;
    if (url) {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) await Linking.openURL(url);
    }
    setActionLoading(false);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        title: resource.title,
        message: `${resource.title}
${resource.description || ''}
${resource.external_url || resource.file_url || ''}`,
      });
    } catch {}
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const related = relatedResources.filter(r => r.id !== resource.id).slice(0, 5);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingTop: insets.top }}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={fetch} />}
    >
      {/* Hero */}
      <View style={[styles.hero, { backgroundColor: iconColor + '15' }]}>
        <View style={[styles.heroIcon, { backgroundColor: iconColor + '25' }]}>
          <Ionicons name={iconName as any} size={48} color={iconColor} />
        </View>
        <View style={[styles.typePill, { backgroundColor: iconColor + '25' }]}>
          <Text style={[styles.typePillText, { color: iconColor }]}>{typeLabel}</Text>
        </View>
        <Text style={[styles.heroTitle, { color: colors.text }]}>{resource.title}</Text>
        {resource.description && (
          <Text style={[styles.heroDesc, { color: colors.textSecondary }]}>{resource.description}</Text>
        )}
      </View>

      {/* Stats Bar */}
      <View style={[styles.statsBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={styles.statItem}>
          <Ionicons name="eye" size={16} color={colors.primary} />
          <Text style={[styles.statValue, { color: colors.text }]}>{resource.view_count}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Views</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="download" size={16} color={colors.primary} />
          <Text style={[styles.statValue, { color: colors.text }]}>{resource.download_count}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Downloads</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="calendar" size={16} color={colors.primary} />
          <Text style={[styles.statValue, { color: colors.text }]}>{new Date(resource.created_at).toLocaleDateString()}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Added</Text>
        </View>
      </View>

      {/* Details */}
      <View style={[styles.detailsCard, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Details</Text>

        {resource.teacher?.full_name && (
          <View style={styles.detailRow}>
            <Ionicons name="person" size={18} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Uploaded By</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>{resource.teacher.full_name}</Text>
            </View>
          </View>
        )}

        {resource.class?.name && (
          <View style={styles.detailRow}>
            <Ionicons name="school" size={18} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Class</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>{resource.class.name}</Text>
            </View>
          </View>
        )}

        {resource.subject?.name && (
          <View style={styles.detailRow}>
            <Ionicons name="book" size={18} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Subject</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>{resource.subject.name}</Text>
            </View>
          </View>
        )}

        {resource.grade_level && (
          <View style={styles.detailRow}>
            <Ionicons name="ribbon" size={18} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Grade Level</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>Grade {resource.grade_level}</Text>
            </View>
          </View>
        )}

        {resource.file_size_bytes && (
          <View style={styles.detailRow}>
            <Ionicons name="cube" size={18} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>File Size</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>{formatFileSize(resource.file_size_bytes)}</Text>
            </View>
          </View>
        )}

        {resource.file_mime_type && (
          <View style={styles.detailRow}>
            <Ionicons name="document" size={18} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>File Type</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>{resource.file_mime_type}</Text>
            </View>
          </View>
        )}

        {resource.language && resource.language !== 'en' && (
          <View style={styles.detailRow}>
            <Ionicons name="language" size={18} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Language</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>{resource.language.toUpperCase()}</Text>
            </View>
          </View>
        )}

        {resource.license_type && (
          <View style={styles.detailRow}>
            <Ionicons name="shield-checkmark" size={18} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>License</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>{resource.license_type.replace('_', ' ').toUpperCase()}</Text>
            </View>
          </View>
        )}

        {resource.collection?.name && (
          <View style={styles.detailRow}>
            <Ionicons name="albums" size={18} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Collection</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>{resource.collection.name}</Text>
            </View>
          </View>
        )}

        {resource.tags && resource.tags.length > 0 && (
          <View style={styles.tagsSection}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary, marginBottom: 8 }]}>Tags</Text>
            <View style={styles.tagsRow}>
              {resource.tags.map((tag, i) => (
                <View key={i} style={[styles.tag, { backgroundColor: colors.primary + '15' }]}>
                  <Text style={[styles.tagText, { color: colors.primary }]}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>

      {/* Actions */}
      <View style={styles.actionsRow}>
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.primary }]} onPress={handleOpen} disabled={actionLoading}>
          <Ionicons name="open" size={18} color="#fff" />
          <Text style={styles.actionBtnText}>Open</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.secondary }]} onPress={handleShare}>
          <Ionicons name="share-social" size={18} color="#fff" />
          <Text style={styles.actionBtnText}>Share</Text>
        </TouchableOpacity>
      </View>

      {/* Related Resources */}
      {related.length > 0 && (
        <View style={[styles.relatedCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>More {typeLabel}s</Text>
          {related.map(r => {
            const rIcon = TYPE_ICONS[r.resource_type] || 'document';
            const rColor = TYPE_COLORS[r.resource_type] || '#6b7280';
            return (
              <TouchableOpacity
                key={r.id}
                style={[styles.relatedItem, { borderBottomColor: colors.border }]}
                onPress={() => router.push(`/(education)/resource-detail?id=${r.id}`)}
              >
                <View style={[styles.relatedIcon, { backgroundColor: rColor + '20' }]}>
                  <Ionicons name={rIcon as any} size={18} color={rColor} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.relatedTitle, { color: colors.text }]} numberOfLines={1}>{r.title}</Text>
                  <Text style={[styles.relatedMeta, { color: colors.textSecondary }]}>{r.view_count} views</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  loadingText: { marginTop: 12, fontSize: 14 },
  errorText: { marginTop: 12, fontSize: 14, textAlign: 'center' },
  retryBtn: { marginTop: 16, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8 },
  retryText: { color: '#fff', fontWeight: '600' },
  emptyTitle: { marginTop: 16, fontSize: 18, fontWeight: '700' },
  emptySub: { marginTop: 4, fontSize: 14, textAlign: 'center', maxWidth: 280 },
  hero: { alignItems: 'center', paddingVertical: 32, paddingHorizontal: 24 },
  heroIcon: { width: 80, height: 80, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  typePill: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, marginBottom: 12 },
  typePillText: { fontSize: 12, fontWeight: '700', textTransform: 'capitalize' },
  heroTitle: { fontSize: 22, fontWeight: '800', textAlign: 'center' },
  heroDesc: { fontSize: 14, textAlign: 'center', marginTop: 8, lineHeight: 20, maxWidth: 320 },
  statsBar: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 16, borderBottomWidth: 1 },
  statItem: { alignItems: 'center', flex: 1 },
  statValue: { fontSize: 16, fontWeight: '700', marginTop: 4 },
  statLabel: { fontSize: 11, marginTop: 2 },
  detailsCard: { margin: 16, borderRadius: 16, padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  detailRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  detailLabel: { fontSize: 12 },
  detailValue: { fontSize: 14, fontWeight: '600', marginTop: 2 },
  tagsSection: { paddingTop: 10 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  tagText: { fontSize: 11, fontWeight: '600' },
  actionsRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 16, marginBottom: 16 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12, gap: 8 },
  actionBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  relatedCard: { marginHorizontal: 16, marginBottom: 24, borderRadius: 16, padding: 16 },
  relatedItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1 },
  relatedIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  relatedTitle: { fontSize: 14, fontWeight: '600' },
  relatedMeta: { fontSize: 11, marginTop: 2 },
});
