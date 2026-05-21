// app/(os)/health/profile.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useHealthPatient } from '@/lib/health/hooks/useHealthPatient';
import { PatientService } from '@/lib/health/services/patient.service';
import { Ionicons } from '@expo/vector-icons';

export default function HealthProfileScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { patient, isLoading, refresh } = useHealthPatient(user?.id);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    first_name: patient?.first_name || '',
    last_name: patient?.last_name || '',
    date_of_birth: patient?.date_of_birth || '',
    gender: patient?.gender || '',
    blood_type: patient?.blood_type || '',
    allergies: patient?.allergies?.join(', ') || '',
    chronic_conditions: patient?.chronic_conditions?.join(', ') || '',
    emergency_contact_name: patient?.emergency_contact_name || '',
    emergency_contact_phone: patient?.emergency_contact_phone || '',
    insurance_provider: patient?.insurance_provider || '',
    insurance_policy_number: patient?.insurance_policy_number || '',
  });

  const handleSave = async () => {
    try {
      if (patient) {
        await PatientService.updatePatient(patient.id, {
          first_name: formData.first_name,
          last_name: formData.last_name,
          date_of_birth: formData.date_of_birth,
          gender: formData.gender,
          blood_type: formData.blood_type,
          allergies: formData.allergies.split(',').map(s => s.trim()).filter(Boolean),
          chronic_conditions: formData.chronic_conditions.split(',').map(s => s.trim()).filter(Boolean),
          emergency_contact_name: formData.emergency_contact_name,
          emergency_contact_phone: formData.emergency_contact_phone,
          insurance_provider: formData.insurance_provider,
          insurance_policy_number: formData.insurance_policy_number,
        });
      } else if (user?.id) {
        await PatientService.createPatient({
          user_id: user.id,
          patient_code: `PAT-${Date.now()}`,
          first_name: formData.first_name,
          last_name: formData.last_name,
          date_of_birth: formData.date_of_birth,
          gender: formData.gender,
          status: 'active',
          allergies: formData.allergies.split(',').map(s => s.trim()).filter(Boolean),
          chronic_conditions: formData.chronic_conditions.split(',').map(s => s.trim()).filter(Boolean),
          current_medications: [],
          metadata: {},
        } as any);
      }
      Alert.alert('Success', 'Health profile saved');
      setEditing(false);
      refresh();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save profile');
    }
  };

  const renderField = (label: string, key: keyof typeof formData, placeholder: string, keyboardType: any = 'default') => (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {editing ? (
        <TextInput
          style={styles.input}
          value={formData[key]}
          onChangeText={(text) => setFormData(prev => ({ ...prev, [key]: text }))}
          placeholder={placeholder}
          keyboardType={keyboardType}
        />
      ) : (
        <Text style={styles.fieldValue}>{patient?.[key] || 'Not set'}</Text>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Health Profile</Text>
        <TouchableOpacity onPress={() => editing ? handleSave() : setEditing(true)}>
          <Text style={styles.editText}>{editing ? 'Save' : 'Edit'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Ionicons name="medical" size={40} color="#EF4444" />
          </View>
          <Text style={styles.patientName}>{patient?.first_name || 'New'} {patient?.last_name || 'Patient'}</Text>
          <Text style={styles.patientCode}>{patient?.patient_code || 'Not registered'}</Text>
          <View style={[styles.statusBadge, { backgroundColor: patient?.status === 'active' ? '#D1FAE5' : '#FEE2E2' }]}>
            <Text style={[styles.statusText, { color: patient?.status === 'active' ? '#10B981' : '#EF4444' }]}>
              {patient?.status?.toUpperCase() || 'NEW'}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          {renderField('First Name', 'first_name', 'Enter first name')}
          {renderField('Last Name', 'last_name', 'Enter last name')}
          {renderField('Date of Birth', 'date_of_birth', 'YYYY-MM-DD')}
          {renderField('Gender', 'gender', 'Male / Female / Other')}
          {renderField('Blood Type', 'blood_type', 'A+ / B- / O+ / etc')}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Medical History</Text>
          {renderField('Allergies', 'allergies', 'Comma-separated list')}
          {renderField('Chronic Conditions', 'chronic_conditions', 'Comma-separated list')}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Emergency Contact</Text>
          {renderField('Contact Name', 'emergency_contact_name', 'Emergency contact name')}
          {renderField('Contact Phone', 'emergency_contact_phone', 'Phone number', 'phone-pad')}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Insurance</Text>
          {renderField('Provider', 'insurance_provider', 'Insurance company name')}
          {renderField('Policy Number', 'insurance_policy_number', 'Policy number')}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#1E293B' },
  editText: { fontSize: 16, fontWeight: '600', color: '#3B82F6' },
  content: { flex: 1 },
  profileCard: { alignItems: 'center', paddingVertical: 24, backgroundColor: '#FFF', marginBottom: 16 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#FEE2E2', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  patientName: { fontSize: 20, fontWeight: '700', color: '#1E293B' },
  patientCode: { fontSize: 14, color: '#64748B', marginTop: 4 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginTop: 8 },
  statusText: { fontSize: 12, fontWeight: '700' },
  section: { backgroundColor: '#FFF', marginBottom: 16, paddingHorizontal: 16, paddingVertical: 12 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#1E293B', marginBottom: 12 },
  field: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  fieldLabel: { fontSize: 12, color: '#64748B', marginBottom: 4 },
  fieldValue: { fontSize: 16, color: '#1E293B' },
  input: { fontSize: 16, color: '#1E293B', padding: 8, backgroundColor: '#F8FAFC', borderRadius: 6, borderWidth: 1, borderColor: '#E2E8F0' },
});
