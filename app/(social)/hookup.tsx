import { View, StyleSheet } from 'react-native';
import { HookupShell } from '@/lib/hookup';

export default function HookupScreen() {
  return (
    <View style={styles.container}>
      <HookupShell />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050816' },
});
