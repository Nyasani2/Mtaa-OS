import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { CourtNav } from '../../../../../lib/civic/courts/components/CourtNav';
import { BailsList } from '../../../../../lib/civic/courts/components/BailsList';
import { BailForm } from '../../../../../lib/civic/courts/components/BailForm';
import { useBails } from '../../../../../lib/civic/courts/hooks/useBails';

export default function CourtBails() {
  const { bails, isLoading } = useBails();
  const [showForm, setShowForm] = React.useState(false);

  return (
    <View style={styles.container}>
      <CourtNav />

      <View style={styles.header}>
        <Text style={styles.title}>Bail Management</Text>
        <TouchableOpacity style={styles.newBtn} onPress={() => setShowForm(true)}>
          <FontAwesome5 name="plus" size={14} color="#FFFFFF" />
          <Text style={styles.newBtnText}>New Bail</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {showForm && (
          <View style={styles.formContainer}>
            <BailForm onClose={() => setShowForm(false)} />
          </View>
        )}
        <BailsList bails={bails || []} isLoading={isLoading} />
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
    backgroundColor: '#D97706',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  newBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
  content: { padding: 16 },
  formContainer: { marginBottom: 16 },
});
