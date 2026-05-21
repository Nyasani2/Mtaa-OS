import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { CourtNav } from '../../../../../lib/civic/courts/components/CourtNav';
import { PayrollList } from '../../../../../lib/civic/courts/components/PayrollList';
import { PayrollForm } from '../../../../../lib/civic/courts/components/PayrollForm';
import { usePayroll } from '../../../../../lib/civic/courts/hooks/usePayroll';

export default function CourtPayroll() {
  const { payroll, isLoading } = usePayroll();
  const [showForm, setShowForm] = React.useState(false);

  return (
    <View style={styles.container}>
      <CourtNav />

      <View style={styles.header}>
        <Text style={styles.title}>Court Payroll</Text>
        <TouchableOpacity style={styles.newBtn} onPress={() => setShowForm(true)}>
          <FontAwesome5 name="plus" size={14} color="#FFFFFF" />
          <Text style={styles.newBtnText}>New Entry</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {showForm && (
          <View style={styles.formContainer}>
            <PayrollForm onClose={() => setShowForm(false)} />
          </View>
        )}
        <PayrollList payroll={payroll || []} isLoading={isLoading} />
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
    backgroundColor: '#4338CA',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  newBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
  content: { padding: 16 },
  formContainer: { marginBottom: 16 },
});
