import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CreditTransaction } from '../history/user-credit-history';

interface TransactionItemProps {
  transaction: CreditTransaction;
}

const TransactionItem: React.FC<TransactionItemProps> = ({ transaction }) => {
  const getColor = () => {
    switch (transaction.type) {
      case 'transfer': return '#3b82f6';
      case 'debit': return '#ef4444';
      case 'loan': return '#f59e0b';
      case 'investment': return '#10b981';
      case 'reward': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  return (
    <View style={[styles.container, { borderLeftColor: getColor(), borderLeftWidth: 4 }]}>
      <Text style={styles.type}>{transaction.type.toUpperCase()}</Text>
      <Text style={styles.amount}>${transaction.amount.toFixed(2)}</Text>
      <Text style={styles.desc}>{transaction.description}</Text>
      <Text style={styles.date}>{new Date(transaction.createdAt).toLocaleDateString()}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { backgroundColor: '#fff', padding: 12, marginVertical: 4, borderRadius: 8 },
  type: { fontSize: 12, fontWeight: 'bold', color: '#374151' },
  amount: { fontSize: 16, fontWeight: 'bold', marginTop: 4 },
  desc: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  date: { fontSize: 10, color: '#9ca3af', marginTop: 4 },
});

export default TransactionItem;
