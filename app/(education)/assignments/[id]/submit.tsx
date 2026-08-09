import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAuthStore } from "@/lib/auth/store/auth.store";
import EducationService from "@/lib/services/education-service";
import { Ionicons } from "@expo/vector-icons";

export default function SubmitAssignmentScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const [submissionText, setSubmissionText] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!id || typeof id !== "string") return;
    if (!submissionText.trim() && !fileUrl.trim()) {
      Alert.alert("Error", "Please enter submission text or provide a file URL");
      return;
    }
    try {
      setLoading(true);
      await EducationService.submitAssignment({
        assignment_id: id,
        student_id: user?.id || "",
        submission_text: submissionText.trim() || undefined,
        file_url: fileUrl.trim() || undefined,
      });
      Alert.alert("Success", "Assignment submitted successfully", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to submit assignment");
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
        <Text style={{ color: "#f8fafc", fontSize: 24, fontWeight: "800" }}>Submit Assignment</Text>
        <Text style={{ color: "#94a3b8", fontSize: 14, marginTop: 4 }}>Assignment ID: {id}</Text>
      </View>

      <View style={{ paddingHorizontal: 16 }}>
        <View style={{ backgroundColor: "#1e293b", borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <Text style={{ color: "#94a3b8", fontSize: 12, fontWeight: "600", marginBottom: 8, textTransform: "uppercase" }}>Your Answer</Text>
          <TextInput
            value={submissionText}
            onChangeText={setSubmissionText}
            placeholder="Type your answer here..."
            placeholderTextColor="#475569"
            multiline
            numberOfLines={8}
            style={{
              backgroundColor: "#0f172a",
              borderRadius: 8,
              padding: 12,
              color: "#f8fafc",
              fontSize: 15,
              textAlignVertical: "top",
              minHeight: 160,
              borderWidth: 1,
              borderColor: "#334155",
            }}
          />
        </View>

        <View style={{ backgroundColor: "#1e293b", borderRadius: 12, padding: 16, marginBottom: 24 }}>
          <Text style={{ color: "#94a3b8", fontSize: 12, fontWeight: "600", marginBottom: 8, textTransform: "uppercase" }}>Attachment URL (optional)</Text>
          <TextInput
            value={fileUrl}
            onChangeText={setFileUrl}
            placeholder="https://..."
            placeholderTextColor="#475569"
            style={{
              backgroundColor: "#0f172a",
              borderRadius: 8,
              padding: 12,
              color: "#f8fafc",
              fontSize: 15,
              borderWidth: 1,
              borderColor: "#334155",
            }}
          />
        </View>

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={loading}
          style={{
            backgroundColor: loading ? "#1e3a5f" : "#0ea5e9",
            borderRadius: 12,
            padding: 16,
            alignItems: "center",
            marginBottom: 32,
            flexDirection: "row",
            justifyContent: "center",
          }}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="send" size={18} color="#fff" />
              <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700", marginLeft: 8 }}>Submit</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
