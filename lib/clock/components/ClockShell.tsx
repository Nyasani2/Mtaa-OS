import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Switch, TextInput, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface Alarm {
  id: string;
  time: string;
  label: string;
  enabled: boolean;
  repeat: string[];
}

interface WorldClockItem {
  id: string;
  city: string;
  timezone: string;
  offset: number;
}

export default function ClockShell() {
  const [tab, setTab] = useState<"alarm" | "world" | "timer">("alarm");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [alarms, setAlarms] = useState<Alarm[]>([
    { id: "1", time: "06:00", label: "Morning", enabled: true, repeat: ["Mon", "Tue", "Wed", "Thu", "Fri"] },
    { id: "2", time: "07:30", label: "Workout", enabled: false, repeat: ["Sat", "Sun"] },
  ]);
  const [worldClocks, setWorldClocks] = useState<WorldClockItem[]>([
    { id: "1", city: "London", timezone: "Europe/London", offset: -3 },
    { id: "2", city: "New York", timezone: "America/New_York", offset: -7 },
    { id: "3", city: "Tokyo", timezone: "Asia/Tokyo", offset: +6 },
  ]);

  // Timer state
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerInput, setTimerInput] = useState("");
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Timer logic
  useEffect(() => {
    if (timerRunning && timerSeconds > 0) {
      const id = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            setTimerRunning(false);
            Alert.alert("Timer Done", "Your timer has finished!");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      setTimerInterval(id);
      return () => clearInterval(id);
    } else if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }
  }, [timerRunning, timerSeconds]);

  const toggleAlarm = (id: string) => {
    setAlarms((prev) =>
      prev.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a))
    );
  };

  const deleteAlarm = (id: string) => {
    setAlarms((prev) => prev.filter((a) => a.id !== id));
  };

  const addAlarm = () => {
    const newAlarm: Alarm = {
      id: Date.now().toString(),
      time: "08:00",
      label: "New Alarm",
      enabled: true,
      repeat: [],
    };
    setAlarms((prev) => [...prev, newAlarm]);
  };

  const getWorldTime = (timezone: string, offset: number) => {
    const now = new Date();
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    const targetTime = new Date(utc + offset * 3600000);
    return targetTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });
  };

  const formatTimer = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const startTimer = () => {
    const mins = parseInt(timerInput) || 0;
    if (mins > 0) {
      setTimerSeconds(mins * 60);
      setTimerRunning(true);
      setTimerInput("");
    }
  };

  const pauseTimer = () => setTimerRunning(false);
  const resetTimer = () => {
    setTimerRunning(false);
    setTimerSeconds(0);
    setTimerInput("");
  };

  return (
    <View style={styles.container}>
      <View style={styles.timeHeader}>
        <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
        <Text style={styles.dateText}>{formatDate(currentTime)}</Text>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, tab === "alarm" && styles.tabActive]} onPress={() => setTab("alarm")}>
          <Text style={[styles.tabText, tab === "alarm" && styles.tabTextActive]}>Alarm</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tab === "world" && styles.tabActive]} onPress={() => setTab("world")}>
          <Text style={[styles.tabText, tab === "world" && styles.tabTextActive]}>World Clock</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tab === "timer" && styles.tabActive]} onPress={() => setTab("timer")}>
          <Text style={[styles.tabText, tab === "timer" && styles.tabTextActive]}>Timer</Text>
        </TouchableOpacity>
      </View>

      {tab === "alarm" && (
        <>
          <FlatList
            data={alarms}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.alarmRow}>
                <View style={styles.alarmLeft}>
                  <Text style={styles.alarmTime}>{item.time}</Text>
                  <Text style={styles.alarmLabel}>{item.label}</Text>
                  <Text style={styles.alarmRepeat}>{item.repeat.join(", ") || "Once"}</Text>
                </View>
                <View style={styles.alarmRight}>
                  <Switch value={item.enabled} onValueChange={() => toggleAlarm(item.id)} trackColor={{ false: "#334155", true: "#6366F1" }} />
                  <TouchableOpacity onPress={() => deleteAlarm(item.id)} style={styles.deleteBtn}>
                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
            ListEmptyComponent={<Text style={styles.emptyText}>No alarms set</Text>}
          />
          <TouchableOpacity style={styles.addBtn} onPress={addAlarm}>
            <Ionicons name="add" size={24} color="#fff" />
            <Text style={styles.addText}>Add Alarm</Text>
          </TouchableOpacity>
        </>
      )}

      {tab === "world" && (
        <FlatList
          data={worldClocks}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.worldRow}>
              <View>
                <Text style={styles.worldCity}>{item.city}</Text>
                <Text style={styles.worldOffset}>{item.offset >= 0 ? `+${item.offset}` : item.offset} hrs</Text>
              </View>
              <Text style={styles.worldTime}>{getWorldTime(item.timezone, item.offset)}</Text>
            </View>
          )}
        />
      )}

      {tab === "timer" && (
        <View style={styles.timerContainer}>
          <Text style={styles.timerDisplay}>{formatTimer(timerSeconds)}</Text>
          {!timerRunning && timerSeconds === 0 && (
            <View style={styles.timerInputWrap}>
              <TextInput
                style={styles.timerInput}
                placeholder="Minutes"
                placeholderTextColor="#64748B"
                keyboardType="numeric"
                value={timerInput}
                onChangeText={setTimerInput}
              />
              <TouchableOpacity style={styles.timerStartBtn} onPress={startTimer}>
                <Text style={styles.timerStartText}>Start</Text>
              </TouchableOpacity>
            </View>
          )}
          {(timerRunning || timerSeconds > 0) && (
            <View style={styles.timerControls}>
              <TouchableOpacity style={[styles.timerBtn, timerRunning && styles.timerBtnPause]} onPress={timerRunning ? pauseTimer : () => setTimerRunning(true)}>
                <Text style={styles.timerBtnText}>{timerRunning ? "Pause" : "Resume"}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.timerBtnReset} onPress={resetTimer}>
                <Text style={styles.timerBtnText}>Reset</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a" },
  timeHeader: { alignItems: "center", paddingVertical: 24 },
  timeText: { color: "#fff", fontSize: 48, fontWeight: "200", fontVariant: ["tabular-nums"] },
  dateText: { color: "#94A3B8", fontSize: 16, marginTop: 8 },
  tabs: { flexDirection: "row", justifyContent: "center", gap: 24, paddingVertical: 12, borderTopWidth: 1, borderTopColor: "#1a1a1a", borderBottomWidth: 1, borderBottomColor: "#1a1a1a" },
  tab: { paddingHorizontal: 16, paddingVertical: 8 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: "#6366F1" },
  tabText: { color: "#64748B", fontSize: 14, fontWeight: "600" },
  tabTextActive: { color: "#6366F1" },
  alarmRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: "#1a1a1a" },
  alarmLeft: { flex: 1 },
  alarmTime: { color: "#fff", fontSize: 32, fontWeight: "300" },
  alarmLabel: { color: "#94A3B8", fontSize: 14, marginTop: 2 },
  alarmRepeat: { color: "#64748B", fontSize: 12, marginTop: 2 },
  alarmRight: { flexDirection: "row", alignItems: "center", gap: 12 },
  deleteBtn: { padding: 8 },
  addBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginHorizontal: 16, marginTop: 16, padding: 14, backgroundColor: "#6366F1", borderRadius: 12 },
  addText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  emptyText: { color: "#64748B", textAlign: "center", marginTop: 40, fontSize: 15 },
  worldRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: "#1a1a1a" },
  worldCity: { color: "#fff", fontSize: 18, fontWeight: "600" },
  worldOffset: { color: "#64748B", fontSize: 12, marginTop: 2 },
  worldTime: { color: "#fff", fontSize: 24, fontWeight: "300" },
  timerContainer: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 24 },
  timerDisplay: { color: "#fff", fontSize: 64, fontWeight: "200", fontVariant: ["tabular-nums"], marginBottom: 32 },
  timerInputWrap: { flexDirection: "row", gap: 12, width: "100%" },
  timerInput: { flex: 1, backgroundColor: "#1a1a1a", borderRadius: 12, padding: 14, color: "#fff", fontSize: 18, textAlign: "center" },
  timerStartBtn: { backgroundColor: "#6366F1", paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12, justifyContent: "center" },
  timerStartText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  timerControls: { flexDirection: "row", gap: 16 },
  timerBtn: { backgroundColor: "#6366F1", paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12 },
  timerBtnPause: { backgroundColor: "#F59E0B" },
  timerBtnReset: { backgroundColor: "#EF4444", paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12 },
  timerBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
