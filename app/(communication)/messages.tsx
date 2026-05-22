import { View, StyleSheet } from 'react-native';
import { MessagesShell } from '@/lib/messages';

export default function MessagesScreen() {
  return (
    <View style={styles.container}>
      <MessagesShell />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050816' },
});
