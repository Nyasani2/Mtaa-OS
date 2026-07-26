import { View, StyleSheet } from 'react-native';
import { ClockShell } from '@/lib/clock';

export default function ClockScreen() {
  return (
    <View style={styles.container}>
      <ClockShell />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050816' },
});
