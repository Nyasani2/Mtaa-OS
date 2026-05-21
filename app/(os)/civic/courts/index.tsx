import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Gavel, FileText, Users, Calendar, Scale } from 'lucide-react-native';

export default function CourtsHome() {
  const router = useRouter();
  
  const modules = [
    { icon: FileText, label: 'Cases', route: '/civic/courts/cases', color: '#3b82f6' },
    { icon: Calendar, label: 'Hearings', route: '/civic/courts/hearings', color: '#10b981' },
    { icon: Scale, label: 'Judgments', route: '/civic/courts/judgments', color: '#f59e0b' },
    { icon: Users, label: 'Jury', route: '/civic/courts/jury', color: '#8b5cf6' },
    { icon: Gavel, label: 'Appeals', route: '/civic/courts/appeals', color: '#ef4444' },
  ];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#0f172a' }}>
      <View style={{ padding: 20 }}>
        <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#fff', marginBottom: 8 }}>
          Courts
        </Text>
        <Text style={{ fontSize: 14, color: '#94a3b8', marginBottom: 24 }}>
          Justice administration system
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
