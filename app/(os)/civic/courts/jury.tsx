import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { CourtNav } from '../../../../../lib/civic/courts/components/CourtNav';
import { JurorList } from '../../../../../lib/civic/courts/components/JurorList';
import { JurorForm } from '../../../../../lib/civic/courts/components/JurorForm';
import { JuryAssignmentsList } from '../../../../../lib/civic/courts/components/JuryAssignmentsList';
import { useJury } from '../../../../../lib/civic/courts/hooks/useJury';

export default function CourtJury() {
  const { jurors, assignments, isLoading } = useJury();
  const [showForm, setShowForm] = React.useState(false);

  return (
    <View style={styles.container}>
      <CourtNav />

      <View style={styles.header}>
        <Text style={styles.title}>Jury Management</Text>
        <TouchableOpacity style={styles.newBtn} onPress={() => setShowForm(true)}>
          <FontAwesome5 name="plus" size={14} color="#FFFFFF" />
          <Text style={styles.newBtnText}>Add Juror</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {showForm && (
          <View style={styles.formContainer}>
            <JurorForm onClose={() => setShowForm(false)} />
          </View>
        )}

        <Text style={styles.sectionTitle}>Juror Pool</Text>
        <JurorList jurors={jurors || []} isLoading={isLoading} />

        <Text style={styles.sectionTitle}>Active Assignments</Text>
        <JuryAssignmentsList assignments={assignments || []} isLoading={isLoading} />
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
    marginTop: 20,
    marginBottom: 12,
  },
});
