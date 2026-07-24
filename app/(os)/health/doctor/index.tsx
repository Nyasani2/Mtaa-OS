import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, ActivityIndicator,
  RefreshControl, Alert
} from 'react-native';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

interface Appointment {
  id: string;
  patient_id: string;
  patient_name: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  type: string;
  notes?: string;
}

export default function DoctorWorkspaceScreen() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'queue' | 'schedule' | 'patients'>('queue');
  const [queue, setQueue] = useState<Appointment[]>([]);
  const [schedule, setSchedule] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];

      // Fetch today's appointments for this doctor
      const { data: appts, error: apptErr } = await supabase
        .from('health_appointments')
        .select(`
          id, patient_id, appointment_date, appointment_time, status, type, notes,
          patient:patient_id(name)
        `)
        .eq('doctor_id', user.id)
        .eq('appointment_date', today)
        .order('appointment_time', { ascending: true });

      if (apptErr) throw apptErr;

      const mapped = (appts || []).map((a: any) => ({
        id: a.id,
        patient_id: a.patient_id,
        patient_name: a.patient?.name || 'Unknown',
        appointment_date: a.appointment_date,
        appointment_time: a.appointment_time,
        status: a.status,
        type: a.type,
        notes: a.notes,
      }));

      // Queue = pending/confirmed appointments
      setQueue(mapped.filter((a: Appointment) => a.status === 'pending' || a.status === 'confirmed'));
      // Schedule = all today's appointments
      setSchedule(mapped);

      // Fetch patients under this doctor's care
      const { data: patientList, error: patientErr } = await supabase
        .from('health_patients')
        .select('id, name, phone, date_of_birth, gender, blood_type, allergies')
        .eq('primary_doctor_id', user.id)
        .order('name');

      if (patientErr) throw patientErr;
      setPatients(patientList || []);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to load doctor data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, [user?.id]);

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('health_appointments').update({ status }).eq('id', id);
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      fetchData();
    }
  };

  const TabButton = ({ label, tab }: { label: string; tab: typeof activeTab }) => (
    <TouchableOpacity
      onPress={() => setActiveTab(tab)}
      style={{
        flex: 1, paddingVertical: 12, alignItems: 'center',
        borderBottomWidth: 2, borderBottomColor: activeTab === tab ? '#3b82f6' : 'transparent'
      }}
    >
      <Text style={{ color: activeTab === tab ? '#3b82f6' : '#94a3b8', fontWeight: '600' }}>{label}</Text>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#0f172a' }}>
      <View style={{ padding: 16, paddingBottom: 0 }}>
        <Text style={{ fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 12 }}>Doctor Workspace</Text>
        <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#1e293b' }}>
          <TabButton label="Queue" tab="queue" />
          <TabButton label="Schedule" tab="schedule" />
          <TabButton label="Patients" tab="patients" />
        </View>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />}
        style={{ flex: 1, padding: 16 }}
      >
        {activeTab === 'queue' && (
          <>
            {queue.length === 0 ? (
              <Text style={{ color: '#64748b', textAlign: 'center', marginTop: 40 }}>No patients in queue</Text>
            ) : (
              queue.map((item) => (
                <View key={item.id} style={{ backgroundColor: '#1e293b', borderRadius: 12, padding: 16, marginBottom: 12 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View>
                      <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>{item.patient_name}</Text>
                      <Text style={{ color: '#94a3b8', marginTop: 4 }}>{item.appointment_time} — {item.type}</Text>
                      {item.notes && <Text style={{ color: '#64748b', marginTop: 4, fontSize: 12 }}>{item.notes}</Text>}
                    </View>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <TouchableOpacity
                        onPress={() => updateStatus(item.id, 'in_progress')}
                        style={{ backgroundColor: '#3b82f6', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 }}
                      >
                        <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>Start</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => updateStatus(item.id, 'completed')}
                        style={{ backgroundColor: '#22c55e', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 }}
                      >
                        <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>Done</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))
            )}
          </>
        )}

        {activeTab === 'schedule' && (
          <>
            {schedule.length === 0 ? (
              <Text style={{ color: '#64748b', textAlign: 'center', marginTop: 40 }}>No appointments scheduled for today</Text>
            ) : (
              schedule.map((item) => (
                <View key={item.id} style={{ backgroundColor: '#1e293b', borderRadius: 12, padding: 16, marginBottom: 12 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>{item.patient_name}</Text>
                    <View style={{
                      backgroundColor: item.status === 'completed' ? '#22c55e22' : item.status === 'in_progress' ? '#eab30822' : '#3b82f622',
                      paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4
                    }}>
                      <Text style={{
                        color: item.status === 'completed' ? '#22c55e' : item.status === 'in_progress' ? '#eab308' : '#3b82f6',
                        fontSize: 12, fontWeight: '600', textTransform: 'capitalize'
                      }}>{item.status}</Text>
                    </View>
                  </View>
                  <Text style={{ color: '#94a3b8', marginTop: 4 }}>{item.appointment_time} — {item.type}</Text>
                  {item.notes && <Text style={{ color: '#64748b', marginTop: 4, fontSize: 12 }}>{item.notes}</Text>}
                </View>
              ))
            )}
          </>
        )}

        {activeTab === 'patients' && (
          <>
            {patients.length === 0 ? (
              <Text style={{ color: '#64748b', textAlign: 'center', marginTop: 40 }}>No patients assigned</Text>
            ) : (
              patients.map((p) => (
                <View key={p.id} style={{ backgroundColor: '#1e293b', borderRadius: 12, padding: 16, marginBottom: 12 }}>
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>{p.name}</Text>
                  <Text style={{ color: '#94a3b8', marginTop: 4 }}>{p.gender} · {p.blood_type || 'Unknown blood type'}</Text>
                  {p.allergies && <Text style={{ color: '#ef4444', marginTop: 4, fontSize: 12 }}>Allergies: {p.allergies}</Text>}
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}
