import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function ClockScreen() {
  const [time, setTime] = useState(new Date());
  const [activeTab, setActiveTab] = useState<'clock' | 'alarm' | 'timer' | 'stopwatch'>('clock');

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (date: Date) => ({
    hours: date.getHours().toString().padStart(2, '0'),
    minutes: date.getMinutes().toString().padStart(2, '0'),
    seconds: date.getSeconds().toString().padStart(2, '0'),
    day: date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
  });

  const t = formatTime(time);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Clock</Text>
        <TouchableOpacity onPress={() => Alert.alert("Add Alarm", "Alarm creation coming soon.")}>
          <Ionicons name="add" size={28} color="#E91E63" />
        </TouchableOpacity>
      </View>

      {/* Main Clock */}
      {activeTab === 'clock' && (
        <View style={styles.clockContainer}>
          <Text style={styles.timeText}>{t.hours}:{t.minutes}</Text>
          <Text style={styles.secondsText}>:{t.seconds}</Text>
          <Text style={styles.dateText}>{t.day}</Text>
        </View>
      )}

      {/* World Clock List (placeholder) */}
      <View style={styles.worldClockSection}>
        <Text style={styles.sectionTitle}>World Clock</Text>
        <View style={styles.worldClockItem}>
          <View>
            <Text style={styles.cityText}>Nairobi</Text>
            <Text style={styles.offsetText}>Today, +0 HRS</Text>
          </View>
          <Text style={styles.worldTimeText}>{t.hours}:{t.minutes}</Text>
        </View>
        <View style={styles.worldClockItem}>
          <View>
            <Text style={styles.cityText}>London</Text>
            <Text style={styles.offsetText}>Today, -2 HRS</Text>
          </View>
          <Text style={styles.worldTimeText}>{((time.getUTCHours() + 1) % 24).toString().padStart(2, '0')}:{t.minutes}</Text>
        </View>
        <View style={styles.worldClockItem}>
          <View>
            <Text style={styles.cityText}>New York</Text>
            <Text style={styles.offsetText}>Today, -7 HRS</Text>
          </View>
          <Text style={styles.worldTimeText}>{((time.getUTCHours() - 4 + 24) % 24).toString().padStart(2, '0')}:{t.minutes}</Text>
        </View>
      </View>

      {/* Bottom Tabs */}
      <View style={styles.bottomTabs}>
        {[
          { key: 'clock', icon: 'time', label: 'World' },
          { key: 'alarm', icon: 'alarm', label: 'Alarm' },
          { key: 'timer', icon: 'hourglass', label: 'Timer' },
          { key: 'stopwatch', icon: 'stopwatch', label: 'Stopwatch' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={styles.tabItem}
            onPress={() => setActiveTab(tab.key as any)}
          >
            <Ionicons
              name={tab.icon as any}
              size={24}
              color={activeTab === tab.key ? '#E91E63' : '#666'}
            />
            <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 50, paddingBottom: 16,
  },
  headerTitle: { color: '#fff', fontSize: 32, fontWeight: '700' },

  clockContainer: { alignItems: 'center', paddingVertical: 40 },
  timeText: { color: '#fff', fontSize: 80, fontWeight: '200', letterSpacing: -2 },
  secondsText: { color: '#E91E63', fontSize: 40, fontWeight: '300', marginTop: -10 },
  dateText: { color: '#888', fontSize: 18, marginTop: 12 },

  worldClockSection: { flex: 1, paddingHorizontal: 20 },
  sectionTitle: { color: '#888', fontSize: 13, fontWeight: '600', textTransform: 'uppercase', marginBottom: 12 },
  worldClockItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 16, borderBottomWidth: 0.5, borderBottomColor: '#222',
  },
  cityText: { color: '#fff', fontSize: 18, fontWeight: '500' },
  offsetText: { color: '#666', fontSize: 13, marginTop: 2 },
  worldTimeText: { color: '#fff', fontSize: 28, fontWeight: '300' },

  bottomTabs: {
    flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#222',
    paddingVertical: 8, paddingBottom: 20,
  },
  tabItem: { flex: 1, alignItems: 'center', gap: 4 },
  tabLabel: { color: '#666', fontSize: 11 },
  tabLabelActive: { color: '#E91E63' },
});
