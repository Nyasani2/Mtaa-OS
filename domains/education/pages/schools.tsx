
import { View, Text, ScrollView, TextInput } from 'react-native';
import { useInstitutions } from '../../hooks/useInstitutions';
import InstitutionCard from '../../components/InstitutionCard';
import { Search } from 'lucide-react-native';
import { useState } from 'react';

export default function SchoolsPage() {
  const [search, setSearch] = useState('');
  const { data: institutions, isLoading } = useInstitutions();

  const filtered = institutions?.filter(i => 
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    i.county?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#0f172a' }}>
      <View style={{ padding: 20 }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 16 }}>
          Schools
        </Text>
        <View style={{
          backgroundColor: '#1e293b',
          borderRadius: 12,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 12,
        }}>
          <Search size={18} color="#94a3b8" />
          <TextInput
            placeholder="Search schools..."
            placeholderTextColor="#64748b"
            value={search}
            onChangeText={setSearch}
            style={{ color: '#fff', marginLeft: 12, flex: 1, fontSize: 14 }}
          />
        </View>
      </View>

      <ScrollView style={{ paddingHorizontal: 20 }}>
        {isLoading ? (
          <Text style={{ color: '#94a3b8', textAlign: 'center', marginTop: 40 }}>Loading...</Text>
        ) : filtered?.length === 0 ? (
          <Text style={{ color: '#94a3b8', textAlign: 'center', marginTop: 40 }}>No schools found</Text>
        ) : (
          filtered?.map(inst => (
            <InstitutionCard
              key={inst.id}
              institution={inst}
              onPress={() => {}}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}
