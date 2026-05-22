import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import { CourtHearingsService } from '../services/courtHearings';
import { useHearings } from '../hooks/useHearings';
import { useCourts } from '../hooks/useCourts';

interface Props {
  caseId: string;
  courtHouseId: string;
  onSubmit?: () => void;
}

export default function HearingForm({ caseId, courtHouseId, onSubmit }: Props) {
  const [hearingType, setHearingType] = useState('');
  const [courtRoomId, setCourtRoomId] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [rooms, setRooms] = useState<any[]>([]);

  useEffect(() => {
    CourtHearingsService.getCourtRooms(courtHouseId).then(setRooms);
  }, [courtHouseId]);

  const handleSubmit = async () => {
    await CourtHearingsService.createHearing({
      case_id: caseId,
      hearing_type: hearingType,
      court_room_id: courtRoomId,
      scheduled_date: scheduledDate,
      status: 'scheduled'
    });
    onSubmit?.();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Schedule Hearing</Text>
      <TextInput style={styles.input} placeholder="Hearing Type" value={hearingType} onChangeText={setHearingType} />
      <TextInput style={styles.input} placeholder="Court Room ID" value={courtRoomId} onChangeText={setCourtRoomId} />
      <TextInput style={styles.input} placeholder="Scheduled Date (YYYY-MM-DD HH:MM)" value={scheduledDate} onChangeText={setScheduledDate} />
      <Text style={styles.label}>Available Rooms: {rooms.map((r: any) => r.name).join(', ')}</Text>
      <Button title="Schedule" onPress={handleSubmit} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 4, padding: 8, marginBottom: 8 },
  label: { fontSize: 12, color: '#666', marginBottom: 8 }
});
