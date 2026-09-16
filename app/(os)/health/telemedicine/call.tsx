// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';

export default function TelemedicineCallScreen() {
  const router = useRouter();
  const { appointmentId } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [callData, setCallData] = useState<any>(null);

  useEffect(() => {
    if (appointmentId) fetchCallData();
  }, [appointmentId]);

  const fetchCallData = async () => {
    try {
      const { data, error } = await supabase
        .from('health_appointments')
        .select(`id, scheduled_date, scheduled_time, status, doctor:staff_id(full_name, phone), patient:patient_id(first_name, last_name, phone)`)
        .eq('id', appointmentId)
        .maybeSingle();
      if (error) throw error;
      setCallData(data);
    } catch (err: any) {
      Alert.alert('Error', 'Failed to load call details: ' + err.message);
      router.back();
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#3b82f6" /><Text style={styles.loadingText}>Connecting...</Text></View>;

  const doctorName = callData?.doctor?.full_name || 'Unknown Doctor';
  const patientName = callData?.patient ? `${callData.patient.first_name} ${callData.patient.last_name}` : 'Unknown Patient';
  const isDoctorView = true; 

  return (
    <View style={styles.container}>
      <View style={styles.videoPlaceholder}>
        <Ionicons name="videocam-off" size={64} color="#94a3b8" />
        <Text style={styles.videoText}>Video stream initializing...</Text>
      </View>
      <View style={styles.infoPanel}>
        <Text style={styles.infoTitle}>{isDoctorView ? 'Patient' : 'Doctor'}</Text>
        <Text style={styles.infoName}>{isDoctorView ? patientName : doctorName}</Text>
        <Text style={styles.infoTime}>{callData?.scheduled_date ? new Date(callData.scheduled_date).toLocaleDateString() : 'Today'} • {callData?.scheduled_time || 'Now'}</Text>
      </View>
      <View style={styles.controls}>
        <TouchableOpacity style={[styles.controlBtn, styles.muteBtn]}><Ionicons name="mic-off" size={28} color="#fff" /></TouchableOpacity>
        <TouchableOpacity style={[styles.controlBtn, styles.endBtn]} onPress={() => router.back()}><Ionicons name="call" size={32} color="#fff" /></TouchableOpacity>
        <TouchableOpacity style={[styles.controlBtn, styles.videoBtn]}><Ionicons name="videocam-off" size={28} color="#fff" /></TouchableOpacity>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' },
  loadingText: { color: '#94a3b8', marginTop: 16, fontSize: 16 },
  videoPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1e293b' },
  videoText: { color: '#94a3b8', marginTop: 16, fontSize: 16 },
  infoPanel: { padding: 20, alignItems: 'center', backgroundColor: '#1e293b' },
  infoTitle: { color: '#94a3b8', fontSize: 14, textTransform: 'uppercase', letterSpacing: 1 },
  infoName: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginTop: 8 },
  infoTime: { color: '#3b82f6', fontSize: 14, marginTop: 4 },
  controls: { flexDirection: 'row', justifyContent: 'space-evenly', alignItems: 'center', paddingVertical: 30, backgroundColor: '#0f172a' },
  controlBtn: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center' },
  muteBtn: { backgroundColor: '#334155' },
  videoBtn: { backgroundColor: '#334155' },
  endBtn: { backgroundColor: '#ef4444', width: 70, height: 70, borderRadius: 35 },
});
