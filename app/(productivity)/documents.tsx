import { View, StyleSheet } from 'react-native';
import { DocumentsShell } from '@/lib/documents';

export default function DocumentsScreen() {
  return (
    <View style={styles.container}>
      <DocumentsShell />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050816' },
});
