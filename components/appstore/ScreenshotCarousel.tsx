import React from 'react';
import { View, Text, Image, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { Screenshot } from '@/hooks/useAppStore';

const { width } = Dimensions.get('window');
const CARD_WIDTH = 160;
const CARD_HEIGHT = 320;

interface ScreenshotCarouselProps {
  screenshots: Screenshot[];
}

export function ScreenshotCarousel({ screenshots }: ScreenshotCarouselProps) {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        snapToInterval={CARD_WIDTH + 12}
        decelerationRate="fast"
      >
        {screenshots.map((shot, index) => (
          <View key={shot.id} style={styles.cardWrapper}>
            <View style={[styles.labelBadge, { backgroundColor: shot.accent }]}>
              <Text style={styles.labelText}>{shot.label}</Text>
            </View>
            <View style={[styles.card, { borderColor: shot.accent }]}>
              <Image source={{ uri: shot.uri }} style={styles.image} resizeMode="cover" />
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  cardWrapper: {
    marginRight: 12,
    position: 'relative',
  },
  labelBadge: {
    position: 'absolute',
    top: -10,
    left: 8,
    zIndex: 10,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  labelText: {
    color: '#121212',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 16,
    borderWidth: 3,
    overflow: 'hidden',
    backgroundColor: '#1C1C1C',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
