
import { View, Text, ScrollView } from 'react-native';
import { useTeachers } from '../../hooks/useTeachers';
import TeacherCard from '../../components/TeacherCard';

export default function TeachersPage() {
  // In real app, get institutionId from user's context
  const institutionId = 'placeholder';
  const { data: teachers, isLoading } = useTeachers(institutionId);

  return (
    <View style={{ flex: 1, backgroundColor: '#0f172a' }}>
      <View style={{ padding: 20 }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 16 }}>
          Teachers
        </Text>
        <Text style={{ color: '#94a3b8', fontSize: 14 }}>
          {teachers?.length || 0} active teachers
        </Text>
      </View>

      <ScrollView style={{ paddingHorizontal: 20 }}>
        {isLoading ? (
          <Text style={{ color: '#94a3b8', textAlign: 'center', marginTop: 40 }}>Loading...</Text>
        ) : teachers?.map(teacher => (
          <TeacherCard key={teacher.id} teacher={teacher} />
        ))}
      </ScrollView>
    </View>
  );
}
