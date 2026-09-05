import React, { useState } from 'react';
import { Alert, View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import EducationService from "@/lib/services/education-service";
import { Ionicons } from '@expo/vector-icons';

const DAYS = [
  { label: "Sunday", value: 0 },
  { label: "Monday", value: 1 },
  { label: "Tuesday", value: 2 },
  { label: "Wednesday", value: 3 },
  { label: "Thursday", value: 4 },
  { label: "Friday", value: 5 },
  { label: "Saturday", value: 6 },
];

export default function CreateTimetableScreen() {
  const router = useRouter();
  const [institutionId, setInstitutionId] = useState("");
  const [classId, setClassId] = useState("");
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("09:00");
  const [subject, setSubject] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [room, setRoom] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!institutionId.trim() || !subject.trim()) {
      Alert.alert("Error", "Institution ID and Subject are required");
      return;
    }
    try {
      setLoading(true);
      await EducationService.createTimetableEntry({
        institution_id: institutionId.trim(),
        class_id: classId.trim() || undefined,
        day_of_week: dayOfWeek,
        start_time: startTime,
        end_time: endTime,
        subject: subject.trim(),
        teacher_id: teacherId.trim() || undefined,
        room: room.trim() || undefined,
        status: "active",
      });
      Alert.alert("Success", "Timetable entry created", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to create timetable entry");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#0f172a" }}>
      <View style={{ paddingTop: 48, paddingHorizontal: 16, paddingBottom: 12 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
          <Ionicons name="arrow-back" size={20} color="#94a3b8" />
          <Text style={{ color: "#94a3b8", marginLeft: 4, fontSize: 14 }}>Back</Text>
        </TouchableOpacity>
        <Text style={{ color: "#f8fafc", fontSize: 24, fontWeight: "800" }}>Add Timetable Entry</Text>
        <Text style={{ color: "#94a3b8", fontSize: 14, marginTop: 4 }}>Schedule a new class</Text>
      </View>

      <View style={{ paddingHorizontal: 16 }}>
        {[
          { label: "Institution ID", value: institutionId, setter: setInstitutionId, placeholder: "Enter institution UUID" },
          { label: "Class ID (optional)", value: classId, setter: setClassId, placeholder: "Enter class UUID" },
          { label: "Subject", value: subject, setter: setSubject, placeholder: "e.g. Mathematics" },
          { label: "Teacher ID (optional)", value: teacherId, setter: setTeacherId, placeholder: "Enter teacher UUID" },
          { label: "Room (optional)", value: room, setter: setRoom, placeholder: "e.g. Room 101" },
        ].map((field) => (
          <View key={field.label} style={{ backgroundColor: "#1e293b", borderRadius: 12, padding: 16, marginBottom: 12 }}>
            <Text style={{ color: "#94a3b8", fontSize: 12, fontWeight: "600", marginBottom: 8, textTransform: "uppercase" }}>{field.label}</Text>
            <TextInput
              value={field.value}
              onChangeText={field.setter}
              placeholder={field.placeholder}
              placeholderTextColor="#475569"
              style={{ backgroundColor: "#0f172a", borderRadius: 8, padding: 12, color: "#f8fafc", fontSize: 15, borderWidth: 1, borderColor: "#334155" }}
            />
          </View>
        ))}

        <View style={{ backgroundColor: "#1e293b", borderRadius: 12, padding: 16, marginBottom: 12 }}>
          <Text style={{ color: "#94a3b8", fontSize: 12, fontWeight: "600", marginBottom: 8, textTransform: "uppercase" }}>Day of Week</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            {DAYS.map((d) => (
              <TouchableOpacity
                key={d.value}
                onPress={() => setDayOfWeek(d.value)}
                style={{
                  backgroundColor: dayOfWeek === d.value ? "#0ea5e9" : "#0f172a",
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 8,
                  margin: 4,
                  borderWidth: 1,
                  borderColor: dayOfWeek === d.value ? "#0ea5e9" : "#334155",
                }}
              >
                <Text style={{ color: dayOfWeek === d.value ? "#fff" : "#94a3b8", fontSize: 13, fontWeight: "600" }}>{d.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ flexDirection: "row", marginBottom: 24 }}>
          <View style={{ flex: 1, backgroundColor: "#1e293b", borderRadius: 12, padding: 16, marginRight: 8 }}>
            <Text style={{ color: "#94a3b8", fontSize: 12, fontWeight: "600", marginBottom: 8, textTransform: "uppercase" }}>Start Time</Text>
            <TextInput
              value={startTime}
              onChangeText={setStartTime}
              placeholder="08:00"
              placeholderTextColor="#475569"
              style={{ backgroundColor: "#0f172a", borderRadius: 8, padding: 12, color: "#f8fafc", fontSize: 15, borderWidth: 1, borderColor: "#334155" }}
            />
          </View>
          <View style={{ flex: 1, backgroundColor: "#1e293b", borderRadius: 12, padding: 16, marginLeft: 8 }}>
            <Text style={{ color: "#94a3b8", fontSize: 12, fontWeight: "600", marginBottom: 8, textTransform: "uppercase" }}>End Time</Text>
            <TextInput
              value={endTime}
              onChangeText={setEndTime}
              placeholder="09:00"
              placeholderTextColor="#475569"
              style={{ backgroundColor: "#0f172a", borderRadius: 8, padding: 12, color: "#f8fafc", fontSize: 15, borderWidth: 1, borderColor: "#334155" }}
            />
          </View>
        </View>

        <TouchableOpacity
          onPress={handleCreate}
          disabled={loading}
          style={{ backgroundColor: loading ? "#1e3a5f" : "#0ea5e9", borderRadius: 12, padding: 16, alignItems: "center", marginBottom: 32, flexDirection: "row", justifyContent: "center" }}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="add" size={18} color="#fff" />
              <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700", marginLeft: 8 }}>Add Entry</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
