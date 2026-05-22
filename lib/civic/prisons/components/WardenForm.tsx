import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import { PrisonWardensService } from '../services/prisonWardens';

interface Props {
  facilityId: string;
  onSubmit?: () => void;
}

export default function WardenForm({ facilityId, onSubmit }: Props) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [rank, setRank] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const handleSubmit = async () => {
    await PrisonWardensService.createWarden({
      facility_id: facilityId,
      first_name: firstName,
      last_name: lastName,
      rank,
      email,
      phone,
      is_active: true
    });
    onSubmit?.();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add Warden</Text>
      <TextInput style={styles.input} placeholder="First Name" value={firstName} onChangeText={setFirstName} />
      <TextInput style={styles.input} placeholder="Last Name" value={lastName} onChangeText={setLastName} />
      <TextInput style={styles.input} placeholder="Rank" value={rank} onChangeText={setRank} />
      <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" />
      <TextInput style={styles.input} placeholder="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
      <Button title="Add Warden" onPress={handleSubmit} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 4, padding: 8, marginBottom: 8 }
});
