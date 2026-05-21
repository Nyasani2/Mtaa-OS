import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';

export default function ClockTimer() {
  const router = useRouter();
  const [seconds, setSeconds] = useState(300); // 5 min default
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (running && seconds > 0) {
      intervalRef.current = setInterval(() => {
        setSeconds(s => {
          if (s <= 1) {
            setRunning(false);
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, seconds]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const presets = [60, 180, 300, 600, 900, 1800];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <FontAwesome5 name="arrow-left" size={20} color="#334155" />
        </TouchableOpacity>
        <Text style={styles.title}>Timer</Text>
        <View style={{ width: 20 }} />
      </View>

      <View style={styles.timerDisplay}>
        <Text style={styles.timerText}>{formatTime(seconds)}</Text>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.controlBtn, running && styles.pauseBtn]}
          onPress={() => setRunning(!running)}
        >
          <FontAwesome5 name={running ? 'pause' : 'play'} size={24} color="#FFFFFF" />
          <Text style={styles.controlText}>{running ? 'Pause' : 'Start'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.resetBtn} onPress={() => { setRunning(false); setSeconds(300); }}>
          <FontAwesome5 name="redo" size={20} color="#64748B" />
          <Text style={styles.resetText}>Reset</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.presets}>
        <Text style={styles.presetTitle}>Quick Presets</Text>
        <View style={styles.presetRow}>
          {presets.map((p) => (
            <TouchableOpacity key={p} style={styles.presetBtn} onPress={() => { setRunning(false); setSeconds(p); }}>
              <Text style={styles.presetText}>{Math.floor(p / 60)}m</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
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
  timerDisplay: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 40,
  },
  timerText: { fontSize: 72, fontWeight: '200', color: '#0F172A', fontVariant: ['tabular-nums'] },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 40,
  },
  controlBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#059669',
    paddingHorizontal: 30,
    paddingVertical: 14,
    borderRadius: 30,
    gap: 10,
  },
  pauseBtn: { backgroundColor: '#D97706' },
  controlText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 30,
    gap: 8,
  },
  resetText: { color: '#64748B', fontSize: 14, fontWeight: '600' },
  presets: { paddingHorizontal: 16 },
  presetTitle: { fontSize: 14, fontWeight: '600', color: '#64748B', marginBottom: 12 },
  presetRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  presetBtn: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  presetText: { fontSize: 14, fontWeight: '600', color: '#334155' },
});
