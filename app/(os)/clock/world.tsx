import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';

interface WorldClock {
  city: string;
  country: string;
  timezone: string;
  offset: string;
  icon: string;
}

const worldClocks: WorldClock[] = [
  { city: 'Nairobi', country: 'Kenya', timezone: 'EAT', offset: '+0', icon: 'globe-africa' },
  { city: 'Lagos', country: 'Nigeria', timezone: 'WAT', offset: '-1', icon: 'globe-africa' },
  { city: 'Cairo', country: 'Egypt', timezone: 'EET', offset: '+1', icon: 'globe-africa' },
  { city: 'London', country: 'UK', timezone: 'BST', offset: '-2', icon: 'globe-europe' },
  { city: 'New York', country: 'USA', timezone: 'EDT', offset: '-7', icon: 'globe-americas' },
  { city: 'Dubai', country: 'UAE', timezone: 'GST', offset: '+1', icon: 'globe-asia' },
  { city: 'Tokyo', country: 'Japan', timezone: 'JST', offset: '+6', icon: 'globe-asia' },
  { city: 'Sydney', country: 'Australia', timezone: 'AEST', offset: '+7', icon: 'globe-asia' },
];

export default function ClockWorld() {
  const router = useRouter();
  const now = new Date();

  const getTime = (offset: string) => {
    const h = parseInt(offset);
    const d = new Date(now.getTime() + h * 3600000);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <FontAwesome5 name="arrow-left" size={20} color="#334155" />
        </TouchableOpacity>
        <Text style={styles.title}>World Clock</Text>
        <TouchableOpacity>
          <FontAwesome5 name="plus" size={18} color="#F59E0B" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {worldClocks.map((clock, index) => (
          <View key={index} style={styles.clockItem}>
            <View style={styles.clockLeft}>
              <View style={styles.iconBox}>
                <FontAwesome5 name={clock.icon} size={18} color="#64748B" />
              </View>
              <View>
                <Text style={styles.cityName}>{clock.city}</Text>
                <Text style={styles.countryName}>{clock.country}</Text>
                <Text style={styles.timezone}>{clock.timezone} {clock.offset !== '+0' && `(${clock.offset}h)`}</Text>
              </View>
            </View>
            <Text style={styles.clockTime}>{getTime(clock.offset)}</Text>
          </View>
        ))}
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
  title: { fontSize: 18, fontWeight: '700', color: '#0F172A' },
  content: { padding: 16 },
  clockItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  clockLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cityName: { fontSize: 16, fontWeight: '700', color: '#334155' },
  countryName: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  timezone: { fontSize: 11, color: '#CBD5E1', marginTop: 2 },
  clockTime: { fontSize: 24, fontWeight: '300', color: '#0F172A', fontVariant: ['tabular-nums'] },
});
