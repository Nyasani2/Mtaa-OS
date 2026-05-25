// lib/civic/prisons/components/ParoleReviewForm.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { PrisonParoleReview, ReviewType } from '@/types/prisons';

interface ParoleData {
  inmate_id: string;
  review_date: string;
  review_type: ReviewType;
  board_members: string;
  rehabilitation_notes: string;
}

export function ParoleReviewForm({ onSubmit }: { onSubmit?: (data: ParoleData) => void }) {
  const [form, setForm] = useState<ParoleData>({
    inmate_id: '',
    review_date: '',
    review_type: 'parole',
    board_members: '',
    rehabilitation_notes: '',
  });

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Parole Review</Text>
      <TextInput style={styles.input} placeholder="Inmate ID" value={form.inmate_id} onChangeText={v => setForm(f => ({ ...f, inmate_id: v }))} />
      <TextInput style={styles.input} placeholder="Review Date (YYYY-MM-DD)" value={form.review_date} onChangeText={v => setForm(f => ({ ...f, review_date: v }))} />
      <TextInput style={styles.input} placeholder="Board Members (comma separated)" value={form.board_members} onChangeText={v => setForm(f => ({ ...f, board_members: v }))} />
      <TextInput style={styles.input} placeholder="Rehabilitation Notes" value={form.rehabilitation_notes} onChangeText={v => setForm(f => ({ ...f, rehabilitation_notes: v }))} multiline />
      <TouchableOpacity style={styles.button} onPress={() => onSubmit?.(form)}>
        <Text style={styles.buttonText}>Submit Review</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  header: { fontSize: 20, fontWeight: '700', marginBottom: 16 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 16 },
  button: { backgroundColor: '#2563eb', padding: 16, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
