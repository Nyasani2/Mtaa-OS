import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Vibration } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEducation } from '@/lib/hooks/useEducation';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { LinearGradient } from 'expo-linear-gradient';

export default function EmergencyConsole() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { getInstitutionById, getTeacherByUserId, getStudents, getAllEvents } = useEducation();
  const [active, setActive] = useState(false);
  const [timer, setTimer] = useState(0);
  const [selectedType, setSelectedType] = useState(null);
  const [stats, setStats] = useState({ present: 0, missing: 0, injured: 0, buses: 0 });

  useEffect(() => {
    let interval;
    if (active) {
      interval = setInterval(() => setTimer(t => t + 1), 1000);
      Vibration.vibrate([500, 500, 500]);
    }
    return () => clearInterval(interval);
  }, [active]);

  const activateEmergency = (type) => {
    setSelectedType(type);
    setActive(true);
    Alert.alert(
      `EMERGENCY: ${type}`,
      'Emergency mode activated. All staff and parents have been notified.',
      [{ text: 'OK' }]
    );
  };

  const deactivateEmergency = () => {
    Alert.alert('Deactivate Emergency?', 'This will return the school to normal operations.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Deactivate', onPress: () => { setActive(false); setTimer(0); setSelectedType(null); } },
    ]);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={active ? ['#dc2626', '#991b1b'] : ['#1e293b', '#0f172a']} style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Emergency Console</Text>
          <View style={[styles.statusDot, { backgroundColor: active ? '#ef4444' : '#10b981' }]} />
        </View>

        {active && (
          <View style={styles.emergencyBanner}>
            <Ionicons name="warning" size={32} color="#fff" />
            <View style={styles.emergencyInfo}>
              <Text style={styles.emergencyType}>{selectedType?.toUpperCase()}</Text>
              <Text style={styles.emergencyTimer}>Active: {formatTime(timer)}</Text>
            </View>
          </View>
        )}
      </LinearGradient>

      {!active ? (
        <ScrollView style={styles.content}>
          <Text style={styles.sectionTitle}>Activate Emergency</Text>
          <View style={styles.emergencyGrid}>
            <EmergencyButton icon="flame-outline" label="Fire" color="#dc2626" onPress={() => activateEmergency('Fire')} />
            <EmergencyButton icon="medical-outline" label="Medical" color="#ef4444" onPress={() => activateEmergency('Medical Emergency')} />
            <EmergencyButton icon="shield-outline" label="Intruder" color="#f59e0b" onPress={() => activateEmergency('Intruder')} />
            <EmergencyButton icon="water-outline" label="Flood" color="#3b82f6" onPress={() => activateEmergency('Flood')} />
            <EmergencyButton icon="earth-outline" label="Earthquake" color="#8b5cf6" onPress={() => activateEmergency('Earthquake')} />
            <EmergencyButton icon="alert-circle-outline" label="Other" color="#64748b" onPress={() => activateEmergency('General Emergency')} />
          </View>

          <Text style={styles.sectionTitle}>Emergency Contacts</Text>
          <ContactCard name="Police" number="999" icon="shield-checkmark-outline" />
          <ContactCard name="Ambulance" number="999" icon="medical-outline" />
          <ContactCard name="Fire Brigade" number="999" icon="flame-outline" />
          <ContactCard name="County Emergency" number="0722-000-000" icon="call-outline" />
          <ContactCard name="School Nurse" number="0711-000-000" icon="heart-outline" />
        </ScrollView>
      ) : (
        <ScrollView style={styles.content}>
          {/* Live Status */}
          <View style={styles.statusGrid}>
            <StatusBox label="Present" value={stats.present} color="#10b981" icon="people-outline" />
            <StatusBox label="Missing" value={stats.missing} color="#ef4444" icon="help-circle-outline" />
            <StatusBox label="Injured" value={stats.injured} color="#f59e0b" icon="medical-outline" />
            <StatusBox label="Buses" value={stats.buses} color="#3b82f6" icon="bus-outline" />
          </View>

          {/* Safe Routes */}
          <Text style={styles.sectionTitle}>Safe Routes</Text>
          <View style={styles.routeCard}>
            <Ionicons name="navigate-circle-outline" size={24} color="#10b981" />
            <View style={styles.routeInfo}>
              <Text style={styles.routeTitle}>Assembly Point A</Text>
              <Text style={styles.routeDesc}>Main playground • 120m • Clear path</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#64748b" />
          </View>
          <View style={styles.routeCard}>
            <Ionicons name="navigate-circle-outline" size={24} color="#f59e0b" />
            <View style={styles.routeInfo}>
              <Text style={styles.routeTitle}>Assembly Point B</Text>
              <Text style={styles.routeDesc}>Parking area • 80m • Caution: stairs</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#64748b" />
          </View>

          {/* Blocked Areas */}
          <Text style={styles.sectionTitle}>Blocked Areas</Text>
          <View style={styles.blockedCard}>
            <Ionicons name="close-circle" size={20} color="#ef4444" />
            <Text style={styles.blockedText}>Class Block B - {selectedType === 'Fire' ? 'Smoke detected' : 'Unsafe'}</Text>
          </View>

          {/* Roll Call */}
          <Text style={styles.sectionTitle}>Roll Call</Text>
          <TouchableOpacity style={styles.rollCallBtn} onPress={() => router.push('/(education)/emergency/roll-call')}>
            <Ionicons name="checkbox-outline" size={20} color="#fff" />
            <Text style={styles.rollCallText}>Start Roll Call</Text>
          </TouchableOpacity>

          {/* Incident Timeline */}
          <Text style={styles.sectionTitle}>Incident Timeline</Text>
          <TimelineEntry time="Now" event={`${selectedType} detected`} type="alert" />
          <TimelineEntry time="Now" event="Emergency mode activated" type="system" />
          <TimelineEntry time="Now" event="Notifications sent to all staff" type="system" />
          <TimelineEntry time="Now" event="CCTV switched to emergency recording" type="system" />

          {/* Deactivate */}
          <TouchableOpacity style={styles.deactivateBtn} onPress={deactivateEmergency}>
            <Ionicons name="shield-checkmark-outline" size={20} color="#fff" />
            <Text style={styles.deactivateText}>DEACTIVATE EMERGENCY MODE</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </View>
  );
}

