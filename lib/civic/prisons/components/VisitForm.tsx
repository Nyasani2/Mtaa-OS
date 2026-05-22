import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import { PrisonVisitsService } from '../services/prisonVisits';

interface Props {
  facilityId: string;
  onSubmit?: () => void;
}

export default function VisitForm({ facilityId, onSubmit }: Props) {
  const [inmateId, setInmateId] = useState('');
  const [visitorName, setVisitorName] = useState('');
  const [visitorIdNumber, setVisitorIdNumber] = useState('');
  const [visitorRelationship, setVisitorRelationship] = useState('');
  const [visitType, setVisitType] = useState<'family' | 'legal' | 'medical' | 'official'>('family');
  const [scheduledAt, setScheduledAt] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('30');

  const handleSubmit = async () => {
    await PrisonVisitsService.createVisit({
      facility_id: facilityId,
      inmate_id: inmateId,
      visitor_name: visitorName,
      visitor_id_number: visitorIdNumber,
      visitor_relationship: visitorRelationship,
      visit_type: visitType,
      scheduled_at: scheduledAt,
      duration_minutes: parseInt(durationMinutes),
      status: 'scheduled'
    });
    onSubmit?.();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Schedule Visit</Text>
      <TextInput style={styles.input} placeholder="Inmate ID" value={inmateId} onChangeText={setInmateId} />
      <TextInput style={styles.input} placeholder="Visitor Name" value={visitorName} onChangeText={setVisitorName} />
      <TextInput style={styles.input} placeholder="Visitor ID Number" value={visitorIdNumber} onChangeText={setVisitorIdNumber} />
      <TextInput style={styles.input} placeholder="Relationship" value={visitorRelationship} onChangeText={setVisitorRelationship} />
      <TextInput style={styles.input} placeholder="Visit Type (family/legal/medical/official)" value={visitType} onChangeText={(text) => setVisitType(text as any)} />
      <TextInput style={styles.input} placeholder="Scheduled At (YYYY-MM-DD HH:MM)" value={scheduledAt} onChangeText={setScheduledAt} />
      <TextInput style={styles.input} placeholder="Duration (minutes)" value={durationMinutes} onChangeText={setDurationMinutes} keyboardType="numeric" />
      <Button title="Schedule" onPress={handleSubmit} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 4, padding: 8, marginBottom: 8 }
});
