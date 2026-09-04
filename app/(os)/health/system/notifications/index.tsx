import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Bell,
  Mail,
  MessageSquare,
  Pill,
  Calendar,
  AlertTriangle,
  Clock,
} from 'lucide-react-native';

interface NotificationToggleProps {
  icon: any;
  label: string;
  desc: string;
  value: boolean;
  onToggle: (v: boolean) => void;
}

function NotificationToggle({ icon: Icon, label, desc, value, onToggle }: NotificationToggleProps) {
  return (
    <View style={styles.toggleCard}>
      <View style={styles.toggleHeader}>
        <View style={styles.toggleIcon}>
          <Icon size={18} color="#4b5563" />
        </View>
        <View style={styles.toggleContent}>
          <Text style={styles.toggleLabel}>{label}</Text>
          <Text style={styles.toggleDesc}>{desc}</Text>
        </View>
        <Switch value={value} onValueChange={onToggle} trackColor={{ false: '#d1d5db', true: '#22c55e' }} />
      </View>
    </View>
  );
}

export default function NotificationsScreen() {
  const router = useRouter();
  const [emailAppts, setEmailAppts] = useState(true);
  const [smsAppts, setSmsAppts] = useState(true);
  const [pushMeds, setPushMeds] = useState(true);
  const [pushResults, setPushResults] = useState(true);
  const [pushEmergency, setPushEmergency] = useState(true);
  const [quietHours, setQuietHours] = useState(false);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.sectionTitle}>Appointments</Text>
        <NotificationToggle
          icon={Mail}
          label="Email Reminders"
          desc="24 hours before appointment"
          value={emailAppts}
          onToggle={setEmailAppts}
        />
        <NotificationToggle
          icon={MessageSquare}
          label="SMS Reminders"
          desc="1 hour before appointment"
          value={smsAppts}
          onToggle={setSmsAppts}
        />

        <Text style={styles.sectionTitle}>Health Alerts</Text>
        <NotificationToggle
          icon={Pill}
          label="Medication Reminders"
          desc="When it is time to take meds"
          value={pushMeds}
          onToggle={setPushMeds}
        />
        <NotificationToggle
          icon={Bell}
          label="Lab Results Ready"
          desc="When new results are available"
          value={pushResults}
          onToggle={setPushResults}
        />
        <NotificationToggle
          icon={AlertTriangle}
          label="Emergency Alerts"
          desc="Critical health notifications"
          value={pushEmergency}
          onToggle={setPushEmergency}
        />

        <Text style={styles.sectionTitle}>Preferences</Text>
        <NotificationToggle
          icon={Clock}
          label="Quiet Hours"
          desc="Silence non-urgent alerts 10PM-7AM"
          value={quietHours}
          onToggle={setQuietHours}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { backgroundColor: '#1e3a5f', paddingTop: 48, paddingHorizontal: 16, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  content: { padding: 16 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 16, marginBottom: 10 },
  toggleCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: '#e5e7eb' },
  toggleHeader: { flexDirection: 'row', alignItems: 'center' },
  toggleIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  toggleContent: { flex: 1 },
  toggleLabel: { fontSize: 14, fontWeight: '600', color: '#1f2937' },
  toggleDesc: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
});
