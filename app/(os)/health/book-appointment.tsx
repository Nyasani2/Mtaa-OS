// app/(os)/health/book-appointment.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { HospitalService } from '@/lib/health/services/hospital.service';
import { AppointmentService } from '@/lib/health/services/appointment.service';
import { HealthHospital, HealthDepartment } from '@/lib/health/types';
import { Ionicons } from '@expo/vector-icons';

export default function BookAppointmentScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [step, setStep] = useState<'hospital' | 'department' | 'details' | 'confirm'>('hospital');
  const [hospitals, setHospitals] = useState<HealthHospital[]>([]);
  const [departments, setDepartments] = useState<HealthDepartment[]>([]);
  const [selectedHospital, setSelectedHospital] = useState<HealthHospital | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<HealthDepartment | null>(null);
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadHospitals();
  }, []);

  const loadHospitals = async () => {
    try {
      setIsLoading(true);
      const data = await HospitalService.getHospitals();
      setHospitals(data);
    } catch (err) {
      Alert.alert('Error', 'Failed to load hospitals');
    } finally {
      setIsLoading(false);
    }
  };

  const loadDepartments = async (hospitalId: string) => {
    try {
      setIsLoading(true);
      const data = await HospitalService.getHospitalDepartments(hospitalId);
      setDepartments(data);
      setStep('department');
    } catch (err) {
      Alert.alert('Error', 'Failed to load departments');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedHospital || !selectedDepartment || !appointmentDate || !appointmentTime) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      await AppointmentService.createAppointment({
        appointment_code: `APT-${Date.now()}`,
        patient_id: user?.id || '',
        provider_id: selectedDepartment.head_practitioner_id || '',
        provider_type: 'doctor',
        appointment_type: 'consultation',
        status: 'scheduled',
        scheduled_date: appointmentDate,
        scheduled_time: appointmentTime,
        duration_minutes: 30,
        reason,
        follow_up_required: false,
        metadata: {
          hospital_id: selectedHospital.id,
          department_id: selectedDepartment.id,
          hospital_name: selectedHospital.name,
          department_name: selectedDepartment.name,
        },
      } as any);

      Alert.alert('Success', 'Appointment booked successfully', [
        { text: 'OK', onPress: () => router.push('/health/appointments' as any) },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to book appointment');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (step === 'hospital') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Select Hospital</Text>
          <View style={{ width: 24 }} />
        </View>
        {isLoading ? (
          <ActivityIndicator size="large" color="#3B82F6" style={styles.loader} />
        ) : (
          <ScrollView style={styles.content}>
            {hospitals.map(hospital => (
              <TouchableOpacity
                key={hospital.id}
                style={styles.hospitalCard}
                onPress={() => { setSelectedHospital(hospital); loadDepartments(hospital.id); }}
              >
                <View style={styles.hospitalIcon}>
                  <Ionicons name="medical" size={24} color="#EF4444" />
                </View>
                <View style={styles.hospitalInfo}>
                  <Text style={styles.hospitalName}>{hospital.name}</Text>
                  <Text style={styles.hospitalDetail}>{hospital.county_name} • Level {hospital.level}</Text>
                  <Text style={styles.hospitalDetail}>{hospital.bed_capacity} beds • {hospital.hospital_type}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>
    );
  }

  if (step === 'department') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setStep('hospital')}>
            <Ionicons name="arrow-back" size={24} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Select Department</Text>
          <View style={{ width: 24 }} />
        </View>
        {isLoading ? (
          <ActivityIndicator size="large" color="#3B82F6" style={styles.loader} />
        ) : (
          <ScrollView style={styles.content}>
            <Text style={styles.subTitle}>{selectedHospital?.name}</Text>
            {departments.map(dept => (
              <TouchableOpacity
                key={dept.id}
                style={styles.deptCard}
                onPress={() => { setSelectedDepartment(dept); setStep('details'); }}
              >
                <View style={[styles.deptIcon, { backgroundColor: '#EFF6FF' }]}>
                  <Ionicons name="business" size={24} color="#3B82F6" />
                </View>
                <View style={styles.deptInfo}>
                  <Text style={styles.deptName}>{dept.name}</Text>
                  <Text style={styles.deptType}>{dept.department_type}</Text>
                  <Text style={styles.deptDetail}>Wait: {dept.avg_wait_minutes}min • Capacity: {dept.current_occupancy}/{dept.max_capacity}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>
    );
  }

  if (step === 'details') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setStep('department')}>
            <Ionicons name="arrow-back" size={24} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Appointment Details</Text>
          <View style={{ width: 24 }} />
        </View>
        <ScrollView style={styles.content}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Hospital</Text>
            <Text style={styles.summaryValue}>{selectedHospital?.name}</Text>
            <Text style={styles.summaryLabel}>Department</Text>
            <Text style={styles.summaryValue}>{selectedDepartment?.name}</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Date *</Text>
            <TextInput
              style={styles.input}
              value={appointmentDate}
              onChangeText={setAppointmentDate}
              placeholder="YYYY-MM-DD"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Time *</Text>
            <TextInput
              style={styles.input}
              value={appointmentTime}
              onChangeText={setAppointmentTime}
              placeholder="HH:MM"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Reason for Visit</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={reason}
              onChangeText={setReason}
              placeholder="Describe your symptoms or reason for visit"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <TouchableOpacity style={styles.nextButton} onPress={() => setStep('confirm')}>
            <Text style={styles.nextText}>Review Appointment</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFF" />
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // Confirm step
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setStep('details')}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Confirm</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView style={styles.content}>
        <View style={styles.confirmCard}>
          <Ionicons name="calendar" size={48} color="#3B82F6" />
          <Text style={styles.confirmTitle}>Appointment Summary</Text>
          <View style={styles.confirmRow}>
            <Text style={styles.confirmLabel}>Hospital</Text>
            <Text style={styles.confirmValue}>{selectedHospital?.name}</Text>
          </View>
          <View style={styles.confirmRow}>
            <Text style={styles.confirmLabel}>Department</Text>
            <Text style={styles.confirmValue}>{selectedDepartment?.name}</Text>
          </View>
          <View style={styles.confirmRow}>
            <Text style={styles.confirmLabel}>Date</Text>
            <Text style={styles.confirmValue}>{appointmentDate}</Text>
          </View>
          <View style={styles.confirmRow}>
            <Text style={styles.confirmLabel}>Time</Text>
            <Text style={styles.confirmValue}>{appointmentTime}</Text>
          </View>
          <View style={styles.confirmRow}>
            <Text style={styles.confirmLabel}>Reason</Text>
            <Text style={styles.confirmValue}>{reason || 'Not specified'}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitText}>CONFIRM BOOKING</Text>}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#1E293B' },
  loader: { flex: 1, justifyContent: 'center' },
  content: { flex: 1, padding: 16 },
  hospitalCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  hospitalIcon: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#FEE2E2', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  hospitalInfo: { flex: 1 },
  hospitalName: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
  hospitalDetail: { fontSize: 12, color: '#64748B', marginTop: 2 },
  subTitle: { fontSize: 14, fontWeight: '600', color: '#64748B', marginBottom: 12 },
  deptCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  deptIcon: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  deptInfo: { flex: 1 },
  deptName: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
  deptType: { fontSize: 12, color: '#64748B', textTransform: 'capitalize', marginTop: 2 },
  deptDetail: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  summaryCard: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginBottom: 20 },
  summaryLabel: { fontSize: 12, color: '#64748B', marginBottom: 4 },
  summaryValue: { fontSize: 16, fontWeight: '600', color: '#1E293B', marginBottom: 12 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '500', color: '#475569', marginBottom: 8 },
  input: { backgroundColor: '#FFF', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#E2E8F0', fontSize: 16, color: '#1E293B' },
  textArea: { height: 100, paddingTop: 12 },
  nextButton: { backgroundColor: '#3B82F6', borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8 },
  nextText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  confirmCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 20 },
  confirmTitle: { fontSize: 20, fontWeight: '700', color: '#1E293B', marginTop: 12, marginBottom: 20 },
  confirmRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  confirmLabel: { fontSize: 14, color: '#64748B' },
  confirmValue: { fontSize: 14, fontWeight: '600', color: '#1E293B', flex: 1, textAlign: 'right' },
  submitButton: { backgroundColor: '#10B981', borderRadius: 12, padding: 16, alignItems: 'center' },
  submitText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
