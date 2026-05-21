
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { MapPin, Users, CheckCircle } from 'lucide-react-native';

interface Props {
  institution: any;
  onPress: () => void;
}

export default function InstitutionCard({ institution, onPress }: Props) {
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
      <Image
        source={{ uri: institution.logo_url || 'https://via.placeholder.com/60' }}
        style={{ width: 60, height: 60, borderRadius: 12, marginRight: 16 }}
      />
      <View style={{ flex: 1 }}>
        <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>
          {institution.name}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
          <MapPin size={14} color="#94a3b8" />
          <Text style={{ color: '#94a3b8', fontSize: 12, marginLeft: 4 }}>
            {institution.city}, {institution.county}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
          <Users size={14} color="#94a3b8" />
          <Text style={{ color: '#94a3b8', fontSize: 12, marginLeft: 4 }}>
            {institution.type?.toUpperCase()} • {institution.category}
          </Text>
        </View>
      </View>
      {institution.verification_status === 'verified' && (
        <CheckCircle size={24} color="#10b981" />
      )}
    </TouchableOpacity>
  );
}
