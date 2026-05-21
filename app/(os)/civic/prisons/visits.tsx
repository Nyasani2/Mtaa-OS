import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { PrisonNav } from '../../../../../lib/civic/prisons/components/PrisonNav';
import { VisitsList } from '../../../../../lib/civic/prisons/components/VisitsList';
import { VisitForm } from '../../../../../lib/civic/prisons/components/VisitForm';
import { useVisits } from '../../../../../lib/civic/prisons/hooks/useVisits';

export default function PrisonVisits() {
  const { visits, isLoading } = useVisits();
  const [showForm, setShowForm] = React.useState(false);

  return (
    <View style={styles.container}>
      <PrisonNav />

      <View style={styles.header}>
        <Text style={styles.title}>Visit Management</Text>
        <TouchableOpacity style={styles.newBtn} onPress={() => setShowForm(true)}>
          <FontAwesome5 name="plus" size={14} color="#FFFFFF" />
          <Text style={styles.newBtnText}>Schedule Visit</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {showForm && (
          <View style={styles.formContainer}>
            <VisitForm onClose={() => setShowForm(false)} />
          </View>
        )}
        <VisitsList visits={visits || []} isLoading={isLoading} />
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
    backgroundColor: '#7C3AED',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  newBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
  content: { padding: 16 },
  formContainer: { marginBottom: 16 },
});
