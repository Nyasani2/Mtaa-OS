import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SafeAreaWrapper } from '../../components/ui/SafeAreaWrapper';

const clockModules = [
  { id: 'alarms', label: 'Alarms', icon: 'bell', route: '/(os)/clock/alarms', color: '#F59E0B' },
  { id: 'timer', label: 'Timer', icon: 'hourglass', route: '/(os)/clock/timer', color: '#059669' },
  { id: 'stopwatch', label: 'Stopwatch', icon: 'stopwatch', route: '/(os)/clock/stopwatch', color: '#1E40AF' },
  { id: 'world', label: 'World Clock', icon: 'globe', route: '/(os)/clock/world', color: '#7C3AED' },
];

export default function ClockIndex() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const now = new Date();

  return (
    <SafeAreaWrapper>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 20 }} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Clock</Text>
        <View style={styles.timeDisplay}>
          <Text style={styles.timeText}>
            {now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
          </Text>
          <Text style={styles.dateText}>
            {now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </Text>
        </View>
        <View style={styles.modulesGrid}>
          {clockModules.map((mod) => (
            <TouchableOpacity key={mod.id} style={[styles.moduleCard, { borderLeftColor: mod.color }]} onPress={() => router.push(mod.route as any)}>
              <View style={[styles.iconContainer, { backgroundColor: mod.color + '15' }]}>
                <FontAwesome5 name={mod.icon} size={24} color={mod.color} />
              </View>
              <Text style={styles.moduleLabel}>{mod.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, fontWeight: '800', color: '#0F172A', marginBottom: 20 },
  timeDisplay: { alignItems: 'center', marginBottom: 30, paddingVertical: 20 },
  timeText: { fontSize: 64, fontWeight: '200', color: '#0F172A', fontVariant: ['tabular-nums'] },
  dateText: { fontSize: 16, color: '#64748B', marginTop: 8 },
  modulesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  moduleCard: { width: '47%', backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, borderLeftWidth: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  iconContainer: { width: 44, height: 44, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  moduleLabel: { fontSize: 14, fontWeight: '700', color: '#334155' },
});
