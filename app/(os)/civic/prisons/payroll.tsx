import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { PrisonNav } from '../../../../../lib/civic/prisons/components/PrisonNav';
import { PayrollList } from '../../../../../lib/civic/prisons/components/PayrollList';
import { PayrollForm } from '../../../../../lib/civic/prisons/components/PayrollForm';
import { usePrisonPayroll } from '../../../../../lib/civic/prisons/hooks/usePrisonPayroll';

export default function PrisonPayroll() {
  const { payroll, isLoading } = usePrisonPayroll();
  const [showForm, setShowForm] = React.useState(false);

  return (
    <View style={styles.container}>
      <PrisonNav />

      <View style={styles.header}>
        <Text style={styles.title}>Prison Payroll</Text>
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
