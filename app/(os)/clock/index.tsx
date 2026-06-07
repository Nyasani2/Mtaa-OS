// app/(os)/clock/index.tsx — MTAA OS Clock
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES } from '@/constants/theme';

export default function ClockScreen() {
  const router = useRouter();
  const [time, setTime] = useState(new Date());
  const [activeTab, setActiveTab] = useState<'world' | 'alarm' | 'stopwatch' | 'timer'>('world');

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (date: Date) => ({
    hours: date.getHours().toString().padStart(2, '0'),
    minutes: date.getMinutes().toString().padStart(2, '0'),
    seconds: date.getSeconds().toString().padStart(2, '0'),
    day: date.toLocaleDateString('en-KE', { weekday: 'long', month: 'long', day: 'numeric' }),
  });

  const t = formatTime(time);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Clock</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.timeDisplay}>
        <Text style={styles.timeText}>{t.hours}:{t.minutes}</Text>
        <Text style={styles.secondsText}>:{t.seconds}</Text>
      </View>
      <Text style={styles.dateText}>{t.day}</Text>

      <View style={styles.tabBar}>
        {(['world', 'alarm', 'stopwatch', 'timer'] as const).map(tab => (
          <TouchableOpacity key={tab} style={[styles.tab, activeTab === tab && styles.tabActive]} onPress={() => setActiveTab(tab)}>
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab.charAt(0).toUpperCase() + tab.slice(1)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.content}>
        {activeTab === 'world' && (
          <View style={styles.worldClock}>
            <Text style={styles.sectionTitle}>World Clock</Text>
            {['Nairobi', 'London', 'New York', 'Tokyo', 'Dubai'].map(city => {
              const offset = { Nairobi: 0, London: -2, 'New York': -7, Tokyo: 6, Dubai: 1 }[city] || 0;
              const cityTime = new Date(time.getTime() + offset * 3600000);
              return (
                <View key={city} style={styles.cityRow}>
                  <Text style={styles.cityName}>{city}</Text>
                  <Text style={styles.cityTime}>{cityTime.getHours().toString().padStart(2,'0')}:{cityTime.getMinutes().toString().padStart(2,'0')}</Text>
                </View>
              );
            })}
          </View>
        )}
        {activeTab === 'alarm' && (
          <View style={styles.emptyState}>
            <Ionicons name="alarm-outline" size={48} color={COLORS.textSecondary} />
            <Text style={styles.emptyText}>No alarms set</Text>
          </View>
        )}
        {activeTab === 'stopwatch' && (
          <View style={styles.emptyState}>
            <Ionicons name="timer-outline" size={48} color={COLORS.textSecondary} />
            <Text style={styles.emptyText}>Stopwatch ready</Text>
          </View>
        )}
        {activeTab === 'timer' && (
          <View style={styles.emptyState}>
            <Ionicons name="hourglass-outline" size={48} color={COLORS.textSecondary} />
            <Text style={styles.emptyText}>Timer ready</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SIZES.md, paddingTop: SIZES.xl, paddingBottom: SIZES.md },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontFamily: FONTS.bold, fontSize: 18, color: COLORS.text },
  timeDisplay: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', marginTop: SIZES.xl * 2 },
  timeText: { fontFamily: FONTS.bold, fontSize: 72, color: COLORS.text, letterSpacing: -2 },
  secondsText: { fontFamily: FONTS.bold, fontSize: 36, color: COLORS.textSecondary },
  dateText: { fontFamily: FONTS.medium, fontSize: 16, color: COLORS.textSecondary, textAlign: 'center', marginTop: SIZES.sm },
  tabBar: { flexDirection: 'row', marginTop: SIZES.xl, paddingHorizontal: SIZES.md, gap: SIZES.sm },
  tab: { flex: 1, paddingVertical: SIZES.sm, borderRadius: SIZES.sm, alignItems: 'center', backgroundColor: COLORS.surface },
  tabActive: { backgroundColor: COLORS.primary },
  tabText: { fontFamily: FONTS.medium, fontSize: 13, color: COLORS.textSecondary },
  tabTextActive: { color: '#fff', fontFamily: FONTS.bold },
  content: { flex: 1, padding: SIZES.md },
  worldClock: { paddingTop: SIZES.lg },
  sectionTitle: { fontFamily: FONTS.bold, fontSize: 18, color: COLORS.text, marginBottom: SIZES.lg },
  cityRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: SIZES.md, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  cityName: { fontFamily: FONTS.medium, fontSize: 16, color: COLORS.text },
  cityTime: { fontFamily: FONTS.bold, fontSize: 16, color: COLORS.primary },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontFamily: FONTS.medium, fontSize: 16, color: COLORS.textSecondary, marginTop: SIZES.md },
});
