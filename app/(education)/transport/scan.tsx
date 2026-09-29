// @ts-nocheck
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// Mock notification service
const sendNotification = (type: string, childName: string, location: string) => {
  const messages = {
    pickup_home: `🚌 ${childName} has been picked up from home. Track the bus: mtaa://education/transport/map`,
    dropoff_school: `🏫 ${childName} has arrived at school safely. Gate scan confirmed.`,
    attendance_in: `✅ ${childName} is marked present in class by the teacher.`,
    pickup_school: `🎒 ${childName} has left school. Pickup confirmed.`,
  };
  console.log("🔔 NOTIFICATION SENT:", messages[type]);
  // In production: Expo Notifications or Supabase Realtime to parent's device
};

export default function EducationQRScanner() {
  const router = useRouter();
  const [scanContext, setScanContext] = useState<'pickup_home' | 'dropoff_school' | 'attendance_in' | 'pickup_school' | null>(null);

  const handleScan = (context: typeof scanContext) => {
    setScanContext(context);
    // Simulate QR scan success
    setTimeout(() => {
      const childName = "Kevin Jr."; // Mock data, would come from QR payload
      const location = context === 'pickup_home' ? 'Home' : 'School';
      
      sendNotification(context, childName, location);
      
      Alert.alert(
        "Scan Successful",
        `✅ ${childName} successfully scanned for ${context.replace('_', ' ')}.\n\nParent has been notified with live map link.`,
        [{ text: "OK", onPress: () => setScanContext(null) }]
      );
    }, 1000);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
        <Text style={styles.headerTitle}>QR Scanner</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.scannerBox}>
        <Ionicons name="qr-code" size={80} color="#3B82F6" />
        <Text style={styles.scannerText}>Point camera at student QR code</Text>
      </View>

      <Text style={styles.sectionLabel}>Select Scan Context:</Text>
      
      <View style={styles.buttonGrid}>
        <TouchableOpacity style={[styles.contextBtn, { borderColor: '#F59E0B' }]} onPress={() => handleScan('pickup_home')}>
          <Ionicons name="home" size={24} color="#F59E0B" />
          <Text style={[styles.contextText, { color: '#F59E0B' }]}>Home Pickup</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.contextBtn, { borderColor: '#10B981' }]} onPress={() => handleScan('dropoff_school')}>
          <Ionicons name="school" size={24} color="#10B981" />
          <Text style={[styles.contextText, { color: '#10B981' }]}>School Arrival</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.contextBtn, { borderColor: '#3B82F6' }]} onPress={() => handleScan('attendance_in')}>
          <Ionicons name="clipboard" size={24} color="#3B82F6" />
          <Text style={[styles.contextText, { color: '#3B82F6' }]}>Class Attendance</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.contextBtn, { borderColor: '#EF4444' }]} onPress={() => handleScan('pickup_school')}>
          <Ionicons name="exit" size={24} color="#EF4444" />
          <Text style={[styles.contextText, { color: '#EF4444' }]}>School Departure</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 60 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  scannerBox: { alignItems: 'center', justifyContent: 'center', height: 250, margin: 20, backgroundColor: '#1E293B', borderRadius: 20, borderWidth: 2, borderStyle: 'dashed', borderColor: '#3B82F6' },
  scannerText: { color: '#94A3B8', marginTop: 16, fontSize: 16 },
  sectionLabel: { color: '#CBD5E1', fontSize: 14, fontWeight: '600', marginLeft: 20, marginBottom: 12 },
  buttonGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: 20 },
  contextBtn: { width: '48%', backgroundColor: '#1E293B', padding: 20, borderRadius: 16, alignItems: 'center', gap: 10, marginBottom: 16, borderWidth: 2 },
  contextText: { fontSize: 14, fontWeight: '700' },
});
