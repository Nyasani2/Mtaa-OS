
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { School, Users, BookOpen, MessageSquare, Calendar, CreditCard, GraduationCap, Newspaper } from 'lucide-react-native';

export default function EducationHome() {
  const router = useRouter();

  const modules = [
    { icon: School, label: 'Schools', route: '/education/schools', color: '#3b82f6' },
    { icon: Users, label: 'Teachers', route: '/education/teachers', color: '#10b981' },
    { icon: BookOpen, label: 'Classes', route: '/education/classes', color: '#f59e0b' },
    { icon: MessageSquare, label: 'Messages', route: '/education/messages', color: '#8b5cf6' },
    { icon: Calendar, label: 'Timetable', route: '/education/timetable', color: '#06b6d4' },
    { icon: CreditCard, label: 'Payroll', route: '/education/payroll', color: '#ef4444' },
    { icon: GraduationCap, label: 'Alumni', route: '/education/alumni', color: '#84cc16' },
    { icon: Newspaper, label: 'News Feed', route: '/education/feed', color: '#f97316' },
  ];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#0f172a' }}>
      <View style={{ padding: 20 }}>
        <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#fff', marginBottom: 8 }}>
          Education
        </Text>
        <Text style={{ fontSize: 14, color: '#94a3b8', marginBottom: 24 }}>
          Kenya Education Management System
        </Text>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          {modules.map((m, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => router.push(m.route as any)}
              style={{
                width: '47%',
                backgroundColor: '#1e293b',
                borderRadius: 16,
                padding: 20,
                alignItems: 'center',
                borderLeftWidth: 4,
                borderLeftColor: m.color,
              }}
            >
              <m.icon size={32} color={m.color} />
              <Text style={{ color: '#fff', marginTop: 12, fontSize: 16, fontWeight: '600' }}>
                {m.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
