import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useWalletStore } from '@/lib/wallet/state/wallet.store';

export default function HistoryScreen() {
  const { transactions } = useWalletStore();

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Transaction History</Text>
      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View>
              <Text style={styles.type}>{item.type}</Text>
              <Text style={styles.date}>{item.created_at}</Text>
            </View>
            <Text style={[styles.amount, item.amount > 0 ? styles.positive : styles.negative]}>
              {item.amount > 0 ? '+' : ''}{item.amount.toFixed(2)}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#000' },
  header: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#222' },
  type: { color: '#fff', fontSize: 14 },
  date: { color: '#666', fontSize: 12, marginTop: 2 },
  amount: { fontSize: 14, fontWeight: '600' },
  positive: { color: '#0f0' },
  negative: { color: '#f00' },
});
