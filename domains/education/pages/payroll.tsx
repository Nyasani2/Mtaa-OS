
import { View, Text, ScrollView } from 'react-native';
import { useState } from 'react';
import { usePayroll } from '../../hooks/usePayroll';
import PayrollCard from '../../components/PayrollCard';

export default function PayrollPage() {
  // In real app, get teacherId from auth context
  const teacherId = 'placeholder';
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));

  const { data: records, isLoading } = usePayroll(teacherId, month);

  return (
    <View style={{ flex: 1, backgroundColor: '#0f172a' }}>
      <View style={{ padding: 20 }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 16 }}>
          Payroll
        </Text>
      </View>

      <ScrollView style={{ paddingHorizontal: 20 }}>
        {isLoading ? (
          <Text style={{ color: '#94a3b8', textAlign: 'center', marginTop: 40 }}>Loading...</Text>
        ) : records?.map(record => (
          <PayrollCard key={record.id} record={record} />
        ))}
      </ScrollView>
    </View>
  );
