import { View, StyleSheet } from 'react-native';
import { SettingsShell } from '@/lib/settings';

export default function SettingsScreen() {
  return (
    <View style={styles.container}>
      <SettingsShell />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050816' },
});
