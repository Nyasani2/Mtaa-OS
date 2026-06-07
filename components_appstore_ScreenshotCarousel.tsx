import React from 'react';
import { View, ScrollView, Image, StyleSheet, Dimensions } from 'react-native';

interface Props {
  screenshots: string[];
}

export function ScreenshotCarousel({ screenshots }: Props) {
  return (
    <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={styles.container}>
      {screenshots.map((uri, i) => (
        <Image key={i} source={{ uri }} style={styles.image} resizeMode="cover" />
      ))}
    </ScrollView>
  );
}

const { width } = Dimensions.get('window');
const styles = StyleSheet.create({
  container: { flexDirection: 'row', marginVertical: 16 },
  image: { width: width * 0.8, height: 200, borderRadius: 12, marginRight: 12 },
});

export default ScreenshotCarousel;
