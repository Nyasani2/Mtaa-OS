import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import { CourtNav } from '../../../../../lib/civic/courts/components/CourtNav';
import { CasesTable } from '../../../../../lib/civic/courts/components/CasesTable';
import { CaseForm } from '../../../../../lib/civic/courts/components/CaseForm';
import { useCases } from '../../../../../lib/civic/courts/hooks/useCases';

export default function CourtCases() {
  const router = useRouter();
  const { cases, isLoading } = useCases();
  const [showForm, setShowForm] = React.useState(false);

  return (
    <View style={styles.container}>
      <CourtNav />

      <View style={styles.header}>
        <Text style={styles.title}>Court Cases</Text>
        <TouchableOpacity style={styles.newBtn} onPress={() => setShowForm(true)}>
          <FontAwesome5 name="plus" size={14} color="#FFFFFF" />
          <Text style={styles.newBtnText}>New Case</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {showForm && (
          <View style={styles.formContainer}>
            <CaseForm onClose={() => setShowForm(false)} />
          </View>
        )}

        <CasesTable cases={cases || []} isLoading={isLoading} />
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
    backgroundColor: '#1E40AF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  newBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
  content: { padding: 16 },
  formContainer: { marginBottom: 16 },
});
