// @ts-nocheck
import React, { useState } from 'react';
import { Alert, View, Text, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl, TextInput } from 'react-native';
import { Alert, useHealthRole } from '@/lib/health/hooks/useHealthRole';
import { supabase } from '@/lib/supabase';

interface Appointment {
  id: string;
  patient_id: string;
  patient_name: string;
  doctor_name?: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  type: string;
  notes?: string;
}

export default function HospitalAppointmentsScreen() {
  const { selectedFacilityId, facilities, isLoading: roleLoading, selectFacility } = useHealthRole();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchAppointments = async () => {
    if (!selectedFacilityId) return;
    setLoading(true);
    try {
      let q = supabase
        .from('health_appointments')
        .select(`
          id, patient_id, doctor_id, appointment_date, appointment_time, status, type, notes,
          patient:patient_id(name),
          doctor:doctor_id(name)
        `)
        .eq('facility_id', selectedFacilityId)
        .order('appointment_date', { ascending: false })
        .order('appointment_time', { ascending: true });

      if (filter !== 'all') {
        q = q.eq('status', filter);
      }

      const { data, error } = await q;
      if (error) throw error;

      const mapped = (data || []).map((a: any) => ({
        id: a.id,
        patient_id: a.patient_id,
        patient_name: a.patient?.name || 'Unknown',
        doctor_name: a.doctor?.name,
        appointment_date: a.appointment_date,
        appointment_time: a.appointment_time,
        status: a.status,
        type: a.type,
        notes: a.notes,
      }));

      // Apply search filter locally
      const filtered = searchQuery.trim()
        ? mapped.filter((a: Appointment) =>
            a.patient_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            a.doctor_name?.toLowerCase().includes(searchQuery.toLowerCase())
          )
        : mapped;

      setAppointments(filtered);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to load appointments');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  React.useEffect(() => { fetchAppointments(); }, [selectedFacilityId, filter]);

  const onRefresh = () => { setRefreshing(true); fetchAppointments(); };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('health_appointments').update({ status }).eq('id', id);
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      fetchAppointments();
    }
  };

  if (roleLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (!selectedFacilityId) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0f172a', padding: 16 }}>
        <Text style={{ fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 16 }}>Appointments</Text>
        <Text style={{ color: '#94a3b8', marginBottom: 16 }}>Select a facility to view appointments:</Text>
        {facilities.length === 0 ? (
          <Text style={{ color: '#64748b' }}>No facilities found. Please contact your administrator.</Text>
        ) : (
          facilities.map((f: any) => (
            <TouchableOpacity
              key={f.id}
              onPress={() => selectFacility(f.id)}
              style={{
                backgroundColor: '#1e293b', padding: 16, borderRadius: 12,
                marginBottom: 12, borderWidth: 1, borderColor: '#334155'
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>{f.name}</Text>
              <Text style={{ color: '#94a3b8', marginTop: 4 }}>{f.type || 'Hospital'}</Text>
            </TouchableOpacity>
          ))
        )}
      </View>
    );
  }

  const statusColors: Record<string, string> = {
    pending: '#eab308',
    confirmed: '#3b82f6',
    in_progress: '#8b5cf6',
    completed: '#22c55e',
    cancelled: '#ef4444',
    no_show: '#64748b',
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0f172a' }}>
      <View style={{ padding: 16 }}>
        <Text style={{ fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 12 }}>Appointments</Text>

        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={fetchAppointments}
          placeholder="Search patients or doctors..."
          placeholderTextColor="#64748b"
          style={{
            backgroundColor: '#1e293b', color: '#fff', padding: 12,
            borderRadius: 8, marginBottom: 12
          }}
        />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
          {['all', 'pending', 'confirmed', 'in_progress', 'completed', 'cancelled'].map((s) => (
            <TouchableOpacity
              key={s}
              onPress={() => setFilter(s)}
              style={{
                paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16,
                backgroundColor: filter === s ? '#3b82f6' : '#1e293b',
                marginRight: 8
              }}
            >
              <Text style={{ color: filter === s ? '#fff' : '#94a3b8', fontWeight: '600', textTransform: 'capitalize' }}>
                {s.replace('_', ' ')}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />}
        style={{ flex: 1, paddingHorizontal: 16 }}
      >
        {loading && !refreshing ? (
          <ActivityIndicator color="#3b82f6" style={{ marginTop: 40 }} />
        ) : appointments.length === 0 ? (
          <Text style={{ color: '#64748b', textAlign: 'center', marginTop: 40 }}>
            {searchQuery ? 'No matching appointments' : 'No appointments found'}
          </Text>
        ) : (
          appointments.map((appt) => (
            <View key={appt.id} style={{ backgroundColor: '#1e293b', borderRadius: 12, padding: 16, marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>{appt.patient_name}</Text>
                  <Text style={{ color: '#94a3b8', marginTop: 2 }}>
                    {appt.appointment_date} at {appt.appointment_time}
                  </Text>
                  <Text style={{ color: '#64748b', marginTop: 2, fontSize: 12 }}>
                    {appt.type} {appt.doctor_name ? `· Dr. ${appt.doctor_name}` : ''}
                  </Text>
                  {appt.notes && (
                    <Text style={{ color: '#64748b', marginTop: 4, fontSize: 12 }}>{appt.notes}</Text>
                  )}
                </View>
                <View style={{
                  backgroundColor: (statusColors[appt.status] || '#64748b') + '22',
                  paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4
                }}>
                  <Text style={{
                    color: statusColors[appt.status] || '#64748b',
                    fontSize: 12, fontWeight: '600', textTransform: 'capitalize'
                  }}>{appt.status.replace('_', ' ')}</Text>
                </View>
              </View>

              {appt.status === 'pending' && (
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                  <TouchableOpacity
                    onPress={() => updateStatus(appt.id, 'confirmed')}
                    style={{ flex: 1, backgroundColor: '#3b82f6', paddingVertical: 8, borderRadius: 6, alignItems: 'center' }}
                  >
                    <Text style={{ color: '#fff', fontWeight: '600', fontSize: 12 }}>Confirm</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => updateStatus(appt.id, 'cancelled')}
                    style={{ flex: 1, backgroundColor: '#ef4444', paddingVertical: 8, borderRadius: 6, alignItems: 'center' }}
                  >
                    <Text style={{ color: '#fff', fontWeight: '600', fontSize: 12 }}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
