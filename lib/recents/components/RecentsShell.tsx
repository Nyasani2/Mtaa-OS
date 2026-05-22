import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const activities = [
  { id: 1, type: 'ride', title: 'MTaxi to CBD', time: '2m ago', amount: '-KES 350', icon: 'car', color: '#4F46E5' },
  { id: 2, type: 'payment', title: 'Sent to John', time: '15m ago', amount: '-KES 500', icon: 'send', color: '#10B981' },
  { id: 3, type: 'shop', title: 'Shop Purchase', time: '1h ago', amount: '-KES 1,200', icon: 'cart', color: '#F59E0B' },
  { id: 4, type: 'job', title: 'Applied: Developer', time: '3h ago', amount: '', icon: 'briefcase', color: '#6366F1' },
  { id: 5, type: 'health', title: 'Doctor Visit', time: '1d ago', amount: '-KES 2,000', icon: 'medical', color: '#DC2626' },
];

export function RecentsShell() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Recents</Text>
        <TouchableOpacity>
          <Text style={styles.clearText}>Clear All</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={activities}
        keyExtractor={a => a.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.activityRow}>
            <View style={[styles.iconBox, { backgroundColor: item.color + '20' }]}>
              <Ionicons name={item.icon as any} size={20} color={item.color} />
            </View>
            <View style={styles.activityInfo}>
              <Text style={styles.activityTitle}>{item.title}</Text>
              <Text style={styles.activityTime}>{item.time}</Text>
            </View>
            {item.amount ? (
              <Text style={styles.activityAmount}>{item.amount}</Text>
            ) : (
              <Ionicons name="chevron-forward" size={16} color="#64748B" />
            )}
          </TouchableOpacity>
        )}
        contentContainerStyle={{ padding: 16 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050816' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 60 },
  title: { fontSize: 32, fontWeight: 'bold', color: 'white' },
  clearText: { color: '#EF4444', fontSize: 14 },
  activityRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1E293B' },
  iconBox: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  activityInfo: { flex: 1, marginLeft: 12 },
  activityTitle: { color: 'white', fontSize: 15 },
  activityTime: { color: '#64748B', fontSize: 12, marginTop: 2 },
  activityAmount: { color: '#EF4444', fontSize: 14, fontWeight: '600' },
});
