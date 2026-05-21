
import { View, Text, TouchableOpacity } from 'react-native';
import { Shield, BookOpen, Award } from 'lucide-react-native';

interface Props {
  teacher: any;
  onPress?: () => void;
}

export default function TeacherCard({ teacher, onPress }: Props) {
  const kycColor = {
    verified: '#10b981',
    pending: '#f59e0b',
    unverified: '#94a3b8',
    rejected: '#ef4444',
  }[teacher.kyc_status] || '#94a3b8';

  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        backgroundColor: '#1e293b',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{
          width: 48,
          height: 48,
          borderRadius: 24,
          backgroundColor: kycColor + '20',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Shield size={24} color={kycColor} />
        </View>
        <View style={{ marginLeft: 12, flex: 1 }}>
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>
            {teacher.full_name}
          </Text>
          <Text style={{ color: '#94a3b8', fontSize: 12 }}>
            {teacher.specialization?.join(', ') || 'General'}
          </Text>
        </View>
        <View style={{
          backgroundColor: kycColor + '20',
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: 8,
        }}>
          <Text style={{ color: kycColor, fontSize: 10, fontWeight: '600', textTransform: 'uppercase' }}>
            {teacher.kyc_status}
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', marginTop: 12, gap: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <BookOpen size={14} color="#94a3b8" />
          <Text style={{ color: '#94a3b8', fontSize: 12, marginLeft: 4 }}>
            {teacher.subjects_taught?.length || 0} subjects
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Award size={14} color="#94a3b8" />
          <Text style={{ color: '#94a3b8', fontSize: 12, marginLeft: 4 }}>
            {teacher.years_experience} yrs exp
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