function EmergencyButton({ icon, label, color, onPress }) {
  return (
    <TouchableOpacity style={[styles.emergencyBtn, { borderColor: color }]} onPress={onPress}>
      <View style={[styles.emergencyIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={28} color={color} />
      </View>
      <Text style={[styles.emergencyLabel, { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function ContactCard({ name, number, icon }) {
  return (
    <TouchableOpacity style={styles.contactCard}>
      <View style={styles.contactLeft}>
        <Ionicons name={icon} size={20} color="#3b82f6" />
        <View>
          <Text style={styles.contactName}>{name}</Text>
          <Text style={styles.contactNumber}>{number}</Text>
        </View>
      </View>
      <Ionicons name="call-outline" size={20} color="#10b981" />
    </TouchableOpacity>
  );
}

function StatusBox({ label, value, color, icon }) {
  return (
    <View style={[styles.statusBox, { borderTopColor: color }]}>
      <Ionicons name={icon} size={20} color={color} />
      <Text style={[styles.statusValue, { color }]}>{value}</Text>
      <Text style={styles.statusLabel}>{label}</Text>
    </View>
  );
}

function TimelineEntry({ time, event, type }) {
  return (
    <View style={styles.timelineEntry}>
      <View style={[styles.timelineDot, { backgroundColor: type === 'alert' ? '#ef4444' : '#3b82f6' }]} />
      <View style={styles.timelineInfo}>
        <Text style={styles.timelineEvent}>{event}</Text>
        <Text style={styles.timelineTime}>{time}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { padding: 20, paddingTop: 60 },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  emergencyBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(239,68,68,0.3)', padding: 16, borderRadius: 12, gap: 12 },
  emergencyInfo: { flex: 1 },
  emergencyType: { fontSize: 20, fontWeight: '800', color: '#fff' },
  emergencyTimer: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  content: { flex: 1 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#fff', marginHorizontal: 16, marginTop: 20, marginBottom: 12 },
  emergencyGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 10 },
  emergencyBtn: { width: '30%', backgroundColor: '#1e293b', borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 1.5 },
  emergencyIcon: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  emergencyLabel: { fontSize: 12, fontWeight: '700' },
  contactCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#1e293b', marginHorizontal: 16, marginBottom: 8, borderRadius: 12, padding: 14 },
  contactLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  contactName: { fontSize: 14, fontWeight: '600', color: '#fff' },
  contactNumber: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  statusGrid: { flexDirection: 'row', paddingHorizontal: 12, gap: 10 },
  statusBox: { flex: 1, backgroundColor: '#1e293b', borderRadius: 12, padding: 14, alignItems: 'center', borderTopWidth: 3 },
  statusValue: { fontSize: 24, fontWeight: '800', marginTop: 6 },
  statusLabel: { fontSize: 11, color: '#94a3b8', marginTop: 4 },
  routeCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', marginHorizontal: 16, marginBottom: 8, borderRadius: 12, padding: 14, gap: 12 },
  routeInfo: { flex: 1 },
  routeTitle: { fontSize: 14, fontWeight: '600', color: '#fff' },
  routeDesc: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  blockedCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#451a1a', marginHorizontal: 16, marginBottom: 8, borderRadius: 12, padding: 14, gap: 10, borderWidth: 1, borderColor: '#ef4444' },
  blockedText: { fontSize: 14, color: '#fca5a5' },
  rollCallBtn: { backgroundColor: '#3b82f6', marginHorizontal: 16, borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  rollCallText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  timelineEntry: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 12 },
  timelineDot: { width: 10, height: 10, borderRadius: 5, marginRight: 12, marginTop: 4 },
  timelineInfo: { flex: 1 },
  timelineEvent: { fontSize: 14, color: '#e2e8f0' },
  timelineTime: { fontSize: 12, color: '#64748b', marginTop: 2 },
  deactivateBtn: { backgroundColor: '#059669', marginHorizontal: 16, marginTop: 20, borderRadius: 12, padding: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  deactivateText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
