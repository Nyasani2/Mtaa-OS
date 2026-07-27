import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Star, Heart } from 'lucide-react-native';

interface Props {
  listing: any;
  onPress?: () => void;
  onToggleSave?: () => void;
  isSaved?: boolean;
  variant?: 'full' | 'compact';
}

export default function StayCard({ listing, onPress, onToggleSave, isSaved, variant = 'full' }: Props) {
  const imageUrl = listing?.cover_image || listing?.images?.[0] || 'https://via.placeholder.com/400x300';
  const price = listing?.price_per_night || listing?.price || 0;
  const currency = listing?.currency || 'KES';
  const rating = listing?.average_rating || listing?.rating || 0;
  const reviews = listing?.review_count || listing?.reviewCount || 0;
  const town = listing?.town || listing?.location || listing?.city || '';

  if (variant === 'compact') {
    return (
      <TouchableOpacity style={styles.compactCard} onPress={onPress} activeOpacity={0.85}>
        <Image source={{ uri: imageUrl }} style={styles.compactImage} />
        <View style={styles.compactOverlay}>
          <TouchableOpacity style={styles.saveBtnCompact} onPress={(e) => { e.stopPropagation(); onToggleSave?.(); }}>
            <Heart size={18} color={isSaved ? '#ef4444' : '#fff'} fill={isSaved ? '#ef4444' : 'none'} />
          </TouchableOpacity>
        </View>
        <View style={styles.compactInfo}>
          <Text style={styles.compactTown} numberOfLines={1}>{town}</Text>
          <Text style={styles.compactPrice}>{currency} {price.toLocaleString()}<Text style={styles.per}> / night</Text></Text>
          <View style={styles.ratingRow}>
            <Star size={12} color="#f59e0b" fill="#f59e0b" />
            <Text style={styles.ratingText}>{rating || 'New'} {reviews > 0 ? `(${reviews})` : ''}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.imageWrap}>
        <Image source={{ uri: imageUrl }} style={styles.image} />
        <TouchableOpacity style={styles.saveBtn} onPress={(e) => { e.stopPropagation(); onToggleSave?.(); }}>
          <Heart size={20} color={isSaved ? '#ef4444' : '#1a1a1a'} fill={isSaved ? '#ef4444' : 'none'} />
        </TouchableOpacity>
        {listing?.instant_book && (
          <View style={styles.badge}><Text style={styles.badgeText}>Instant Book</Text></View>
        )}
      </View>
      <View style={styles.info}>
        <View style={styles.headerRow}>
          <Text style={styles.town} numberOfLines={1}>{town}</Text>
          <View style={styles.ratingRow}>
            <Star size={14} color="#f59e0b" fill="#f59e0b" />
            <Text style={styles.ratingText}>{rating || 'New'}</Text>
          </View>
        </View>
        <Text style={styles.title} numberOfLines={1}>{listing?.title || 'Stay'}</Text>
        <Text style={styles.meta}>{listing?.bedrooms || 0} bed · {listing?.bathrooms || 0} bath</Text>
        <Text style={styles.price}>{currency} {price.toLocaleString()}<Text style={styles.per}> / night</Text></Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', marginBottom: 16, elevation: 2 },
  imageWrap: { position: 'relative', height: 220 },
  image: { width: '100%', height: '100%', borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  saveBtn: { position: 'absolute', top: 12, right: 12, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center' },
  badge: { position: 'absolute', bottom: 12, left: 12, backgroundColor: '#1a5c4b', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  info: { padding: 14 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  town: { fontSize: 14, fontWeight: '600', color: '#1a1a1a', flex: 1 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontSize: 13, color: '#1a1a1a', fontWeight: '500' },
  title: { fontSize: 15, color: '#6b7280', marginTop: 2 },
  meta: { fontSize: 13, color: '#9ca3af', marginTop: 2 },
  price: { fontSize: 16, fontWeight: '700', color: '#1a1a1a', marginTop: 6 },
  per: { fontSize: 13, fontWeight: '400', color: '#6b7280' },

  compactCard: { width: 240, marginRight: 12, borderRadius: 16, overflow: 'hidden', backgroundColor: '#fff', elevation: 2 },
  compactImage: { width: '100%', height: 160 },
  compactOverlay: { position: 'absolute', top: 0, left: 0, right: 0, height: 160, justifyContent: 'flex-start', alignItems: 'flex-end', padding: 10 },
  saveBtnCompact: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center' },
  compactInfo: { padding: 12 },
  compactTown: { fontSize: 14, fontWeight: '600', color: '#1a1a1a' },
  compactPrice: { fontSize: 14, fontWeight: '700', color: '#1a1a1a', marginTop: 4 },
});
