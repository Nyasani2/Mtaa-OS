import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES } from '@/constants/theme';
import { AppItem } from '@/types/appstore';

const { width } = Dimensions.get('window');
const BANNER_WIDTH = width - SIZES.md * 2;
const BANNER_HEIGHT = 160;

interface FeaturedBannerProps {
  apps: AppItem[];
}

export function FeaturedBanner({ apps }: FeaturedBannerProps) {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = React.useState(0);

  if (!apps || apps.length === 0) return null;

  const featured = apps.slice(0, 3);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Featured</Text>
        <TouchableOpacity onPress={() => router.push('/appstore/top-charts' as any)}>
          <Text style={styles.seeAll}>See All</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.carousel}>
        {featured.map((app, index) => (
          <TouchableOpacity
            key={app.id}
            style={[
              styles.banner,
              index === activeIndex ? styles.bannerActive : styles.bannerInactive,
            ]}
            onPress={() => router.push(`/appstore/${app.id}` as any)}
            activeOpacity={0.85}
          >
            <Image
              source={{ uri: app.bannerImage || app.icon }}
              style={styles.bannerImage}
              resizeMode="cover"
            />
            <View style={styles.bannerOverlay}>
              <View style={styles.bannerContent}>
                <Image source={{ uri: app.icon }} style={styles.bannerIcon} />
                <View style={styles.bannerTextBlock}>
                  <Text style={styles.bannerName} numberOfLines={1}>{app.name}</Text>
                  <Text style={styles.bannerCategory}>{app.category}</Text>
                </View>
              </View>
              <View style={styles.bannerBadge}>
                <Text style={styles.bannerBadgeText}>FEATURED</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Dots */}
      <View style={styles.dotsRow}>
        {featured.map((_, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.dot, i === activeIndex && styles.dotActive]}
            onPress={() => setActiveIndex(i)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: SIZES.md },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SIZES.md,
    marginBottom: SIZES.sm,
  },
  sectionTitle: {
    fontFamily: FONTS.bold,
    fontSize: 20,
    color: COLORS.text,
  },
  seeAll: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    color: COLORS.primary,
  },
  carousel: {
    paddingHorizontal: SIZES.md,
    gap: SIZES.sm,
  },
  banner: {
    width: BANNER_WIDTH,
    height: BANNER_HEIGHT,
    borderRadius: SIZES.md,
    overflow: 'hidden',
    marginBottom: SIZES.sm,
    backgroundColor: COLORS.surface,
  },
  bannerActive: { opacity: 1 },
  bannerInactive: { opacity: 0.6 },
  bannerImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  bannerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'space-between',
    padding: SIZES.md,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.sm,
  },
  bannerIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  bannerTextBlock: { flex: 1 },
  bannerName: {
    fontFamily: FONTS.bold,
    fontSize: 18,
    color: '#fff',
  },
  bannerCategory: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  bannerBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SIZES.sm,
    paddingVertical: 4,
    borderRadius: 4,
  },
  bannerBadgeText: {
    fontFamily: FONTS.bold,
    fontSize: 10,
    color: '#fff',
    letterSpacing: 1,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: SIZES.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.border,
  },
  dotActive: {
    backgroundColor: COLORS.primary,
    width: 20,
  },
});
