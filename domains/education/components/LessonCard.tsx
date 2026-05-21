
import { View, Text, TouchableOpacity } from 'react-native';
import { Video, Clock, BookOpen } from 'lucide-react-native';

interface Props {
  lesson: any;
  onPress: () => void;
}

export default function LessonCard({ lesson, onPress }: Props) {
  const statusColor = {
    scheduled: '#94a3b8',
    live: '#ef4444',
    completed: '#10b981',
    cancelled: '#64748b',
  }[lesson.status] || '#94a3b8';

  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        backgroundColor: '#1e293b',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderLeftWidth: 4,
        borderLeftColor: statusColor,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>
            {lesson.title}
          </Text>
          <Text style={{ color: '#94a3b8', fontSize: 12, marginTop: 4 }}>
            {lesson.subject?.name}
          </Text>
        </View>
        <View style={{
          backgroundColor: statusColor + '20',
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: 8,
        }}>
          <Text style={{ color: statusColor, fontSize: 10, fontWeight: '600', textTransform: 'uppercase' }}>
            {lesson.status}
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', marginTop: 12, gap: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Clock size={14} color="#94a3b8" />
          <Text style={{ color: '#94a3b8', fontSize: 12, marginLeft: 4 }}>
            {lesson.duration_minutes} min
          </Text>
        </View>
        {lesson.is_online && (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Video size={14} color="#3b82f6" />
            <Text style={{ color: '#3b82f6', fontSize: 12, marginLeft: 4 }}>
              Online
            </Text>
          </View>
        )}
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <BookOpen size={14} color="#94a3b8" />
          <Text style={{ color: '#94a3b8', fontSize: 12, marginLeft: 4 }}>
            {lesson.teacher?.full_name || 'TBD'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
