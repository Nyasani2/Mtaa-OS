import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import { PrisonInmatesService } from '../services/prisonInmates';

interface Props {
  facilityId: string;
  onSubmit?: () => void;
}

export default function InmateForm({ facilityId, onSubmit }: Props) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [inmateNumber, setInmateNumber] = useState('');
  const [crime, setCrime] = useState('');
  const [sentenceStart, setSentenceStart] = useState('');
  const [sentenceEnd, setSentenceEnd] = useState('');

  const handleSubmit = async () => {
    await PrisonInmatesService.createInmate({
      facility_id: facilityId,
      first_name: firstName,
      last_name: lastName,
      inmate_number: inmateNumber,
      crime_description: crime,
      sentence_start: sentenceStart,
      sentence_end: sentenceEnd,
      status: 'active',
      parole_status: 'pending'
    });
    onSubmit?.();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add Inmate</Text>
      <TextInput style={styles.input} placeholder="First Name" value={firstName} onChangeText={setFirstName} />
      <TextInput style={styles.input} placeholder="Last Name" value={lastName} onChangeText={setLastName} />
      <TextInput style={styles.input} placeholder="Inmate Number" value={inmateNumber} onChangeText={setInmateNumber} />
      <TextInput style={styles.input} placeholder="Crime Description" value={crime} onChangeText={setCrime} multiline />
      <TextInput style={styles.input} placeholder="Sentence Start (YYYY-MM-DD)" value={sentenceStart} onChangeText={setSentenceStart} />
      <TextInput style={styles.input} placeholder="Sentence End (YYYY-MM-DD)" value={sentenceEnd} onChangeText={setSentenceEnd} />
      <Button title="Add Inmate" onPress={handleSubmit} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 4, padding: 8, marginBottom: 8 }
});
