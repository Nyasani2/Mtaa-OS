import { View, StyleSheet } from 'react-native';
import { SchedulerShell } from '@/lib/scheduler';

export default function SchedulerScreen() {
  return (
    <View style={styles.container}>
      <SchedulerShell />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050816' },
});
