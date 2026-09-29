// @ts-nocheck
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import EducationShell from '@/lib/components/education/EducationShell';

export default function EducationDashboard() {
  const router = useRouter();

  const sections = [
    {
      label: 'Dashboard',
      icon: 'grid',
      route: '/(education)',
    },
    {
      label: 'Academics',
      icon: 'school',
      route: '/(education)/academics',
      children: [
        { label: 'My Classes', icon: 'people', route: '/(education)/classes' },
        { label: 'Timetable', icon: 'calendar', route: '/(education)/timetable' },
        { label: 'Assignments', icon: 'clipboard', route: '/(education)/assignments' },
        { label: 'Grades', icon: 'trophy', route: '/(education)/results' },
        { label: 'Library', icon: 'book', route: '/(education)/library' },
      ],
    },
    {
      label: 'Communication',
      icon: 'chatbubbles',
      route: '/(education)/messages',
      children: [
        { label: 'Messages', icon: 'mail', route: '/(education)/messages' },
        { label: 'Announcements', icon: 'megaphone', route: '/(education)/announcements' },
        { label: 'Live Class', icon: 'videocam', route: '/(education)/live-class' },
      ],
    },
    {
      label: 'Transport',
      icon: 'bus',
      route: '/(education)/transport/track',
    },
    {
      label: 'Settings',
      icon: 'settings',
      route: '/(education)/settings',
    },
  ];

  const donutItems = [
    { label: 'Scan QR', icon: 'qr-code', color: '#8b5cf6', route: '/(education)/student/qr-display' },
    { label: 'Live Class', icon: 'videocam', color: '#ef4444', route: '/(education)/live-class' },
    { label: 'Assignment', icon: 'clipboard', color: '#f59e0b', route: '/(education)/assignments' },
    { label: 'Transport', icon: 'bus', color: '#0ea5e9', route: '/(education)/transport/track' },
    { label: 'Messages', icon: 'mail', color: '#10b981', route: '/(education)/messages' },
  ];

  return (
    <EducationShell
      title="Education"
      logo=""
      sections={sections}
      donutItems={donutItems}
      donutColor="#8b5cf6"
    >
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
        {/* Stats Row */}
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
          <StatCard label="Classes" value="6" color="#3b82f6" icon="people" />
          <StatCard label="Pending" value="3" color="#f59e0b" icon="clipboard" />
          <StatCard label="GPA" value="3.8" color="#10b981" icon="trophy" />
        </View>

        {/* Today's Classes */}
        <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 12 }}>Today's Classes</Text>
        <View style={{ backgroundColor: '#1e293b', borderRadius: 12, padding: 16 }}>
          <ClassRow name="Mathematics" time="09:00 - 10:30" room="Room 204" />
          <View style={{ height: 1, backgroundColor: '#334155', marginVertical: 12 }} />
          <ClassRow name="Physics" time="11:00 - 12:30" room="Lab 3" />
          <View style={{ height: 1, backgroundColor: '#334155', marginVertical: 12 }} />
          <ClassRow name="English" time="14:00 - 15:30" room="Room 101" />
        </View>
      </ScrollView>
    </EducationShell>
  );
}

function StatCard({ label, value, color, icon }: any) {
  return (
    <View style={{ flex: 1, backgroundColor: '#1e293b', borderRadius: 12, padding: 14 }}>
      <Ionicons name={icon} size={20} color={color} />
      <Text style={{ color: '#fff', fontSize: 22, fontWeight: '800', marginTop: 8 }}>{value}</Text>
      <Text style={{ color: '#94a3b8', fontSize: 12 }}>{label}</Text>
    </View>
  );
}

function ClassRow({ name, time, room }: any) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10 }}>
      <View style={{ width: 4, height: 36, backgroundColor: '#3b82f6', borderRadius: 2, marginRight: 12 }} />
      <View style={{ flex: 1 }}>
        <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600' }}>{name}</Text>
        <Text style={{ color: '#94a3b8', fontSize: 12 }}>{time} · {room}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#64748b" />
    </View>
  );
}
