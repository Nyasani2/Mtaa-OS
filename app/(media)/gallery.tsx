import { View, StyleSheet } from 'react-native';
import { GalleryShell } from '@/lib/gallery';

export default function GalleryScreen() {
  return (
    <View style={styles.container}>
      <GalleryShell />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050816' },
});
