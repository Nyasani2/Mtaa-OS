import React, { useState } from 'react';
import { View, TextInput, Button, Text, StyleSheet } from 'react-native';
import { useTransport } from '../controllers/useTransport';

const IncidentReport: React.FC = () => {
  const [location, setLocation] = useState('');
  const [county, setCounty] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'accident' | 'breakdown' | 'hazard' | 'traffic_jam' | 'road_closure'>('accident');
  const [severity, setSeverity] = useState<'critical' | 'high' | 'medium' | 'low'>('medium');
  const { reportIncident, isLoading, error } = useTransport();

  const handleSubmit = async () => {
    if (!location.trim() || !description.trim()) return;
    await reportIncident({
      reporter_id: 'current-user',
      type,
      incident_type: type,
      location,
      county,
      description,
      severity,
      status: 'reported',
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Report Road Incident</Text>
      <TextInput style={styles.input} placeholder="Location" value={location} onChangeText={setLocation} />
      <TextInput style={styles.input} placeholder="County" value={county} onChangeText={setCounty} />
      <TextInput style={styles.input} placeholder="Description" value={description} onChangeText={setDescription} multiline />
      <Button title={isLoading ? 'Submitting...' : 'Submit Report'} onPress={handleSubmit} disabled={isLoading} />
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 12 },
  error: { color: '#ef4444', marginTop: 12 },
});

export default IncidentReport;
