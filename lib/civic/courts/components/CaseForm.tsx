import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import { CourtCasesService } from '../services/courtCases';

interface Props {
  courtHouseId: string;
  onSubmit?: () => void;
}

export default function CaseForm({ courtHouseId, onSubmit }: Props) {
  const [caseNumber, setCaseNumber] = useState('');
  const [caseType, setCaseType] = useState('');
  const [caseCategory, setCaseCategory] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [policeCaseRef, setPoliceCaseRef] = useState('');

  const handleSubmit = async () => {
    await CourtCasesService.createCase({
      court_house_id: courtHouseId,
      case_number: caseNumber,
      case_type: caseType,
      case_category: caseCategory,
      title,
      description,
      priority,
      police_case_ref: policeCaseRef || undefined,
      filing_date: new Date().toISOString(),
      status: 'filed'
    });
    onSubmit?.();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>File New Case</Text>
      <TextInput style={styles.input} placeholder="Case Number" value={caseNumber} onChangeText={setCaseNumber} />
      <TextInput style={styles.input} placeholder="Case Type" value={caseType} onChangeText={setCaseType} />
      <TextInput style={styles.input} placeholder="Category" value={caseCategory} onChangeText={setCaseCategory} />
      <TextInput style={styles.input} placeholder="Title" value={title} onChangeText={setTitle} />
      <TextInput style={styles.input} placeholder="Description" value={description} onChangeText={setDescription} multiline />
      <TextInput style={styles.input} placeholder="Priority (low/medium/high/urgent)" value={priority} onChangeText={(text) => setPriority(text as any)} />
      <TextInput style={styles.input} placeholder="Police Case Ref (optional)" value={policeCaseRef} onChangeText={setPoliceCaseRef} />
      <Button title="File Case" onPress={handleSubmit} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 4, padding: 8, marginBottom: 8 }
});
