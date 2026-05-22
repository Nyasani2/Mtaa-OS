import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { AccountingService } from '../services/accountingService';

interface Props {
  shopId: string;
}

export default function AccountingDashboard({ shopId }: Props) {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [profitLoss, setProfitLoss] = useState({ revenue: 0, expenses: 0, profit: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [acc, exp, pl] = await Promise.all([
          AccountingService.getAccounts(shopId),
          AccountingService.getExpenses(shopId),
          AccountingService.getProfitLoss(shopId, '2024-01-01', '2024-12-31')
        ]);
        setAccounts(acc);
        setExpenses(exp);
        setProfitLoss(pl);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [shopId]);

  if (loading) return <Text>Loading...</Text>;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Accounting Dashboard</Text>
      <View style={styles.card}>
        <Text>Revenue: ${profitLoss.revenue.toFixed(2)}</Text>
        <Text>Expenses: ${profitLoss.expenses.toFixed(2)}</Text>
        <Text>Profit: ${profitLoss.profit.toFixed(2)}</Text>
      </View>
      <Text style={styles.section}>Accounts ({accounts.length})</Text>
      {accounts.map((a) => (
        <View key={a.id} style={styles.row}>
          <Text>{a.name || a.account_type}</Text>
          <Text>${a.balance?.toFixed(2) || '0.00'}</Text>
        </View>
      ))}
      <Text style={styles.section}>Expenses ({expenses.length})</Text>
      {expenses.map((e) => (
        <View key={e.id} style={styles.row}>
          <Text>{e.description || e.category}</Text>
          <Text>${e.amount?.toFixed(2) || '0.00'}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  card: { backgroundColor: '#f5f5f5', padding: 16, borderRadius: 8, marginBottom: 16 },
  section: { fontSize: 16, fontWeight: '600', marginTop: 16, marginBottom: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#eee' }
});
