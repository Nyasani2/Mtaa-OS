
import { View, Text, TouchableOpacity } from 'react-native';
import { User, GraduationCap } from 'lucide-react-native';

interface Props {
  student: any;
  onPress?: () => void;
}

export default function StudentCard({ student, onPress }: Props) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        backgroundColor: '#1e293b',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      <View style={{
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#3b82f620',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <User size={24} color="#3b82f6" />
      </View>
      <View style={{ marginLeft: 12, flex: 1 }}>
        <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>
          {student.full_name}
        </Text>
        <Text style={{ color: '#94a3b8', fontSize: 12, marginTop: 2 }}>
          {student.admission_number}
        </Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <GraduationCap size={14} color="#94a3b8" />
          <Text style={{ color: '#94a3b8', fontSize: 12, marginLeft: 4 }}>
            {student.current_level}
          </Text>
        </View>
        {student.is_minor && (
          <View style={{
            backgroundColor: '#f59e0b20',
            paddingHorizontal: 6,
            paddingVertical: 2,
            borderRadius: 6,
            marginTop: 4,
          }}>
            <Text style={{ color: '#f59e0b', fontSize: 10 }}>Junior</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}
