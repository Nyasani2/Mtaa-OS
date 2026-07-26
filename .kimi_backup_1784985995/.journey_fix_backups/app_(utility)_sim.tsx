import { View, StyleSheet } from 'react-native';
import { SIMShell } from '@/lib/sim';

export default function SIMScreen() {
  return (
    <View style={styles.container}>
      <SIMShell />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050816' },
});
