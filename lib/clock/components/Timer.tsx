import React, { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { Ionicons } from '@expo/vector-icons';

interface Lap {
  id: number;
  time: string;
  split: string;
}

export default function TimerComponent() {
  const [mode, setMode] = useState<"stopwatch" | "timer">("stopwatch");
  const [stopwatchTime, setStopwatchTime] = useState(0);
  const [stopwatchRunning, setStopwatchRunning] = useState(false);
  const [laps, setLaps] = useState<Lap[]>([]);
  const [timerDuration, setTimerDuration] = useState(0);
  const [timerRemaining, setTimerRemaining] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (stopwatchRunning) {
      intervalRef.current = setInterval(() => {
        setStopwatchTime((prev) => prev + 10);
      }, 10);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [stopwatchRunning]);

  useEffect(() => {
    if (timerRunning && timerRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimerRemaining((prev) => {
          if (prev <= 1) {
            setTimerRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [timerRunning, timerRemaining]);

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const centis = Math.floor((ms % 1000) / 10);
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}.${centis.toString().padStart(2, "0")}`;
  };

  const formatTimer = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleLap = () => {
    const current = formatTime(stopwatchTime);
    const lastLapTime = laps.length > 0 ? stopwatchTime - laps.reduce((sum, l) => {
      const parts = l.split.split(":");
      const ms = parseInt(parts[0]) * 60000 + parseInt(parts[1]) * 1000 + parseInt(parts[2]) * 10;
      return sum + ms;
    }, 0) : stopwatchTime;
    setLaps((prev) => [
      { id: prev.length + 1, time: current, split: formatTime(lastLapTime) },
      ...prev,
    ]);
  };

  const handleTimerPreset = (minutes: number) => {
    setTimerDuration(minutes * 60);
    setTimerRemaining(minutes * 60);
    setTimerRunning(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, mode === "stopwatch" && styles.tabActive]} onPress={() => setMode("stopwatch")}>
          <Text style={[styles.tabText, mode === "stopwatch" && styles.tabTextActive]}>Stopwatch</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, mode === "timer" && styles.tabActive]} onPress={() => setMode("timer")}>
          <Text style={[styles.tabText, mode === "timer" && styles.tabTextActive]}>Timer</Text>
        </TouchableOpacity>
      </View>

      {mode === "stopwatch" && (
        <>
          <View style={styles.displayArea}>
            <Text style={styles.display}>{formatTime(stopwatchTime)}</Text>
          </View>
          <View style={styles.controls}>
            <TouchableOpacity style={[styles.controlBtn, stopwatchRunning ? styles.pauseBtn : styles.startBtn]} onPress={() => setStopwatchRunning(!stopwatchRunning)}>
              <Ionicons name={stopwatchRunning ? "pause" : "play"} size={24} color="#fff" />
              <Text style={styles.controlText}>{stopwatchRunning ? "Pause" : "Start"}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.controlBtn, styles.lapBtn]} onPress={handleLap} disabled={!stopwatchRunning}>
              <Ionicons name="flag" size={24} color="#fff" />
              <Text style={styles.controlText}>Lap</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.controlBtn, styles.resetBtn]} onPress={() => { setStopwatchRunning(false); setStopwatchTime(0); setLaps([]); }}>
              <Ionicons name="refresh" size={24} color="#fff" />
              <Text style={styles.controlText}>Reset</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.lapList}>
            {laps.map((lap) => (
              <View key={lap.id} style={styles.lapRow}>
                <Text style={styles.lapNum}>Lap {lap.id}</Text>
                <Text style={styles.lapSplit}>{lap.split}</Text>
                <Text style={styles.lapTime}>{lap.time}</Text>
              </View>
            ))}
          </ScrollView>
        </>
      )}

      {mode === "timer" && (
        <>
          <View style={styles.displayArea}>
            <Text style={styles.display}>{formatTimer(timerRemaining)}</Text>
          </View>
          <View style={styles.presets}>
            {[1, 5, 10, 15, 25, 30].map((min) => (
              <TouchableOpacity key={min} style={styles.presetBtn} onPress={() => handleTimerPreset(min)}>
                <Text style={styles.presetText}>{min}m</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.controls}>
            <TouchableOpacity style={[styles.controlBtn, timerRunning ? styles.pauseBtn : styles.startBtn]} onPress={() => setTimerRunning(!timerRunning)} disabled={timerRemaining === 0}>
              <Ionicons name={timerRunning ? "pause" : "play"} size={24} color="#fff" />
              <Text style={styles.controlText}>{timerRunning ? "Pause" : "Start"}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.controlBtn, styles.resetBtn]} onPress={() => { setTimerRunning(false); setTimerRemaining(timerDuration); }}>
              <Ionicons name="refresh" size={24} color="#fff" />
              <Text style={styles.controlText}>Reset</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a" },
  tabs: { flexDirection: "row", justifyContent: "center", gap: 24, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#1a1a1a" },
  tab: { paddingHorizontal: 16, paddingVertical: 8 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: "#6366F1" },
  tabText: { color: "#64748B", fontSize: 14, fontWeight: "600" },
  tabTextActive: { color: "#6366F1" },
  displayArea: { alignItems: "center", paddingVertical: 40 },
  display: { color: "#fff", fontSize: 56, fontWeight: "200", fontVariant: ["tabular-nums"] },
  controls: { flexDirection: "row", justifyContent: "center", gap: 16, paddingHorizontal: 16 },
  controlBtn: { alignItems: "center", justifyContent: "center", width: 80, height: 80, borderRadius: 40 },
  startBtn: { backgroundColor: "#22C55E" },
  pauseBtn: { backgroundColor: "#F59E0B" },
  lapBtn: { backgroundColor: "#6366F1" },
  resetBtn: { backgroundColor: "#EF4444" },
  controlText: { color: "#fff", fontSize: 12, fontWeight: "600", marginTop: 4 },
  lapList: { flex: 1, marginTop: 16 },
  lapRow: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#1a1a1a" },
  lapNum: { color: "#64748B", fontSize: 14, width: 60 },
  lapSplit: { color: "#fff", fontSize: 14, fontWeight: "600" },
  lapTime: { color: "#94A3B8", fontSize: 14 },
  presets: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 8, paddingHorizontal: 16, marginBottom: 16 },
  presetBtn: { backgroundColor: "#1a1a1a", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 },
  presetText: { color: "#fff", fontSize: 14, fontWeight: "600" },
});
