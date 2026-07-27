import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { Star } from 'lucide-react-native';

interface Props { reviews?: any[]; }

export default function ReviewList({ reviews }: Props) {
  if (!reviews?.length) return <Text style={styles.empty}>No reviews yet</Text>;

  const avg = reviews.reduce((s, r) => s + (r.overall_rating || r.rating || 0), 0) / reviews.length;

  return (
    <View>
      <View style={styles.avgRow}>
        <Star size={20} color="#f59e0b" fill="#f59e0b" />
        <Text style={styles.avgText}>{avg.toFixed(1)} · {reviews.length} reviews</Text>
      </View>
      <FlatList
        data={reviews}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        renderItem={({ item }) => (
          <View style={styles.review}>
            <View style={styles.reviewHeader}>
              <View style={styles.avatar}><Text style={styles.avatarText}>{(item.reviewer?.full_name || item.author || 'G')[0]}</Text></View>
              <View>
                <Text style={styles.author}>{item.reviewer?.full_name || item.author || 'Guest'}</Text>
                <Text style={styles.date}>{new Date(item.created_at).toLocaleDateString()}</Text>
              </View>
            </View>
            <View style={styles.stars}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={12} color={i < (item.overall_rating || item.rating || 0) ? '#f59e0b' : '#e5e7eb'} fill={i < (item.overall_rating || item.rating || 0) ? '#f59e0b' : '#e5e7eb'} />
              ))}
            </View>
            <Text style={styles.text}>{item.comment || ''}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  avgRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  avgText: { fontSize: 18, fontWeight: '700', color: '#1a1a1a' },
  review: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#e5e0d5', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 14, fontWeight: '600', color: '#1a1a1a' },
  author: { fontWeight: '600', color: '#1a1a1a' },
  date: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  stars: { flexDirection: 'row', gap: 2, marginBottom: 6 },
  text: { color: '#374151', lineHeight: 20 },
  empty: { textAlign: 'center', color: '#9ca3af', padding: 20 },
});
