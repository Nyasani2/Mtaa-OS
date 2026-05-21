import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Shield, Users, Grid3X3, LogIn, LogOut, Calendar, AlertTriangle, FileCheck } from 'lucide-react-native';

export default function PrisonsHome() {
  const router = useRouter();
  
  const modules = [
    { icon: Users, label: 'Inmates', route: '/civic/prisons/inmates', color: '#3b82f6' },
    { icon: Grid3X3, label: 'Cells', route: '/civic/prisons/cells', color: '#10b981' },
    { icon: LogIn, label: 'Admissions', route: '/civic/prisons/admissions', color: '#f59e0b' },
    { icon: LogOut, label: 'Releases', route: '/civic/prisons/releases', color: '#8b5cf6' },
    { icon: Calendar, label: 'Visits', route: '/civic/prisons/visits', color: '#06b6d4' },
    { icon: AlertTriangle, label: 'Incidents', route: '/civic/prisons/incidents', color: '#ef4444' },
    { icon: FileCheck, label: 'Parole', route: '/civic/prisons/parole', color: '#84cc16' },
    { icon: Shield, label: 'Wardens', route: '/civic/prisons/wardens', color: '#f97316' },
  ];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#0f172a' }}>
      <View style={{ padding: 20 }}>
        <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#fff', marginBottom: 8 }}>
          Prisons
        </Text>
        <Text style={{ fontSize: 14, color: '#94a3b8', marginBottom: 24 }}>
          Correctional facility management
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
