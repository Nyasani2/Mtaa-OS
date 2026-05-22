import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import { CourtJuryService } from '../services/courtJury';

interface Props {
  onSubmit?: () => void;
}

export default function JurorForm({ onSubmit }: Props) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [occupation, setOccupation] = useState('');

  const handleSubmit = async () => {
    await CourtJuryService.assignJuror({
      first_name: firstName,
      last_name: lastName,
      id_number: idNumber,
      occupation,
      is_available: true
    } as any);
    onSubmit?.();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add Juror</Text>
      <TextInput style={styles.input} placeholder="First Name" value={firstName} onChangeText={setFirstName} />
      <TextInput style={styles.input} placeholder="Last Name" value={lastName} onChangeText={setLastName} />
      <TextInput style={styles.input} placeholder="ID Number" value={idNumber} onChangeText={setIdNumber} />
      <TextInput style={styles.input} placeholder="Occupation" value={occupation} onChangeText={setOccupation} />
      <Button title="Add Juror" onPress={handleSubmit} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 4, padding: 8, marginBottom: 8 }
});
