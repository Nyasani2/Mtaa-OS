import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SavingsHubScreen() {
  const router = useRouter();

  const savingsGoals = [
    { id: '1', name: 'Emergency Fund', current: 15000, target: 50000, type: 'emergency' },
    { id: '2', name: 'New Phone', current: 8000, target: 45000, type: 'goal' },
    { id: '3', name: 'Business Capital', current: 25000, target: 100000, type: 'business' },
  ];

  const totalSaved = savingsGoals.reduce((sum, g) => sum + g.current, 0);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Savings</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => router.push('/wallet/savings/create-goal')}>
          <Text style={styles.addButtonText}>+ New Goal</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>Total Saved</Text>
        <Text style={styles.totalAmount}>KSh {totalSaved.toLocaleString()}</Text>
        <Text style={styles.totalSubtext}>Across {savingsGoals.length} goals</Text>
      </View>

      <ScrollView style={styles.goalsList} showsVerticalScrollIndicator={false}>
        {savingsGoals.map((goal) => (
          <TouchableOpacity key={goal.id} style={styles.goalCard} onPress={() => router.push(`/wallet/savings/${goal.id}`)}>
            <View style={styles.goalHeader}>
              <Text style={styles.goalName}>{goal.name}</Text>
              <Text style={styles.goalType}>{goal.type}</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${(goal.current / goal.target) * 100}%` }]} />
            </View>
            <View style={styles.goalFooter}>
              <Text style={styles.goalAmount}>KSh {goal.current.toLocaleString()}</Text>
              <Text style={styles.goalTarget}>of KSh {goal.target.toLocaleString()}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 16, paddingBottom: 16 },
  title: { fontSize: 28, fontWeight: '700', color: '#FFFFFF' },
  addButton: { backgroundColor: '#00D68F', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  addButtonText: { color: '#0A0A0A', fontSize: 14, fontWeight: '600' },
  totalCard: { backgroundColor: '#1A1A1A', marginHorizontal: 24, padding: 24, borderRadius: 16, marginBottom: 24 },
  totalLabel: { color: '#888888', fontSize: 14, marginBottom: 8 },
  totalAmount: { color: '#00D68F', fontSize: 36, fontWeight: '700' },
  totalSubtext: { color: '#666666', fontSize: 14, marginTop: 4 },
  goalsList: { flex: 1, paddingHorizontal: 24 },
  goalCard: { backgroundColor: '#1A1A1A', padding: 20, borderRadius: 16, marginBottom: 12 },
  goalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  goalName: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  goalType: { color: '#00D68F', fontSize: 12, textTransform: 'capitalize', backgroundColor: '#00D68F20', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  progressBar: { height: 8, backgroundColor: '#333333', borderRadius: 4, marginBottom: 12 },
  progressFill: { height: 8, backgroundColor: '#00D68F', borderRadius: 4 },
  goalFooter: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  goalAmount: { color: '#FFFFFF', fontSize: 18, fontWeight: '600' },
  goalTarget: { color: '#666666', fontSize: 14 },
});
