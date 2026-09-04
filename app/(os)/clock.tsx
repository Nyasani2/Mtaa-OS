import React, { useState, useEffect, useRef } from 'react';
import { Alert, View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Platform, Vibration, Keyboard } from 'react-native';
import { useRouter } from 'expo-router';
import { Alert, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Types ─────────────────────────────────────────────────────────
interface CityClock {
  city: string;
  region: string;
  offset: number;
}

interface AlarmItem {
  id: string;
  time: string;
  label: string;
  repeat: string[];
  enabled: boolean;
}

interface Lap {
  id: number;
  split: string;
  total: string;
}

// ─── World Clock Data ──────────────────────────────────────────────
const WORLD_CITIES: CityClock[] = [
  { city: 'Nairobi', region: 'Kenya', offset: 3 },
  { city: 'London', region: 'UK', offset: 1 },
  { city: 'New York', region: 'USA', offset: -4 },
  { city: 'Tokyo', region: 'Japan', offset: 9 },
  { city: 'Sydney', region: 'Australia', offset: 10 },
  { city: 'Dubai', region: 'UAE', offset: 4 },
  { city: 'Paris', region: 'France', offset: 2 },
  { city: 'Los Angeles', region: 'USA', offset: -7 },
  { city: 'Mumbai', region: 'India', offset: 5.5 },
  { city: 'Cairo', region: 'Egypt', offset: 3 },
];

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// ─── Helpers ────────────────────────────────────────────────────────
function getCityTime(city: CityClock, now: Date): string {
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const cityTime = new Date(utc + city.offset * 3600000);
  const h = cityTime.getHours().toString().padStart(2, '0');
  const m = cityTime.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
}

function getCityDay(city: CityClock, now: Date): string {
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const cityTime = new Date(utc + city.offset * 3600000);
  const diff = Math.floor((cityTime.getTime() - now.getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  return cityTime.toLocaleDateString('en-US', { weekday: 'long' });
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const h = hours > 0 ? `${hours}:` : '';
  return `${h}${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// ─── Main Component ────────────────────────────────────────────────
export default function ClockScreen() {
  const [time, setTime] = useState(new Date());
  const [activeTab, setActiveTab] = useState<'clock' | 'alarm' | 'timer' | 'stopwatch'>('clock');

  // Alarm state
  const [alarms, setAlarms] = useState<AlarmItem[]>([]);
  const [showAlarmModal, setShowAlarmModal] = useState(false);
  const [alarmHour, setAlarmHour] = useState('07');
  const [alarmMinute, setAlarmMinute] = useState('00');
  const [alarmLabel, setAlarmLabel] = useState('');
  const [alarmRepeat, setAlarmRepeat] = useState<string[]>([]);

  // Timer state
  const [timerDuration, setTimerDuration] = useState(300);
  const [timerRemaining, setTimerRemaining] = useState(300);
  const [timerRunning, setTimerRunning] = useState(false);
  const timerInterval = useRef<NodeJS.Timeout | null>(null);

  // Stopwatch state
  const [stopwatchElapsed, setStopwatchElapsed] = useState(0);
  const [stopwatchRunning, setStopwatchRunning] = useState(false);
  const [laps, setLaps] = useState<Lap[]>([]);
  const stopwatchInterval = useRef<NodeJS.Timeout | null>(null);

  // Load alarms
  useEffect(() => {
    AsyncStorage.getItem('mtaa_alarms').then(data => {
      if (data) setAlarms(JSON.parse(data));
    });
  }, []);

  useEffect(() => {
    AsyncStorage.setItem('mtaa_alarms', JSON.stringify(alarms));
  }, [alarms]);

  // Clock tick
  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Timer countdown
  useEffect(() => {
    if (timerRunning && timerRemaining > 0) {
      timerInterval.current = setInterval(() => {
        setTimerRemaining(prev => {
          if (prev <= 1) {
            setTimerRunning(false);
            if (Platform.OS !== 'web') Vibration.vibrate([0, 500, 200, 500]);
            Alert.alert('Timer Done!', 'Your timer has finished.');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerInterval.current) clearInterval(timerInterval.current);
    }
    return () => { if (timerInterval.current) clearInterval(timerInterval.current); };
  }, [timerRunning, timerRemaining]);

  // Stopwatch tick
  useEffect(() => {
    if (stopwatchRunning) {
      const start = Date.now() - stopwatchElapsed;
      stopwatchInterval.current = setInterval(() => {
        setStopwatchElapsed(Date.now() - start);
      }, 10);
    } else {
      if (stopwatchInterval.current) clearInterval(stopwatchInterval.current);
    }
    return () => { if (stopwatchInterval.current) clearInterval(stopwatchInterval.current); };
  }, [stopwatchRunning]);

  // ─── Alarm Actions ───────────────────────────────────────────────
  const addAlarm = () => {
    const newAlarm: AlarmItem = {
      id: Date.now().toString(),
      time: `${alarmHour}:${alarmMinute}`,
      label: alarmLabel || 'Alarm',
      repeat: alarmRepeat,
      enabled: true,
    };
    setAlarms(prev => [...prev, newAlarm].sort((a, b) => a.time.localeCompare(b.time)));
    setShowAlarmModal(false);
    setAlarmLabel('');
    setAlarmRepeat([]);
  };

  const toggleAlarm = (id: string) => {
    setAlarms(prev => prev.map((a: any) => a.id === id ? { ...a, enabled: !a.enabled } : a));
  };

  const deleteAlarm = (id: string) => {
    Alert.alert('Delete Alarm', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => setAlarms(prev => prev.filter((a: any) => a.id !== id)) },
    ]);
  };

  // ─── Timer Actions ───────────────────────────────────────────────
  const startTimer = () => setTimerRunning(true);
  const pauseTimer = () => setTimerRunning(false);
  const resetTimer = () => { setTimerRunning(false); setTimerRemaining(timerDuration); };
  const adjustTimer = (seconds: number) => {
    const newVal = Math.max(1, timerDuration + seconds);
    setTimerDuration(newVal);
    if (!timerRunning) setTimerRemaining(newVal);
  };

  // ─── Stopwatch Actions ───────────────────────────────────────────
  const startStopwatch = () => setStopwatchRunning(true);
  const pauseStopwatch = () => setStopwatchRunning(false);
  const resetStopwatch = () => { setStopwatchRunning(false); setStopwatchElapsed(0); setLaps([]); };
  const addLap = () => {
    const lapTime = stopwatchElapsed;
    const lastLapTotal = laps.length > 0 ? parseDurationMs(laps[laps.length - 1].total) : 0;
    const split = lapTime - lastLapTotal;
    setLaps(prev => [...prev, { id: prev.length + 1, split: formatDuration(split), total: formatDuration(lapTime) }]);
  };

  function parseDurationMs(str: string): number {
    const parts = str.split(':').map(Number);
    if (parts.length === 3) return (parts[0] * 3600 + parts[1] * 60 + parts[2]) * 1000;
    return (parts[0] * 60 + parts[1]) * 1000;
  }

  // ─── Render ──────────────────────────────────────────────────────
  const t = {
    hours: time.getHours().toString().padStart(2, '0'),
    minutes: time.getMinutes().toString().padStart(2, '0'),
    seconds: time.getSeconds().toString().padStart(2, '0'),
    day: time.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Clock</Text>
        {activeTab === 'alarm' && (
          <TouchableOpacity onPress={() => setShowAlarmModal(true)}>
            <Ionicons name="add" size={28} color="#E91E63" />
          </TouchableOpacity>
        )}
      </View>

      {/* ─── WORLD CLOCK TAB ─── */}
      {activeTab === 'clock' && (
        <>
          <View style={styles.mainClock}>
            <Text style={styles.timeText}>{t.hours}:{t.minutes}</Text>
            <Text style={styles.secondsText}>:{t.seconds}</Text>
            <Text style={styles.dateText}>{t.day}</Text>
          </View>
          <ScrollView style={styles.worldClockList} showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionTitle}>World Clock</Text>
            {WORLD_CITIES.map((city) => (
              <View key={city.city} style={styles.worldClockItem}>
                <View>
                  <Text style={styles.cityText}>{city.city}</Text>
                  <Text style={styles.offsetText}>{getCityDay(city, time)}, {city.offset >= 0 ? '+' : ''}{city.offset} HRS</Text>
                </View>
                <Text style={styles.worldTimeText}>{getCityTime(city, time)}</Text>
              </View>
            ))}
          </ScrollView>
        </>
      )}

      {/* ─── ALARM TAB ─── */}
      {activeTab === 'alarm' && (
        <View style={styles.tabContent}>
          {alarms.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="alarm-outline" size={64} color="#333" />
              <Text style={styles.emptyText}>No Alarms</Text>
              <Text style={styles.emptySubtext}>Tap + to add an alarm</Text>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              {alarms.map((alarm: any) => (
                <View key={alarm.id} style={styles.alarmItem}>
                  <View style={styles.alarmInfo}>
                    <Text style={[styles.alarmTime, !alarm.enabled && styles.alarmTimeDisabled]}>{alarm.time}</Text>
                    <Text style={styles.alarmLabel}>{alarm.label}</Text>
                    {alarm.repeat.length > 0 && <Text style={styles.alarmRepeat}>{alarm.repeat.join(', ')}</Text>}
                  </View>
                  <View style={styles.alarmActions}>
                    <TouchableOpacity style={[styles.toggleBtn, alarm.enabled && styles.toggleBtnOn]} onPress={() => toggleAlarm(alarm.id)}>
                      <View style={[styles.toggleKnob, alarm.enabled && styles.toggleKnobOn]} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => deleteAlarm(alarm.id)} style={styles.deleteBtn}>
                      <Ionicons name="trash-outline" size={18} color="#ff4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      )}

      {/* ─── TIMER TAB ─── */}
      {activeTab === 'timer' && (
        <View style={styles.tabContent}>
          <View style={styles.timerDisplay}>
            <Text style={styles.timerText}>
              {Math.floor(timerRemaining / 60).toString().padStart(2, '0')}:
              {(timerRemaining % 60).toString().padStart(2, '0')}
            </Text>
            <View style={styles.timerBar}>
              <View style={[styles.timerBarFill, { width: `${(timerRemaining / timerDuration) * 100}%` }]} />
            </View>
          </View>
          <View style={styles.timerPresets}>
            {[60, 180, 300, 600, 900, 1800].map((sec: any) => (
              <TouchableOpacity key={sec} style={[styles.presetBtn, timerDuration === sec && styles.presetBtnActive]}
                onPress={() => { setTimerDuration(sec); setTimerRemaining(sec); setTimerRunning(false); }}>
                <Text style={[styles.presetText, timerDuration === sec && styles.presetTextActive]}>{sec >= 60 ? `${sec / 60}m` : `${sec}s`}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.timerControls}>
            <TouchableOpacity style={styles.timerBtn} onPress={() => adjustTimer(-60)}>
              <Ionicons name="remove-circle" size={40} color="#666" />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.timerMainBtn, timerRunning && styles.timerMainBtnActive]} onPress={timerRunning ? pauseTimer : startTimer}>
              <Ionicons name={timerRunning ? 'pause' : 'play'} size={32} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.timerBtn} onPress={() => adjustTimer(60)}>
              <Ionicons name="add-circle" size={40} color="#666" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.resetBtn} onPress={resetTimer}>
            <Text style={styles.resetText}>Reset</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ─── STOPWATCH TAB ─── */}
      {activeTab === 'stopwatch' && (
        <View style={styles.tabContent}>
          <View style={styles.stopwatchDisplay}>
            <Text style={styles.stopwatchText}>{formatDuration(stopwatchElapsed)}</Text>
          </View>
          <View style={styles.stopwatchControls}>
            <TouchableOpacity style={styles.lapBtn} onPress={addLap} disabled={!stopwatchRunning}>
              <Ionicons name="flag" size={24} color={stopwatchRunning ? '#E91E63' : '#444'} />
              <Text style={[styles.lapText, !stopwatchRunning && { color: '#444' }]}>Lap</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.stopwatchMainBtn, stopwatchRunning && styles.stopwatchMainBtnActive]} onPress={stopwatchRunning ? pauseStopwatch : startStopwatch}>
              <Ionicons name={stopwatchRunning ? 'pause' : 'play'} size={32} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.lapBtn} onPress={resetStopwatch}>
              <Ionicons name="refresh" size={24} color="#ff4444" />
              <Text style={[styles.lapText, { color: '#ff4444' }]}>Reset</Text>
            </TouchableOpacity>
          </View>
          {laps.length > 0 && (
            <ScrollView style={styles.lapList} showsVerticalScrollIndicator={false}>
              <View style={styles.lapHeader}>
                <Text style={styles.lapHeaderText}>Lap</Text>
                <Text style={styles.lapHeaderText}>Split</Text>
                <Text style={styles.lapHeaderText}>Total</Text>
              </View>
              {laps.map((lap: any) => (
                <View key={lap.id} style={styles.lapRow}>
                  <Text style={styles.lapCell}>{lap.id}</Text>
                  <Text style={styles.lapCell}>{lap.split}</Text>
                  <Text style={styles.lapCell}>{lap.total}</Text>
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      )}

      {/* ─── ALARM MODAL ─── */}
      {showAlarmModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Alarm</Text>
            <View style={styles.timeInputRow}>
              <TextInput style={styles.timeInput} value={alarmHour}
                onChangeText={text => setAlarmHour(text.replace(/[^0-9]/g, '').slice(0, 2))}
                keyboardType="number-pad" maxLength={2} placeholder="HH" placeholderTextColor="#555" />
              <Text style={styles.timeColon}>:</Text>
              <TextInput style={styles.timeInput} value={alarmMinute}
                onChangeText={text => setAlarmMinute(text.replace(/[^0-9]/g, '').slice(0, 2))}
                keyboardType="number-pad" maxLength={2} placeholder="MM" placeholderTextColor="#555" />
            </View>
            <TextInput style={styles.labelInput} value={alarmLabel} onChangeText={setAlarmLabel}
              placeholder="Label (e.g., Morning Workout)" placeholderTextColor="#555" />
            <Text style={styles.repeatLabel}>Repeat</Text>
            <View style={styles.repeatRow}>
              {DAYS.map((day: any) => (
                <TouchableOpacity key={day} style={[styles.repeatDay, alarmRepeat.includes(day) && styles.repeatDayActive]}
                  onPress={() => setAlarmRepeat(prev => prev.includes(day) ? prev.filter((d: any) => d !== day) : [...prev, day])}>
                  <Text style={[styles.repeatDayText, alarmRepeat.includes(day) && styles.repeatDayTextActive]}>{day}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalBtnSecondary} onPress={() => setShowAlarmModal(false)}>
                <Text style={styles.modalBtnSecondaryText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalBtnPrimary} onPress={addAlarm}>
                <Text style={styles.modalBtnPrimaryText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* ─── BOTTOM TABS ─── */}
      <View style={styles.bottomTabs}>
        {[
          { key: 'clock' as const, icon: 'time-outline', label: 'World' },
          { key: 'alarm' as const, icon: 'alarm-outline', label: 'Alarm' },
          { key: 'timer' as const, icon: 'hourglass-outline', label: 'Timer' },
          { key: 'stopwatch' as const, icon: 'stopwatch-outline', label: 'Stopwatch' },
        ].map((tab) => (
          <TouchableOpacity key={tab.key} style={styles.tabItem} onPress={() => setActiveTab(tab.key)}>
            <Ionicons name={tab.icon as any} size={24} color={activeTab === tab.key ? '#E91E63' : '#666'} />
            <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 16 },
  headerTitle: { color: '#fff', fontSize: 32, fontWeight: '700' },

  mainClock: { alignItems: 'center', paddingVertical: 30 },
  timeText: { color: '#fff', fontSize: 72, fontWeight: '200', letterSpacing: -2 },
  secondsText: { color: '#E91E63', fontSize: 36, fontWeight: '300', marginTop: -8 },
  dateText: { color: '#888', fontSize: 16, marginTop: 10 },

  worldClockList: { flex: 1, paddingHorizontal: 20 },
  sectionTitle: { color: '#888', fontSize: 13, fontWeight: '600', textTransform: 'uppercase', marginBottom: 12 },
  worldClockItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: '#222' },
  cityText: { color: '#fff', fontSize: 17, fontWeight: '500' },
  offsetText: { color: '#666', fontSize: 12, marginTop: 2 },
  worldTimeText: { color: '#fff', fontSize: 26, fontWeight: '300' },

  tabContent: { flex: 1, paddingHorizontal: 20 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: -40 },
  emptyText: { color: '#666', fontSize: 20, fontWeight: '600', marginTop: 16 },
  emptySubtext: { color: '#444', fontSize: 14, marginTop: 6 },

  alarmItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 18, borderBottomWidth: 0.5, borderBottomColor: '#222' },
  alarmInfo: { flex: 1 },
  alarmTime: { color: '#fff', fontSize: 36, fontWeight: '200' },
  alarmTimeDisabled: { color: '#444' },
  alarmLabel: { color: '#888', fontSize: 14, marginTop: 2 },
  alarmRepeat: { color: '#E91E63', fontSize: 12, marginTop: 2 },
  alarmActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  toggleBtn: { width: 50, height: 28, borderRadius: 14, backgroundColor: '#333', justifyContent: 'center', paddingHorizontal: 3 },
  toggleBtnOn: { backgroundColor: '#E91E63' },
  toggleKnob: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff', transform: [{ translateX: 0 }] },
  toggleKnobOn: { transform: [{ translateX: 22 }] },
  deleteBtn: { padding: 8 },

  timerDisplay: { alignItems: 'center', paddingVertical: 40 },
  timerText: { color: '#fff', fontSize: 64, fontWeight: '200' },
  timerBar: { width: '80%', height: 4, backgroundColor: '#222', borderRadius: 2, marginTop: 20 },
  timerBarFill: { height: '100%', backgroundColor: '#E91E63', borderRadius: 2 },
  timerPresets: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: 20 },
  presetBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 16, backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#333' },
  presetBtnActive: { backgroundColor: '#E91E63', borderColor: '#E91E63' },
  presetText: { color: '#888', fontSize: 14, fontWeight: '500' },
  presetTextActive: { color: '#fff' },
  timerControls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 30, marginTop: 40 },
  timerBtn: { padding: 8 },
  timerMainBtn: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#E91E63', alignItems: 'center', justifyContent: 'center' },
  timerMainBtnActive: { backgroundColor: '#ff9800' },
  resetBtn: { alignSelf: 'center', marginTop: 24, paddingVertical: 10, paddingHorizontal: 24, borderRadius: 20, backgroundColor: '#1a1a1a' },
  resetText: { color: '#888', fontSize: 14 },

  stopwatchDisplay: { alignItems: 'center', paddingVertical: 40 },
  stopwatchText: { color: '#fff', fontSize: 52, fontWeight: '200' },
  stopwatchControls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 40 },
  stopwatchMainBtn: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#E91E63', alignItems: 'center', justifyContent: 'center' },
  stopwatchMainBtnActive: { backgroundColor: '#ff9800' },
  lapBtn: { alignItems: 'center', gap: 6 },
  lapText: { color: '#E91E63', fontSize: 12 },
  lapList: { flex: 1, marginTop: 20 },
  lapHeader: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: '#333' },
  lapHeaderText: { flex: 1, color: '#666', fontSize: 12, textAlign: 'center', fontWeight: '600' },
  lapRow: { flexDirection: 'row', paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: '#1a1a1a' },
  lapCell: { flex: 1, color: '#fff', fontSize: 14, textAlign: 'center' },

  modalOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.8)', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  modalContent: { width: '85%', backgroundColor: '#1a1a1a', borderRadius: 20, padding: 24, borderWidth: 1, borderColor: '#333' },
  modalTitle: { color: '#fff', fontSize: 20, fontWeight: '700', marginBottom: 20, textAlign: 'center' },
  timeInputRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 20 },
  timeInput: { width: 70, height: 60, backgroundColor: '#0a0a0a', borderRadius: 12, color: '#fff', fontSize: 32, textAlign: 'center', borderWidth: 1, borderColor: '#333' },
  timeColon: { color: '#fff', fontSize: 32, fontWeight: '300' },
  labelInput: { backgroundColor: '#0a0a0a', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, color: '#fff', fontSize: 15, borderWidth: 1, borderColor: '#333', marginBottom: 16 },
  repeatLabel: { color: '#888', fontSize: 13, marginBottom: 8 },
  repeatRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  repeatDay: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#0a0a0a', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#333' },
  repeatDayActive: { backgroundColor: '#E91E63', borderColor: '#E91E63' },
  repeatDayText: { color: '#666', fontSize: 11, fontWeight: '600' },
  repeatDayTextActive: { color: '#fff' },
  modalActions: { flexDirection: 'row', gap: 12 },
  modalBtnSecondary: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#0a0a0a', alignItems: 'center', borderWidth: 1, borderColor: '#333' },
  modalBtnSecondaryText: { color: '#888', fontSize: 15, fontWeight: '600' },
  modalBtnPrimary: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#E91E63', alignItems: 'center' },
  modalBtnPrimaryText: { color: '#fff', fontSize: 15, fontWeight: '600' },

  bottomTabs: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#222', paddingVertical: 8, paddingBottom: 24 },
  tabItem: { flex: 1, alignItems: 'center', gap: 4 },
  tabLabel: { color: '#666', fontSize: 11 },
  tabLabelActive: { color: '#E91E63' },
});