import { View, StyleSheet } from 'react-native';
import { WalletShell } from '@/lib/wallet';

export default function WalletScreen() {
  return (
    <View style={styles.container}>
      <WalletShell />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050816' },
});
