import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const ADMIN_SECTIONS = [
  {
    title: 'People',
    items: [
      { label: 'Participants', icon: 'people', color: '#3b82f6', route: '/education/participants', desc: 'Students, Teachers, Parents, Staff, Admins' },
      { label: 'Invite Teachers', icon: 'person-add', color: '#8b5cf6', route: '/schools/invite-teacher', desc: 'Send invitations to new teachers' },
    ],
  },
  {
    title: 'School',
    items: [
      { label: 'Create School', icon: 'business', color: '#10b981', route: '/schools/create', desc: 'Register a new institution' },
      { label: 'Fee Structure', icon: 'cash', color: '#f59e0b', route: '/school/fees', desc: 'Manage fee payments & structure' },
      { label: 'Payroll', icon: 'card', color: '#06b6d4', route: '/payroll', desc: 'Teacher & staff salaries' },
    ],
  },
  {
    title: 'Operations',
    items: [
      { label: 'CCTV Monitor', icon: 'videocam', color: '#ef4444', route: '/ict/cctv', desc: 'Security camera feeds' },
      { label: 'School Map', icon: 'map', color: '#14b8a6', route: '/ict/school-map', desc: 'Campus layout & rooms' },
      { label: 'Transport', icon: 'bus', color: '#f97316', route: '/ict/transport', desc: 'Bus routes & student transport' },
      { label: 'Biometrics', icon: 'finger-print', color: '#6366f1', route: '/ict/biometrics', desc: 'Fingerprint & attendance sync' },
    ],
  },
  {
    title: 'Emergency & Security',
    items: [
      { label: 'Emergency', icon: 'warning', color: '#dc2626', route: '/emergency', desc: 'Fire, Medical, Intruder alerts' },
      { label: 'Command Center', icon: 'shield', color: '#7c3aed', route: '/command', desc: 'Central operations dashboard' },
      { label: 'Visitors', icon: 'walk', color: '#0ea5e9', route: '/visitors', desc: 'Visitor check-in management' },
      { label: 'QR System', icon: 'qr-code', color: '#84cc16', route: '/qr-system', desc: 'QR-based access control' },
    ],
  },
  {
    title: 'Academic',
    items: [
      { label: 'Assignments', icon: 'document-text', color: '#3b82f6', route: '/assignments', desc: 'Homework & class assignments' },
      { label: 'Grades', icon: 'trophy', color: '#eab308', route: '/grades', desc: 'Student marks & reports' },
      { label: 'Attendance', icon: 'checkbox', color: '#22c55e', route: '/attendance', desc: 'Daily attendance tracking' },
      { label: 'Timetable', icon: 'time', color: '#a855f7', route: '/timetable', desc: 'Class schedules' },
    ],
  },
];

export default function EducationAdmin() {
  const router = useRouter();

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#0f172a' }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <Text style={{ color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 16 }}>Admin</Text>

      {ADMIN_SECTIONS.map((section) => (
        <View key={section.title} style={{ marginBottom: 20 }}>
          <Text style={{ color: '#64748b', fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
            {section.title}
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {section.items.map((item) => (
              <TouchableOpacity
                key={item.label}
                onPress={() => router.push(item.route as any)}
                style={{
                  width: '31%',
                  backgroundColor: '#1e293b',
                  borderRadius: 12,
                  padding: 14,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: '#334155',
                }}
              >
                <View style={{
                  width: 44, height: 44, borderRadius: 12,
                  backgroundColor: item.color + '20',
                  justifyContent: 'center', alignItems: 'center',
                  marginBottom: 8,
                }}>
                  <Ionicons name={item.icon as any} size={22} color={item.color} />
                </View>
                <Text style={{ color: '#fff', fontSize: 11, fontWeight: '500', textAlign: 'center' }}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}
