import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, FlatList, TextInput, Alert } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  type: "personal" | "work" | "reminder";
}

const TYPE_COLORS: Record<string, string> = {
  personal: "#6366F1",
  work: "#22C55E",
  reminder: "#F59E0B",
};

export default function SchedulerShell() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([
    { id: "1", title: "Team Meeting", date: "2026-05-26", time: "10:00", type: "work" },
    { id: "2", title: "Doctor Appointment", date: "2026-05-27", time: "14:30", type: "personal" },
    { id: "3", title: "Pay Rent", date: "2026-05-30", time: "09:00", type: "reminder" },
  ]);
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [newType, setNewType] = useState<"personal" | "work" | "reminder">("personal");

  const handleAdd = () => {
    if (!newTitle || !newDate || !newTime) {
      Alert.alert("Error", "Fill all fields");
      return;
    }
    const event: Event = {
      id: Date.now().toString(),
      title: newTitle,
      date: newDate,
      time: newTime,
      type: newType,
    };
    setEvents((prev) => [...prev, event].sort((a, b) => a.date.localeCompare(b.date)));
    setNewTitle("");
    setNewDate("");
    setNewTime("");
    setShowAdd(false);
  };

  const handleDelete = (id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Scheduler</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAdd(!showAdd)}>
          <Ionicons name={showAdd ? "close" : "add"} size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {showAdd && (
        <View style={styles.addForm}>
          <TextInput style={styles.input} placeholder="Event title" placeholderTextColor="#64748B" value={newTitle} onChangeText={setNewTitle} />
          <TextInput style={styles.input} placeholder="Date (YYYY-MM-DD)" placeholderTextColor="#64748B" value={newDate} onChangeText={setNewDate} />
          <TextInput style={styles.input} placeholder="Time (HH:MM)" placeholderTextColor="#64748B" value={newTime} onChangeText={setNewTime} />
          <View style={styles.typeRow}>
            {(["personal", "work", "reminder"] as const).map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.typeChip, newType === t && { backgroundColor: TYPE_COLORS[t] }]}
                onPress={() => setNewType(t)}
              >
                <Text style={[styles.typeText, newType === t && { color: "#fff" }]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={styles.saveBtn} onPress={handleAdd}>
            <Text style={styles.saveText}>Add Event</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.eventRow}>
            <View style={[styles.eventDot, { backgroundColor: TYPE_COLORS[item.type] }]} />
            <View style={styles.eventInfo}>
              <Text style={styles.eventTitle}>{item.title}</Text>
              <Text style={styles.eventMeta}>{item.date} • {item.time}</Text>
            </View>
            <TouchableOpacity onPress={() => handleDelete(item.id)}>
              <Ionicons name="trash-outline" size={18} color="#EF4444" />
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No events scheduled</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingTop: 60, paddingBottom: 16 },
  headerTitle: { color: "#fff", fontSize: 22, fontWeight: "700" },
  addBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#6366F1", justifyContent: "center", alignItems: "center" },
  addForm: { paddingHorizontal: 16, paddingBottom: 16, gap: 8 },
  input: { backgroundColor: "#1a1a1a", borderRadius: 12, padding: 14, color: "#fff", fontSize: 15 },
  typeRow: { flexDirection: "row", gap: 8 },
  typeChip: { flex: 1, backgroundColor: "#1a1a1a", padding: 10, borderRadius: 8, alignItems: "center" },
  typeText: { color: "#94A3B8", fontSize: 13, fontWeight: "600" },
  saveBtn: { backgroundColor: "#6366F1", padding: 14, borderRadius: 12, alignItems: "center", marginTop: 4 },
  saveText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  eventRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#1a1a1a" },
  eventDot: { width: 8, height: 8, borderRadius: 4, marginRight: 12 },
  eventInfo: { flex: 1 },
  eventTitle: { color: "#fff", fontSize: 15, fontWeight: "600" },
  eventMeta: { color: "#64748B", fontSize: 12, marginTop: 2 },
  emptyText: { color: "#64748B", textAlign: "center", marginTop: 40, fontSize: 15 },
});
