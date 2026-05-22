import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import { PrisonIncidentsService } from '../services/prisonIncidents';

interface Props {
  facilityId: string;
  onSubmit?: () => void;
}

export default function IncidentForm({ facilityId, onSubmit }: Props) {
  const [incidentType, setIncidentType] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [severity, setSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [inmateId, setInmateId] = useState('');
  const [reportedBy, setReportedBy] = useState('');

  const handleSubmit = async () => {
    await PrisonIncidentsService.createIncident({
      facility_id: facilityId,
      incident_type: incidentType,
      description,
      location,
      severity,
      inmate_id: inmateId || undefined,
      reported_by: reportedBy,
      status: 'reported'
    });
    onSubmit?.();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Report Incident</Text>
      <TextInput style={styles.input} placeholder="Incident Type" value={incidentType} onChangeText={setIncidentType} />
      <TextInput style={styles.input} placeholder="Description" value={description} onChangeText={setDescription} multiline />
      <TextInput style={styles.input} placeholder="Location" value={location} onChangeText={setLocation} />
      <TextInput style={styles.input} placeholder="Severity (low/medium/high/critical)" value={severity} onChangeText={(text) => setSeverity(text as any)} />
      <TextInput style={styles.input} placeholder="Inmate ID (optional)" value={inmateId} onChangeText={setInmateId} />
      <TextInput style={styles.input} placeholder="Reported By" value={reportedBy} onChangeText={setReportedBy} />
      <Button title="Submit" onPress={handleSubmit} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 4, padding: 8, marginBottom: 8 }
});
