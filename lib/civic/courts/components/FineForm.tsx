import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import { CourtFinesService } from '../services/courtFines';

interface Props {
  caseId: string;
  partyId: string;
  onSubmit?: () => void;
}

export default function FineForm({ caseId, partyId, onSubmit }: Props) {
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');

  const handleSubmit = async () => {
    await CourtFinesService.createFine({
      case_id: caseId,
      party_id: partyId,
      amount: parseFloat(amount),
      amount_paid: 0,
      payment_status: 'pending',
      due_date: dueDate || undefined
    });
    onSubmit?.();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Issue Fine</Text>
      <TextInput style={styles.input} placeholder="Amount" value={amount} onChangeText={setAmount} keyboardType="numeric" />
      <TextInput style={styles.input} placeholder="Due Date (YYYY-MM-DD)" value={dueDate} onChangeText={setDueDate} />
      <Button title="Issue Fine" onPress={handleSubmit} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 4, padding: 8, marginBottom: 8 }
});
