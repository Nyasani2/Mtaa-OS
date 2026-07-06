import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, TextInput, ScrollView, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { Ionicons } from '@expo/vector-icons';

interface Doctor {
  id: string;
  staff_id: string;
  full_name: string;
  specialization: string | null;
  department: string | null;
  facility_name: string;
  consultation_fee: number | null;
  years_of_experience: number | null;
  rating: number | null;
  avatar_url: string | null;
}

interface TimeSlot {
  time: string;
  available: boolean;
}

export default function BookAppointmentScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const params = useLocalSearchParams();
  const preselectedDoctorId = params.doctorId as string | undefined;

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [reason, setReason] = useState('');
  const [type, setType] = useState<'in_person' | 'telemedicine' | 'follow_up'>('in_person');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [department, setDepartment] = useState('all');
  const [departments, setDepartments] = useState<string[]>([]);

  useEffect(() => {
    loadDoctors();
  }, [searchQuery, department]);

  useEffect(() => {
    if (selectedDoctor && selectedDate) {
      generateTimeSlots();
    }
  }, [selectedDoctor, selectedDate]);

  useEffect(() => {
    if (preselectedDoctorId) {
      const doctor = doctors.find(d => d.staff_id === preselectedDoctorId);
      if (doctor) setSelectedDoctor(doctor);
    }
  }, [preselectedDoctorId, doctors]);

  async function loadDoctors() {
    setLoading(true);
    try {
      let query = supabase
        .from('health_staff')
        .select('id, user_id, role, department, specialization, years_of_experience, consultation_fee, health_facilities(name), user_profiles(full_name, avatar_url)')
        .eq('role', 'doctor')
        .eq('status', 'active');

      if (department !== 'all') {
        query = query.eq('department', department);
      }

      if (searchQuery.trim()) {
        query = query.or(`user_profiles.full_name.ilike.%${searchQuery}%,specialization.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      const mapped: Doctor[] = (data || []).map((d: any) => ({
        id: d.id,
        staff_id: d.user_id,
        full_name: d.user_profiles?.full_name || 'Unknown',
        specialization: d.specialization,
        department: d.department,
        facility_name: d.health_facilities?.name || 'Unknown',
        consultation_fee: d.consultation_fee,
        years_of_experience: d.years_of_experience,
        rating: null,
        avatar_url: d.user_profiles?.avatar_url || null,
      }));

      setDoctors(mapped);
      const uniqueDepts = [...new Set(mapped.map(d => d.department).filter(Boolean))].sort();
      setDepartments(uniqueDepts);
    } catch (err) {
      console.error('Doctors load error:', err);
    } finally {
      setLoading(false);
    }
  }

  function generateTimeSlots() {
    const slots: TimeSlot[] = [];
    const startHour = 8;
    const endHour = 17;
    for (let h = startHour; h < endHour; h++) {
      slots.push({ time: `${h.toString().padStart(2, '0')}:00`, available: Math.random() > 0.3 });
      slots.push({ time: `${h.toString().padStart(2, '0')}:30`, available: Math.random() > 0.3 });
    }
    setTimeSlots(slots);
  }

  function getNextDates(days: number): string[] {
    const dates: string[] = [];
    const today = new Date();
    for (let i = 0; i < days; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      dates.push(d.toISOString().split('T')[0]);
    }
    return dates;
  }

  async function bookAppointment() {
    if (!user || !selectedDoctor || !selectedDate || !selectedTime || !reason.trim()) {
      Alert.alert('Missing Information', 'Please select a doctor, date, time, and provide a reason for the appointment.');
      return;
    }

    setSubmitting(true);
    try {
      const appointmentDateTime = new Date(`${selectedDate}T${selectedTime}`);
      const { error } = await supabase.from('health_appointments').insert({
        patient_id: user.id,
        doctor_id: selectedDoctor.staff_id,
        facility_id: null,
        appointment_date: selectedDate,
        appointment_time: selectedTime,
        type: type,
        reason: reason.trim(),
        status: 'scheduled',
        payment_status: 'pending',
        consultation_fee: selectedDoctor.consultation_fee,
        created_at: new Date().toISOString(),
      });

      if (error) throw error;

      Alert.alert(
        'Appointment Booked',
        `Your appointment with Dr. ${selectedDoctor.full_name} on ${new Date(selectedDate).toLocaleDateString()} at ${selectedTime} has been scheduled.`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (err: any) {
      Alert.alert('Booking Failed', err.message || 'Failed to book appointment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const dates = getNextDates(14);
  const types: Array<'in_person' | 'telemedicine' | 'follow_up'> = ['in_person', 'telemedicine', 'follow_up'];
  const typeConfig = {
    in_person: { icon: 'medical', color: '#0ea5e9', label: 'In-Person' },
    telemedicine: { icon: 'videocam', color: '#8b5cf6', label: 'Telemedicine' },
    follow_up: { icon: 'refresh', color: '#22c55e', label: 'Follow-Up' },
  };

  if (!selectedDoctor) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Book Appointment</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.searchRow}>
          <Ionicons name="search" size={18} color="#64748b" />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search doctors by name or specialty..."
            placeholderTextColor="#64748b"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close" size={18} color="#64748b" />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.deptScroll} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
          <TouchableOpacity style={[styles.deptChip, department === 'all' && styles.deptChipActive]} onPress={() => setDepartment('all')}>
            <Text style={[styles.deptText, department === 'all' && styles.deptTextActive]}>All</Text>
          </TouchableOpacity>
          {departments.map(d => (
            <TouchableOpacity key={d} style={[styles.deptChip, department === d && styles.deptChipActive]} onPress={() => setDepartment(d)}>
              <Text style={[styles.deptText, department === d && styles.deptTextActive]}>{d}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {loading ? (
          <ActivityIndicator size="large" color="#0ea5e9" style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={doctors}
            keyExtractor={item => item.id}
            contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.doctorCard} onPress={() => setSelectedDoctor(item)}>
                <View style={styles.doctorAvatar}>
                  {item.avatar_url ? (
                    <Text style={styles.avatarText}>{item.full_name.charAt(0).toUpperCase()}</Text>
                  ) : (
                    <Text style={styles.avatarText}>{item.full_name.charAt(0).toUpperCase()}</Text>
                  )}
                </View>
                <View style={styles.doctorInfo}>
                  <Text style={styles.doctorName}>Dr. {item.full_name}</Text>
                  <Text style={styles.doctorSpecialty}>{item.specialization || item.department || 'General Practice'}</Text>
                  <Text style={styles.doctorFacility}>{item.facility_name}</Text>
                  <View style={styles.doctorMeta}>
                    <Text style={styles.metaText}>{item.years_of_experience || 0}+ years exp</Text>
                    {item.consultation_fee && <Text style={styles.feeText}>KES {item.consultation_fee.toLocaleString()}</Text>}
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#64748b" />
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Ionicons name="people-outline" size={48} color="#9ca3af" />
                <Text style={styles.emptyText}>{searchQuery ? 'No doctors match your search' : 'No doctors available'}</Text>
              </View>
            }
          />
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setSelectedDoctor(null)}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Book with Dr. {selectedDoctor.full_name}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.formScroll} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <View style={styles.doctorSummary}>
          <View style={styles.doctorAvatarLarge}>
            <Text style={styles.avatarTextLarge}>{selectedDoctor.full_name.charAt(0).toUpperCase()}</Text>
          </View>
          <View>
            <Text style={styles.summaryName}>Dr. {selectedDoctor.full_name}</Text>
            <Text style={styles.summarySpecialty}>{selectedDoctor.specialization || selectedDoctor.department || 'General Practice'}</Text>
            <Text style={styles.summaryFacility}>{selectedDoctor.facility_name}</Text>
            {selectedDoctor.consultation_fee && <Text style={styles.summaryFee}>KES {selectedDoctor.consultation_fee.toLocaleString()}</Text>}
          </View>
        </View>

        <Text style={styles.sectionTitle}>Appointment Type</Text>
        <View style={styles.typeRow}>
          {types.map(t => (
            <TouchableOpacity key={t} style={[styles.typeBtn, type === t && { backgroundColor: typeConfig[t].color }]} onPress={() => setType(t)}>
              <Ionicons name={typeConfig[t].icon as any} size={18} color={type === t ? '#fff' : typeConfig[t].color} />
              <Text style={[styles.typeBtnText, type === t && { color: '#fff' }]}>{typeConfig[t].label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Select Date</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateScroll} contentContainerStyle={{ gap: 8 }}>
          {dates.map(date => {
            const d = new Date(date);
            const isSelected = selectedDate === date;
            const isWeekend = d.getDay() === 0 || d.getDay() === 6;
            return (
              <TouchableOpacity
                key={date}
                style={[styles.dateChip, isSelected && styles.dateChipActive, isWeekend && !isSelected && { opacity: 0.6 }]}
                onPress={() => setSelectedDate(date)}
              >
                <Text style={[styles.dateDay, isSelected && styles.dateDayActive]}>{d.toLocaleDateString('en-US', { weekday: 'short' })}</Text>
                <Text style={[styles.dateNum, isSelected && styles.dateNumActive]}>{d.getDate()}</Text>
                <Text style={[styles.dateMonth, isSelected && styles.dateMonthActive]}>{d.toLocaleDateString('en-US', { month: 'short' })}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {selectedDate && (
          <>
            <Text style={styles.sectionTitle}>Select Time</Text>
            <View style={styles.timeGrid}>
              {timeSlots.map(slot => (
                <TouchableOpacity
                  key={slot.time}
                  style={[
                    styles.timeChip,
                    selectedTime === slot.time && styles.timeChipActive,
                    !slot.available && styles.timeChipUnavailable,
                  ]}
                  onPress={() => slot.available && setSelectedTime(slot.time)}
                  disabled={!slot.available}
                >
                  <Text style={[styles.timeText, selectedTime === slot.time && styles.timeTextActive, !slot.available && styles.timeTextUnavailable]}>
                    {slot.time}
                  </Text>
                  {!slot.available && <Text style={styles.bookedText}>Booked</Text>}
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        <Text style={styles.sectionTitle}>Reason for Visit</Text>
        <TextInput
          style={styles.reasonInput}
          value={reason}
          onChangeText={setReason}
          placeholder="Describe your symptoms or reason for the appointment..."
          placeholderTextColor="#64748b"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        <TouchableOpacity
          style={[styles.bookBtn, (!selectedDate || !selectedTime || !reason.trim() || submitting) && styles.bookBtnDisabled]}
          onPress={bookAppointment}
          disabled={!selectedDate || !selectedTime || !reason.trim() || submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.bookBtnText}>Confirm Appointment</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 48, backgroundColor: '#1e293b' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff', flex: 1, textAlign: 'center' },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16, backgroundColor: '#1e293b', borderBottomWidth: 1, borderBottomColor: '#334155' },
  searchInput: { flex: 1, color: '#e2e8f0', fontSize: 14, padding: 0 },
  deptScroll: { marginTop: 8 },
  deptChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155' },
  deptChipActive: { backgroundColor: '#0ea5e9', borderColor: '#0ea5e9' },
  deptText: { fontSize: 12, color: '#94a3b8' },
  deptTextActive: { color: '#fff', fontWeight: '600' },
  doctorCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#1e293b', borderRadius: 12, padding: 14, marginBottom: 10 },
  doctorAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#0ea5e9', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 18, fontWeight: '700', color: '#fff' },
  doctorInfo: { flex: 1 },
  doctorName: { fontSize: 15, fontWeight: '700', color: '#fff' },
  doctorSpecialty: { fontSize: 13, color: '#0ea5e9', marginTop: 2 },
  doctorFacility: { fontSize: 12, color: '#64748b', marginTop: 1 },
  doctorMeta: { flexDirection: 'row', gap: 12, marginTop: 4 },
  metaText: { fontSize: 12, color: '#94a3b8' },
  feeText: { fontSize: 12, color: '#22c55e', fontWeight: '600' },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: '#94a3b8', marginTop: 12, fontSize: 14, textAlign: 'center', paddingHorizontal: 32 },
  formScroll: { flex: 1 },
  doctorSummary: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#1e293b', borderRadius: 12, padding: 16, marginBottom: 16 },
  doctorAvatarLarge: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#0ea5e9', alignItems: 'center', justifyContent: 'center' },
  avatarTextLarge: { fontSize: 22, fontWeight: '700', color: '#fff' },
  summaryName: { fontSize: 16, fontWeight: '700', color: '#fff' },
  summarySpecialty: { fontSize: 13, color: '#0ea5e9', marginTop: 2 },
  summaryFacility: { fontSize: 12, color: '#64748b', marginTop: 1 },
  summaryFee: { fontSize: 14, color: '#22c55e', fontWeight: '700', marginTop: 4 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#e2e8f0', marginTop: 16, marginBottom: 10 },
  typeRow: { flexDirection: 'row', gap: 10 },
  typeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 10, backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155' },
  typeBtnText: { fontSize: 12, color: '#94a3b8', fontWeight: '600' },
  dateScroll: { marginTop: 4 },
  dateChip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, backgroundColor: '#1e293b', alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  dateChipActive: { backgroundColor: '#0ea5e9', borderColor: '#0ea5e9' },
  dateDay: { fontSize: 11, color: '#94a3b8' },
  dateDayActive: { color: '#fff' },
  dateNum: { fontSize: 18, fontWeight: '700', color: '#e2e8f0', marginTop: 2 },
  dateNumActive: { color: '#fff' },
  dateMonth: { fontSize: 11, color: '#64748b', marginTop: 2 },
  dateMonthActive: { color: '#fff' },
  timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  timeChip: { width: '30%', paddingVertical: 10, borderRadius: 8, backgroundColor: '#1e293b', alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  timeChipActive: { backgroundColor: '#0ea5e9', borderColor: '#0ea5e9' },
  timeChipUnavailable: { backgroundColor: '#0f172a', borderColor: '#1e293b', opacity: 0.5 },
  timeText: { fontSize: 13, color: '#e2e8f0', fontWeight: '600' },
  timeTextActive: { color: '#fff' },
  timeTextUnavailable: { color: '#475569' },
  bookedText: { fontSize: 10, color: '#ef4444', marginTop: 2 },
  reasonInput: { backgroundColor: '#1e293b', borderRadius: 12, padding: 14, color: '#e2e8f0', fontSize: 14, borderWidth: 1, borderColor: '#334155', height: 100, textAlignVertical: 'top' },
  bookBtn: { backgroundColor: '#0ea5e9', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 20 },
  bookBtnDisabled: { backgroundColor: '#334155' },
  bookBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
