import { View, StyleSheet } from 'react-native';
import { AnalyticsShell } from '@/lib/analytics';

export default function AnalyticsScreen() {
  return (
    <View style={styles.container}>
      <AnalyticsShell />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050816' },
});
