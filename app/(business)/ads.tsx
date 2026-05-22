import { View, StyleSheet } from 'react-native';
import { AdsShell } from '@/lib/ads';

export default function AdsScreen() {
  return (
    <View style={styles.container}>
      <AdsShell />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050816' },
});
