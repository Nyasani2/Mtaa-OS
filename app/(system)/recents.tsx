import { View, StyleSheet } from 'react-native';
import { RecentsShell } from '@/lib/recents';

export default function RecentsScreen() {
  return (
    <View style={styles.container}>
      <RecentsShell />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050816' },
});
