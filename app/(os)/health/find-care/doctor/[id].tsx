import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';

export default function DoctorDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [doctor, setDoctor] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDoctor();
  }, [id]);

  const loadDoctor = async () => {
    try {
      const { data, error } = await supabase
        .from('health_staff')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setDoctor(data);
    } catch (error: any) {
      console.error('Error loading doctor:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#14b8a6" />
      </View>
    );
  }

  if (!doctor) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Doctor not found</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backArrow}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={48} color="#fff" />
          </View>
          <Text style={styles.doctorName}>{doctor.full_name || doctor.name || 'Doctor'}</Text>
          <Text style={styles.specialty}>{doctor.specialty || 'General Practice'}</Text>
        </View>
      </View>

      {/* Info Cards */}
      <View style={styles.content}>
        <View style={styles.infoCard}>
          <Ionicons name="business" size={24} color="#14b8a6" />
          <View style={styles.infoText}>
            <Text style={styles.infoLabel}>Hospital</Text>
            <Text style={styles.infoValue}>{doctor.facility_name || 'Not specified'}</Text>
          </View>
        </View>

        {doctor.phone && (
          <View style={styles.infoCard}>
            <Ionicons name="call" size={24} color="#14b8a6" />
            <View style={styles.infoText}>
              <Text style={styles.infoLabel}>Phone</Text>
              <Text style={styles.infoValue}>{doctor.phone}</Text>
            </View>
          </View>
        )}

        {doctor.email && (
          <View style={styles.infoCard}>
            <Ionicons name="mail" size={24} color="#14b8a6" />
            <View style={styles.infoText}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{doctor.email}</Text>
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionBtn}>
            <Ionicons name="calendar" size={20} color="#fff" />
            <Text style={styles.actionBtnText}>Book Appointment</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtnSecondary}>
            <Ionicons name="videocam" size={20} color="#14b8a6" />
            <Text style={styles.actionBtnTextSecondary}>Video Consult</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
  header: {
    backgroundColor: '#14b8a6',
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  backArrow: { position: 'absolute', top: 60, left: 20, zIndex: 10 },
  headerContent: { alignItems: 'center', marginTop: 20 },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  doctorName: { fontSize: 24, fontWeight: 'bold', color: '#fff', textAlign: 'center' },
  specialty: { fontSize: 16, color: 'rgba(255,255,255,0.9)', marginTop: 4 },
  content: { padding: 20 },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  infoText: { marginLeft: 16, flex: 1 },
  infoLabel: { fontSize: 12, color: '#6b7280', marginBottom: 4 },
  infoValue: { fontSize: 16, fontWeight: '600', color: '#1f2937' },
  actions: { marginTop: 20, gap: 12 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#14b8a6',
    padding: 16,
    borderRadius: 16,
    gap: 8,
  },
  actionBtnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  actionBtnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#14b8a6',
    gap: 8,
  },
  actionBtnTextSecondary: { color: '#14b8a6', fontWeight: '600', fontSize: 16 },
  errorText: { fontSize: 18, color: '#ef4444', marginBottom: 16 },
  backBtn: { backgroundColor: '#14b8a6', padding: 12, borderRadius: 12 },
  backBtnText: { color: '#fff', fontWeight: '600' },
});
