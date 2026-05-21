import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { PrisonNav } from '../../../../../lib/civic/prisons/components/PrisonNav';
import { WardensTable } from '../../../../../lib/civic/prisons/components/WardensTable';
import { WardenForm } from '../../../../../lib/civic/prisons/components/WardenForm';
import { useWardens } from '../../../../../lib/civic/prisons/hooks/useWardens';

export default function PrisonWardens() {
  const { wardens, isLoading } = useWardens();
  const [showForm, setShowForm] = React.useState(false);

  return (
    <View style={styles.container}>
      <PrisonNav />

      <View style={styles.header}>
        <Text style={styles.title}>Warden Management</Text>
        <TouchableOpacity style={styles.newBtn} onPress={() => setShowForm(true)}>
          <FontAwesome5 name="plus" size={14} color="#FFFFFF" />
          <Text style={styles.newBtnText}>Add Warden</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {showForm && (
          <View style={styles.formContainer}>
            <WardenForm onClose={() => setShowForm(false)} />
          </View>
        )}
        <WardensTable wardens={wardens || []} isLoading={isLoading} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  title: { fontSize: 20, fontWeight: '700', color: '#0F172A' },
  newBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#BE185D',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  newBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
  content: { padding: 16 },
  formContainer: { marginBottom: 16 },
});
