import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';

interface Lap {
  id: number;
  time: string;
  split: string;
}

export default function ClockStopwatch() {
  const router = useRouter();
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [laps, setLaps] = useState<Lap[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef(0);
  const lapStartRef = useRef(0);

  useEffect(() => {
    if (running) {
      startTimeRef.current = Date.now() - elapsed;
      intervalRef.current = setInterval(() => {
        setElapsed(Date.now() - startTimeRef.current);
      }, 10);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const centis = Math.floor((ms % 1000) / 10);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${centis.toString().padStart(2, '0')}`;
  };

  const recordLap = () => {
    const now = Date.now();
    const split = now - (lapStartRef.current || startTimeRef.current);
    setLaps([{ id: laps.length + 1, time: formatTime(elapsed), split: formatTime(split) }, ...laps]);
    lapStartRef.current = now;
  };

  const reset = () => {
    setRunning(false);
    setElapsed(0);
    setLaps([]);
    lapStartRef.current = 0;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <FontAwesome5 name="arrow-left" size={20} color="#334155" />
        </TouchableOpacity>
        <Text style={styles.title}>Stopwatch</Text>
        <View style={{ width: 20 }} />
      </View>

      <View style={styles.timerDisplay}>
        <Text style={styles.timerText}>{formatTime(elapsed)}</Text>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.controlBtn, running && styles.pauseBtn]}
          onPress={() => setRunning(!running)}
        >
          <FontAwesome5 name={running ? 'pause' : 'play'} size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.lapBtn} onPress={recordLap} disabled={!running}>
          <FontAwesome5 name="flag" size={18} color={running ? '#1E40AF' : '#CBD5E1'} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.resetBtn} onPress={reset}>
          <FontAwesome5 name="redo" size={18} color="#DC2626" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.lapsArea}>
        {laps.map((lap) => (
          <View key={lap.id} style={styles.lapRow}>
            <Text style={styles.lapNum}>Lap {lap.id}</Text>
            <Text style={styles.lapTime}>{lap.time}</Text>
            <Text style={styles.lapSplit}>+{lap.split}</Text>
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
  timerDisplay: {
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 30,
  },
  timerText: { fontSize: 56, fontWeight: '200', color: '#0F172A', fontVariant: ['tabular-nums'] },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 20,
  },
  controlBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pauseBtn: { backgroundColor: '#D97706' },
  lapBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resetBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lapsArea: { paddingHorizontal: 16 },
  lapRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  lapNum: { fontSize: 13, color: '#64748B', width: 60 },
  lapTime: { fontSize: 14, fontWeight: '600', color: '#334155', fontVariant: ['tabular-nums'] },
  lapSplit: { fontSize: 12, color: '#94A3B8', fontVariant: ['tabular-nums'] },
});
