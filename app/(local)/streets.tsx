import { View, StyleSheet } from 'react-native';
import { StreetsShell } from '@/lib/streets';

export default function StreetsScreen() {
  return (
    <View style={styles.container}>
      <StreetsShell />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050816' },
});
